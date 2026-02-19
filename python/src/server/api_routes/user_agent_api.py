"""
User Agent Config API

Handles per-user LLM API key configuration for the 10x Agent.
"""

import logging
from typing import Any

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel

from ..middleware.permission_middleware import get_current_user_id
from ..services.user_agent_config_service import UserAgentConfigService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/user", tags=["user-agent"])


class SetAgentConfigRequest(BaseModel):
    llm_provider: str = "openai"
    api_key: str | None = None
    model: str = "openai:gpt-4o-mini"
    enabled: bool = True


@router.get("/agent-config")
async def get_agent_config(user_id: str = Depends(get_current_user_id)) -> dict[str, Any]:
    """Return the user's agent config with masked API key."""
    service = UserAgentConfigService()
    config = service.get_config_masked(user_id)
    if config is None:
        return {"configured": False}
    return {"configured": True, **config}


@router.put("/agent-config")
async def set_agent_config(
    request: SetAgentConfigRequest,
    user_id: str = Depends(get_current_user_id),
) -> dict[str, Any]:
    """Save the user's agent config (encrypts API key before storage)."""
    try:
        service = UserAgentConfigService()
        service.set_config(
            user_id=user_id,
            llm_provider=request.llm_provider,
            api_key=request.api_key,
            model=request.model,
            enabled=request.enabled,
        )
        return {"message": "Agent config saved"}
    except Exception as e:
        logger.error(f"Failed to save agent config: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
