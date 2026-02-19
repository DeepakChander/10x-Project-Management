"""
User Agent Config Service

Per-user LLM API key management for the 10x Agent.
API keys are Fernet-encrypted using the same method as credential_service.py.
"""

import base64
import logging
import os
from typing import Any

from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC

from ..utils import get_supabase_client

logger = logging.getLogger(__name__)


def _get_fernet() -> Fernet:
    """Build Fernet instance using the same key derivation as credential_service.py."""
    service_key = os.getenv("SUPABASE_SERVICE_KEY", "default-key-for-development")
    kdf = PBKDF2HMAC(
        algorithm=hashes.SHA256(),
        length=32,
        salt=b"static_salt_for_credentials",
        iterations=100000,
    )
    key = base64.urlsafe_b64encode(kdf.derive(service_key.encode()))
    return Fernet(key)


def _encrypt(value: str) -> str:
    encrypted = _get_fernet().encrypt(value.encode("utf-8"))
    return base64.urlsafe_b64encode(encrypted).decode("utf-8")


def _decrypt(encrypted_value: str) -> str:
    encrypted_bytes = base64.urlsafe_b64decode(encrypted_value.encode("utf-8"))
    return _get_fernet().decrypt(encrypted_bytes).decode("utf-8")


class UserAgentConfigService:
    """Manages per-user LLM API key configuration for the 10x Agent."""

    def __init__(self):
        self.client = get_supabase_client()

    def get_config(self, user_id: str) -> dict[str, Any] | None:
        """
        Return the agent config for a user with the API key decrypted.
        Returns None if no config exists.
        """
        response = (
            self.client.table("archon_user_agent_config")
            .select("*")
            .eq("user_id", user_id)
            .execute()
        )
        if not response.data:
            return None

        row = response.data[0]
        decrypted_key = None
        if row.get("api_key"):
            try:
                decrypted_key = _decrypt(row["api_key"])
            except Exception as e:
                logger.error(f"Failed to decrypt API key for user {user_id}: {e}")

        return {
            "user_id": user_id,
            "llm_provider": row.get("llm_provider", "openai"),
            "api_key": decrypted_key,
            "model": row.get("model", "openai:gpt-4o-mini"),
            "enabled": row.get("enabled", True),
        }

    def get_config_masked(self, user_id: str) -> dict[str, Any] | None:
        """Return config with api_key masked (only last 4 chars visible)."""
        config = self.get_config(user_id)
        if config is None:
            return None
        raw_key = config.get("api_key") or ""
        config["api_key_masked"] = f"***{raw_key[-4:]}" if len(raw_key) >= 4 else ("***" if raw_key else None)
        config.pop("api_key", None)
        return config

    def set_config(
        self,
        user_id: str,
        llm_provider: str,
        api_key: str | None,
        model: str,
        enabled: bool = True,
    ) -> dict[str, Any]:
        """Upsert agent config for a user. Encrypts api_key before storage."""
        data: dict[str, Any] = {
            "user_id": user_id,
            "llm_provider": llm_provider,
            "model": model,
            "enabled": enabled,
            "updated_at": "NOW()",
        }
        if api_key:
            data["api_key"] = _encrypt(api_key)
        else:
            data["api_key"] = None

        response = (
            self.client.table("archon_user_agent_config")
            .upsert(data, on_conflict="user_id")
            .execute()
        )
        if not response.data:
            raise Exception("Failed to save agent config")
        return response.data[0]
