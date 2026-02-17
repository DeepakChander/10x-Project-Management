"""
Authentication Service

Handles login, logout, password management
"""

import hashlib
import logging
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from ..utils import get_supabase_client

logger = logging.getLogger(__name__)


class AuthService:
    """Service for authentication"""

    def __init__(self, supabase_client=None):
        self.client = supabase_client or get_supabase_client()

    def hash_password(self, password: str) -> str:
        """Hash password using SHA-256 (simple for MVP)"""
        return hashlib.sha256(password.encode()).hexdigest()

    def verify_password(self, password: str, password_hash: str) -> bool:
        """Verify password against hash"""
        return self.hash_password(password) == password_hash

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

            # If org_name provided, create organization
            if org_name:
                org_data = {
                    "name": org_name,
                    "slug": org_name.lower().replace(" ", "-"),
                    "owner_id": user["id"],
                }

                org_response = self.client.table("archon_organizations").insert(org_data).execute()

                if org_response.data:
                    org = org_response.data[0]

                    # Add user as owner member
                    self.client.table("archon_org_memberships").insert({
                        "user_id": user["id"],
                        "org_id": org["id"],
                        "org_role": "owner",
                        "status": "active",
                    }).execute()

                    logger.info(f"User registered and organization created | user={user['id']} | org={org['id']}")

                    return {"user": user, "organization": org}

            logger.info(f"User registered | user={user['id']}")
            return {"user": user, "organization": None}

        except ValueError as e:
            logger.warning(f"Registration failed: {e}")
            raise
        except Exception as e:
            logger.error(f"Failed to register user: {e}", exc_info=True)
            raise

    def login(self, email: str, password: str) -> dict[str, Any]:
        """
        Login user with email and password.

        Returns user info and session token.
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

            logger.info(f"User logged in | user={user['id']} | email={email}")

            return {
                "user": user,
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
