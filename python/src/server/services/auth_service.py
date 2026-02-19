"""
Authentication Service

Handles login, logout, password management
"""

import hashlib
import logging
import re
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

import bcrypt

from ..utils import get_supabase_client

logger = logging.getLogger(__name__)


class AuthService:
    """Service for authentication"""

    def __init__(self, supabase_client=None):
        self.client = supabase_client or get_supabase_client()

    @staticmethod
    def _normalize_org_name(name: str) -> str:
        """Normalize org name for uniqueness comparison: trim, lowercase, collapse spaces."""
        return re.sub(r'\s+', ' ', name.strip()).lower()

    def hash_password(self, password: str) -> str:
        """Hash password using bcrypt with salt"""
        salt = bcrypt.gensalt()
        hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
        return hashed.decode('utf-8')

    def verify_password(self, password: str, password_hash: str) -> bool:
        """Verify password against bcrypt hash"""
        try:
            return bcrypt.checkpw(password.encode('utf-8'), password_hash.encode('utf-8'))
        except Exception as e:
            logger.error(f"Password verification failed: {e}")
            return False

    def register_user(
        self,
        email: str,
        display_name: str,
        password: str,
        org_name: Optional[str] = None,
    ) -> dict[str, Any]:
        """
        Register a new user (first user or via invitation).

        If org_name provided, creates organization and makes user owner.
        """
        user_id = None
        org_id = None
        dept_id = None
        team_id = None

        try:
            # Check if user exists
            existing = (
                self.client.table("archon_users_profile")
                .select("id")
                .eq("email", email)
                .execute()
            )

            if existing.data:
                raise ValueError("User with this email already exists")

            # Hash password
            password_hash = self.hash_password(password)

            # Create user
            user_data = {
                "email": email,
                "display_name": display_name,
                "password_hash": password_hash,
                "user_type": "human",
                "status": "active",
            }

            user_response = self.client.table("archon_users_profile").insert(user_data).execute()

            if not user_response.data:
                raise Exception("Failed to create user")

            user = user_response.data[0]
            user_id = user["id"]

            # If org_name provided, create organization with default structure
            if org_name:
                normalized_name = self._normalize_org_name(org_name)

                # Check for duplicate org name (normalized comparison)
                all_orgs = self.client.table("archon_organizations").select("name").execute()
                for existing_org in (all_orgs.data or []):
                    if self._normalize_org_name(existing_org["name"]) == normalized_name:
                        raise ValueError(f"Organization name '{org_name}' already exists")

                org_data = {
                    "name": org_name,
                    "slug": normalized_name.replace(" ", "-"),
                    "owner_id": user["id"],
                }

                org_response = self.client.table("archon_organizations").insert(org_data).execute()

                if not org_response.data:
                    raise Exception("Failed to create organization")

                org = org_response.data[0]
                org_id = org["id"]

                # Create default department
                dept_response = self.client.table("archon_departments").insert({
                    "org_id": org["id"],
                    "name": "General",
                    "head_id": user["id"],
                }).execute()

                if not dept_response.data:
                    raise Exception("Failed to create department")

                dept = dept_response.data[0]
                dept_id = dept["id"]

                # Create default team
                team_response = self.client.table("archon_teams").insert({
                    "department_id": dept["id"],
                    "name": "General",
                    "lead_id": user["id"],
                }).execute()

                if not team_response.data:
                    raise Exception("Failed to create team")

                team = team_response.data[0]
                team_id = team["id"]

                # Add user as owner member with team assignment
                membership_response = self.client.table("archon_org_memberships").insert({
                    "user_id": user["id"],
                    "org_id": org["id"],
                    "org_role": "owner",
                    "status": "active",
                    "team_id": team["id"],
                }).execute()

                if not membership_response.data:
                    raise Exception("Failed to create organization membership")

                logger.info(
                    f"User registered with org structure | user={user['id']} | "
                    f"org={org['id']} | dept={dept['id']} | team={team['id']}"
                )

                # Send verification email after successful org creation
                self._send_verification_email(user["id"], email, display_name)

                return {
                    "user": user,
                    "organization": org,
                    "department": dept,
                    "team": team,
                }

            # Send verification email for users without org
            self._send_verification_email(user["id"], email, display_name)

            logger.info(f"User registered | user={user['id']}")
            return {"user": user, "organization": None}

        except ValueError as e:
            logger.warning(f"Registration failed: {e}")
            raise
        except Exception as e:
            logger.error(f"Failed to register user: {e} | Rolling back...", exc_info=True)

            # Rollback: delete created records in reverse order
            try:
                if team_id:
                    self.client.table("archon_teams").delete().eq("id", team_id).execute()
                    logger.info(f"Rolled back team creation | team_id={team_id}")

                if dept_id:
                    self.client.table("archon_departments").delete().eq("id", dept_id).execute()
                    logger.info(f"Rolled back department creation | dept_id={dept_id}")

                if org_id:
                    self.client.table("archon_organizations").delete().eq("id", org_id).execute()
                    logger.info(f"Rolled back organization creation | org_id={org_id}")

                if user_id:
                    self.client.table("archon_users_profile").delete().eq("id", user_id).execute()
                    logger.info(f"Rolled back user creation | user_id={user_id}")

            except Exception as rollback_error:
                logger.error(f"Rollback failed: {rollback_error}", exc_info=True)

            raise

    def login(self, email: str, password: str, role: Optional[str] = None) -> dict[str, Any]:
        """
        Login user with email and password.

        Optionally validates that the user holds the specified role in their org.
        Returns user info, session token, and org membership details.
        """
        try:
            # Get user by email
            response = (
                self.client.table("archon_users_profile")
                .select("*")
                .eq("email", email)
                .execute()
            )

            if not response.data:
                raise ValueError("Invalid email or password")

            user = response.data[0]

            # Check if user has password (might be invited user without password yet)
            if not user.get("password_hash"):
                raise ValueError("Please accept your invitation first")

            # Verify password
            if not self.verify_password(password, user["password_hash"]):
                raise ValueError("Invalid email or password")

            # Check if user is active
            if user.get("status") != "active":
                raise ValueError("Account is deactivated")

            # Fetch org membership to get actual role
            membership_response = (
                self.client.table("archon_org_memberships")
                .select("org_id, org_role")
                .eq("user_id", user["id"])
                .eq("status", "active")
                .limit(1)
                .execute()
            )
            membership = membership_response.data[0] if membership_response.data else None
            actual_role = membership["org_role"] if membership else None

            # If a specific role was requested, validate it matches
            if role and actual_role and role != actual_role:
                raise ValueError("Role does not match your account")

            # Create session token
            session_token = secrets.token_urlsafe(32)

            # Store session
            session_data = {
                "user_id": user["id"],
                "session_token": session_token,
                "expires_at": (datetime.now(timezone.utc) + timedelta(days=30)).isoformat(),
            }

            self.client.table("archon_user_sessions").insert(session_data).execute()

            # Update last login
            self.client.table("archon_users_profile").update({
                "last_login_at": datetime.now(timezone.utc).isoformat(),
            }).eq("id", user["id"]).execute()

            # Persist active session for MCP tool authentication
            try:
                from ..services.credential_service import credential_service
                credential_service.set_credential(
                    key="ACTIVE_USER_ID",
                    value=user["id"],
                    is_encrypted=False,
                    category="auth",
                    description="Currently logged-in user ID for MCP tool authentication",
                )
                credential_service.set_credential(
                    key="ACTIVE_SESSION_TOKEN",
                    value=session_token,
                    is_encrypted=True,
                    category="auth",
                    description="Active session token for MCP tool authentication",
                )
            except Exception as e:
                logger.warning(f"Could not persist session to settings: {e}")

            logger.info(f"User logged in | user={user['id']} | email={email} | role={actual_role}")

            return {
                "user": {**user, "org_role": actual_role, "org_id": membership["org_id"] if membership else None},
                "session_token": session_token,
            }

        except ValueError as e:
            logger.warning(f"Login failed: {e}")
            raise
        except Exception as e:
            logger.error(f"Failed to login: {e}", exc_info=True)
            raise

    def logout(self, session_token: str) -> bool:
        """Logout user by invalidating session"""
        try:
            response = (
                self.client.table("archon_user_sessions")
                .delete()
                .eq("session_token", session_token)
                .execute()
            )

            logger.info("User logged out")
            return True

        except Exception as e:
            logger.error(f"Failed to logout: {e}", exc_info=True)
            return False

    def _send_verification_email(self, user_id: str, email: str, display_name: str) -> None:
        """Generate a verification token and send the verification email."""
        try:
            token = secrets.token_urlsafe(32)
            self.client.table("archon_email_verification_tokens").insert({
                "user_id": user_id,
                "token": token,
            }).execute()

            import os
            host = os.getenv("ARCHON_HOST", "localhost")
            port = os.getenv("ARCHON_FRONTEND_PORT", os.getenv("VITE_ARCHON_SERVER_PORT", "3737"))
            base_url = f"http://{host}:{port}"

            from .email.email_service import EmailService
            email_service = EmailService()
            sent = email_service.send_verification_email(email, display_name, token, base_url)
            if not sent:
                logger.info(f"Verification email not sent (no SMTP). Token: {token}")
        except Exception as e:
            logger.warning(f"Could not send verification email: {e}")

    def verify_email(self, token: str) -> dict[str, Any]:
        """
        Verify a user's email using the token from the verification link.

        Marks the user as email_verified and invalidates the token.
        """
        try:
            response = (
                self.client.table("archon_email_verification_tokens")
                .select("*")
                .eq("token", token)
                .is_("used_at", "null")
                .execute()
            )

            if not response.data:
                raise ValueError("Invalid or already used verification token")

            token_record = response.data[0]

            # Check expiry
            from datetime import datetime, timezone
            expires_at = datetime.fromisoformat(token_record["expires_at"].replace("Z", "+00:00"))
            if datetime.now(timezone.utc) > expires_at:
                raise ValueError("Verification link has expired. Please request a new one.")

            user_id = token_record["user_id"]

            # Mark user as verified
            self.client.table("archon_users_profile").update({
                "email_verified": True,
                "email_verified_at": datetime.now(timezone.utc).isoformat(),
            }).eq("id", user_id).execute()

            # Mark token as used
            self.client.table("archon_email_verification_tokens").update({
                "used_at": datetime.now(timezone.utc).isoformat(),
            }).eq("id", token_record["id"]).execute()

            logger.info(f"Email verified | user_id={user_id}")
            return {"verified": True, "user_id": user_id}

        except ValueError as e:
            logger.warning(f"Email verification failed: {e}")
            raise
        except Exception as e:
            logger.error(f"Failed to verify email: {e}", exc_info=True)
            raise

    def resend_verification(self, email: str) -> bool:
        """Send a new verification email for an unverified user."""
        try:
            response = (
                self.client.table("archon_users_profile")
                .select("id, display_name, email_verified")
                .eq("email", email)
                .execute()
            )

            if not response.data:
                raise ValueError("No account found with this email")

            user = response.data[0]
            if user.get("email_verified"):
                raise ValueError("Email is already verified")

            self._send_verification_email(user["id"], email, user.get("display_name", ""))
            return True

        except ValueError as e:
            logger.warning(f"Resend verification failed: {e}")
            raise
        except Exception as e:
            logger.error(f"Failed to resend verification: {e}", exc_info=True)
            raise
