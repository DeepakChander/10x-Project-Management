"""
AI Provider Base Class

Abstract interface for AI providers (Claude, OpenAI, Ollama)
"""

from abc import ABC, abstractmethod
from typing import Any, Optional


class AIProvider(ABC):
    """Base class for AI providers"""

    def __init__(self, api_key: Optional[str] = None, model: Optional[str] = None):
        self.api_key = api_key
        self.model = model

    @abstractmethod
    async def estimate_task(
        self,
        title: str,
        description: str,
        project_context: Optional[dict] = None,
    ) -> dict[str, Any]:
        """
        Estimate task effort using AI.

        Returns:
            {
                "story_points": int,
                "duration_hours": int,
                "confidence": float,
                "reasoning": str
            }
        """
        pass

    @abstractmethod
    async def plan_sprint(
        self,
        backlog_tasks: list[dict],
        capacity_hours: int,
        current_velocity: Optional[float] = None,
    ) -> dict[str, Any]:
        """
        Plan sprint using AI.

        Returns:
            {
                "recommended_tasks": [task_ids],
                "total_story_points": int,
                "capacity_utilization": float,
                "reasoning": str,
                "warnings": [str]
            }
        """
        pass

    @abstractmethod
    async def detect_dependencies(
        self,
        task_title: str,
        task_description: str,
        all_tasks: list[dict],
    ) -> list[dict[str, Any]]:
        """
        Detect task dependencies using AI.

        Returns:
            [
                {
                    "depends_on_task_id": str,
                    "depends_on_title": str,
                    "confidence": float,
                    "reasoning": str
                }
            ]
        """
        pass

    @abstractmethod
    async def generate_text(self, prompt: str, max_tokens: int = 2048) -> str:
        """
        Generate text from a free-form prompt.
        Returns the raw text response from the model.
        Used for open-ended generation (task lists, project setup, etc.).
        """
        pass

    @abstractmethod
    def get_provider_name(self) -> str:
        """Return provider name (e.g., 'claude', 'openai', 'ollama')"""
        pass

    @abstractmethod
    def get_model_name(self) -> str:
        """Return model name (e.g., 'claude-3-5-sonnet', 'gpt-4')"""
        pass
