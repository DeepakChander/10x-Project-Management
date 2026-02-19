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

        # Register webhook (if this fails, log error but don't fail the key creation)
        try:
            from ..utils import get_supabase_client
            client = get_supabase_client()
            webhook_response = client.table("archon_agent_webhooks").insert({
                "agent_id": request.agent_user_id,
                "webhook_url": request.webhook_url,
                "events": ["task_assigned", "task_updated", "sprint_started"],
            }).execute()

            if not webhook_response.data:
                logger.warning(f"Webhook registration returned no data for agent {request.agent_user_id}")
        except Exception as webhook_error:
            logger.error(f"Failed to register webhook (API key created successfully): {webhook_error}")
            # Continue - API key was created successfully even if webhook failed

        return result

    except Exception as e:
        logger.error(f"Failed to generate API key: {e}")
        raise HTTPException(status_code=500, detail=str(e))
