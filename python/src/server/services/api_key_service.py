"""
API Key Service

Handles API key generation for agents and programmatic access
"""

import hashlib
import logging
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any, Optional

from ..utils import get_supabase_client

logger = logging.getLogger(__name__)


class APIKeyService:
    """Service for API key management"""

    def __init__(self, supabase_client=None):
        self.client = supabase_client or get_supabase_client()

    def generate_api_key(
        self,
        user_id: str,
        key_name: str,
        is_agent: bool = False,
        capabilities: Optional[dict] = None,
        supervisor_id: Optional[str] = None,
        rate_limit: int = 100,
        expires_days: Optional[int] = None,
    ) -> dict[str, Any]:
        """
        Generate API key for user or agent.

        Args:
            user_id: User/agent ID
            key_name: Human-readable name
            is_agent: Is this for an AI agent?
            capabilities: Agent capabilities dict
            supervisor_id: Supervisor for agents
            rate_limit: Requests per hour limit
            expires_days: Expiration in days (None = never)

        Returns:
            {
                "api_key": "10x_xxx...",  # Plain key (show once!)
                "key_id": "uuid",
                "key_prefix": "10x_ag_abc"
            }
        """
        try:
            # Generate secure API key
            prefix = "10x_ag_" if is_agent else "10x_usr_"
            random_part = secrets.token_urlsafe(32)
            api_key = f"{prefix}{random_part}"

            # Hash for storage
            key_hash = hashlib.sha256(api_key.encode()).hexdigest()

            # First 12 chars for identification
            key_prefix = api_key[:12]

            # Calculate expiration
            expires_at = None
            if expires_days:
                expires_at = (datetime.now(timezone.utc) + timedelta(days=expires_days)).isoformat()

            # Store in database
            key_data = {
                "user_id": user_id,
                "key_name": key_name,
                "key_hash": key_hash,
                "key_prefix": key_prefix,
                "is_agent_key": is_agent,
                "agent_capabilities": capabilities or {},
                "supervisor_id": supervisor_id,
                "rate_limit_per_hour": rate_limit,
                "expires_at": expires_at,
            }

            response = self.client.table("archon_api_keys").insert(key_data).execute()

            if response.data:
                key_record = response.data[0]
                logger.info(
                    f"API key generated | user={user_id} | name={key_name} | "
                    f"agent={is_agent} | prefix={key_prefix}"
                )

                return {
                    "api_key": api_key,  # Return plain key ONCE
                    "key_id": key_record["id"],
                    "key_prefix": key_prefix,
                    "expires_at": expires_at,
                }
            else:
                raise Exception("Failed to generate API key")

        except Exception as e:
            logger.error(f"Failed to generate API key: {e}", exc_info=True)
            raise

    def verify_api_key(self, api_key: str) -> Optional[dict]:
        """
        Verify API key and return user info.

        Args:
            api_key: API key to verify

        Returns:
            User info if valid, None if invalid
        """
        try:
            # Hash the provided key
            key_hash = hashlib.sha256(api_key.encode()).hexdigest()

            # Look up in database
            response = (
                self.client.table("archon_api_keys")
                .select("*, archon_users_profile(*)")
                .eq("key_hash", key_hash)
                .eq("is_active", True)
                .execute()
            )

            if not response.data:
                return None

            key_record = response.data[0]

            # Check expiration
            if key_record.get("expires_at"):
                expires = datetime.fromisoformat(key_record["expires_at"].replace("Z", "+00:00"))
                if expires < datetime.now(timezone.utc):
                    return None

            # Update last used
            self.client.table("archon_api_keys").update({
                "last_used_at": datetime.now(timezone.utc).isoformat(),
                "total_requests": key_record.get("total_requests", 0) + 1,
            }).eq("id", key_record["id"]).execute()

            return key_record

        except Exception as e:
            logger.error(f"Failed to verify API key: {e}", exc_info=True)
            return None
