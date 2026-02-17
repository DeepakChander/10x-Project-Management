"""
API Keys API - Generate and manage API keys for agents
"""

import logging
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from ..middleware.permission_middleware import get_current_user_id, require_role
from ..services.api_key_service import APIKeyService

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/api/api-keys", tags=["api-keys"])


class GenerateKeyRequest(BaseModel):
    agent_user_id: str
    key_name: str
    webhook_url: str
    capabilities: dict = {}
    supervisor_id: str | None = None


@router.post("/generate")
async def generate_api_key(
    request: GenerateKeyRequest,
    user_id: str = Depends(get_current_user_id),
    perm: dict = Depends(require_role("manager")),
):
    """Generate API key for agent. Requires: Manager role."""
    try:
        service = APIKeyService()
        result = service.generate_api_key(
            user_id=request.agent_user_id,
            key_name=request.key_name,
            is_agent=True,
            capabilities=request.capabilities,
            supervisor_id=request.supervisor_id or user_id,
            rate_limit=100,
        )

        # Register webhook
        from ..utils import get_supabase_client
        client = get_supabase_client()
        client.table("archon_agent_webhooks").insert({
            "agent_id": request.agent_user_id,
            "webhook_url": request.webhook_url,
            "events": ["task_assigned", "task_updated", "sprint_started"],
        }).execute()

        return result

    except Exception as e:
        logger.error(f"Failed to generate API key: {e}")
        raise HTTPException(status_code=500, detail=str(e))
