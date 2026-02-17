"""
Ollama AI Provider

Uses local Ollama models for task estimation and sprint planning
"""

import json
import logging
import os
from typing import Any, Optional

import httpx

from .base_provider import AIProvider

logger = logging.getLogger(__name__)


class OllamaProvider(AIProvider):
    """Local Ollama AI provider"""

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: str = "llama3.1:8b",
        base_url: str = "http://localhost:11434",
    ):
        super().__init__(api_key, model)
        self.base_url = base_url
        self.model = model

    async def estimate_task(
        self,
        title: str,
        description: str,
        project_context: Optional[dict] = None,
    ) -> dict[str, Any]:
        """Estimate task using Ollama"""

        prompt = f"""You are a senior software engineering project manager.

Analyze this task and provide estimation:

Title: {title}
Description: {description}

Respond with JSON only:
{{
  "story_points": <1|2|3|5|8|13>,
  "duration_hours": <number>,
  "confidence": <0.0-1.0>,
  "reasoning": "<explanation>"
}}"""

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.base_url}/api/generate",
                    json={
                        "model": self.model,
                        "prompt": prompt,
                        "stream": False,
                        "format": "json",
                    },
                )

                if response.status_code != 200:
                    raise ValueError(f"Ollama returned {response.status_code}")

                data = response.json()
                result = json.loads(data["response"])

                return {
                    "story_points": result.get("story_points", 3),
                    "duration_hours": result.get("duration_hours", 6),
                    "confidence": result.get("confidence", 0.6),
                    "reasoning": result.get("reasoning", "Ollama estimation"),
                }

        except Exception as e:
            logger.error(f"Ollama estimation failed: {e}", exc_info=True)
            raise

    async def plan_sprint(
        self,
        backlog_tasks: list[dict],
        capacity_hours: int,
        current_velocity: Optional[float] = None,
    ) -> dict[str, Any]:
        """Plan sprint using Ollama"""

        tasks_text = "\n".join(
            [
                f"{i+1}. [{t.get('priority', 'medium')}] {t['title']} (Points: {t.get('story_points', '?')})"
                for i, t in enumerate(backlog_tasks[:20])
            ]
        )

        prompt = f"""You are a Scrum Master planning a sprint.

Backlog:
{tasks_text}

Capacity: {capacity_hours} hours
Velocity: {current_velocity or 'Unknown'}

Select tasks for sprint (~80% capacity). Respond with JSON only:
{{
  "recommended_tasks": ["task-id", ...],
  "total_story_points": <number>,
  "capacity_utilization": <0.0-1.0>,
  "reasoning": "<explanation>",
  "warnings": ["warning", ...]
}}"""

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.base_url}/api/generate",
                    json={
                        "model": self.model,
                        "prompt": prompt,
                        "stream": False,
                        "format": "json",
                    },
                )

                data = response.json()
                result = json.loads(data["response"])

                return {
                    "recommended_tasks": result.get("recommended_tasks", []),
                    "total_story_points": result.get("total_story_points", 0),
                    "capacity_utilization": result.get("capacity_utilization", 0.0),
                    "reasoning": result.get("reasoning", "Ollama planning"),
                    "warnings": result.get("warnings", []),
                }

        except Exception as e:
            logger.error(f"Ollama sprint planning failed: {e}", exc_info=True)
            raise

    async def detect_dependencies(
        self,
        task_title: str,
        task_description: str,
        all_tasks: list[dict],
    ) -> list[dict[str, Any]]:
        """Detect dependencies using Ollama"""

        tasks_text = "\n".join(
            [f"{i+1}. {t['title']} (ID: {t['id'][:8]})" for i, t in enumerate(all_tasks[:30])]
        )

        prompt = f"""Find dependencies for this task.

Task: {task_title}
Description: {task_description}

Tasks:
{tasks_text}

Respond with JSON only:
{{
  "dependencies": [
    {{"depends_on_task_id": "<id>", "depends_on_title": "<title>", "confidence": 0.8, "reasoning": "<why>"}}
  ]
}}"""

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{self.base_url}/api/generate",
                    json={
                        "model": self.model,
                        "prompt": prompt,
                        "stream": False,
                        "format": "json",
                    },
                )

                data = response.json()
                result = json.loads(data["response"])

                return result.get("dependencies", [])

        except Exception as e:
            logger.error(f"Ollama dependency detection failed: {e}", exc_info=True)
            return []

    def get_provider_name(self) -> str:
        return "ollama"

    def get_model_name(self) -> str:
        return self.model
