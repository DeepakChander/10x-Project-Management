"""
OpenAI AI Provider

Uses GPT-4 for intelligent task estimation and sprint planning
"""

import json
import logging
import os
from typing import Any, Optional

try:
    from openai import OpenAI
except ImportError:
    OpenAI = None

from .base_provider import AIProvider

logger = logging.getLogger(__name__)


class OpenAIProvider(AIProvider):
    """OpenAI GPT-4 provider"""

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: str = "gpt-4o",
    ):
        super().__init__(api_key, model)
        self.api_key = api_key or os.getenv("OPENAI_API_KEY")
        self.client = OpenAI(api_key=self.api_key) if self.api_key else None

    async def estimate_task(
        self,
        title: str,
        description: str,
        project_context: Optional[dict] = None,
    ) -> dict[str, Any]:
        """Estimate task using GPT-4"""

        if not self.client:
            raise ValueError("OpenAI API key not configured")

        prompt = f"""You are a senior software engineering project manager.

Analyze this task and provide an accurate estimation:

Task Title: {title}
Task Description: {description}

Estimate:
1. Story points (Fibonacci: 1, 2, 3, 5, 8, 13)
2. Duration in hours
3. Confidence (0.0-1.0)
4. Reasoning

Respond with JSON only."""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"},
                max_tokens=512,
            )

            content = response.choices[0].message.content
            result = json.loads(content)

            return {
                "story_points": result.get("story_points", 3),
                "duration_hours": result.get("duration_hours", 6),
                "confidence": result.get("confidence", 0.7),
                "reasoning": result.get("reasoning", "GPT-4 estimation"),
            }

        except Exception as e:
            logger.error(f"OpenAI estimation failed: {e}", exc_info=True)
            raise

    async def plan_sprint(
        self,
        backlog_tasks: list[dict],
        capacity_hours: int,
        current_velocity: Optional[float] = None,
    ) -> dict[str, Any]:
        """Plan sprint using GPT-4"""

        if not self.client:
            raise ValueError("OpenAI API key not configured")

        tasks_text = "\n".join(
            [
                f"{i+1}. [{t.get('priority', 'medium')}] {t['title']} (ID: {t['id'][:8]}, Points: {t.get('story_points', '?')})"
                for i, t in enumerate(backlog_tasks[:20])
            ]
        )

        prompt = f"""You are an expert Scrum Master.

Backlog Tasks:
{tasks_text}

Sprint Capacity: {capacity_hours} hours
Recent Velocity: {current_velocity or 'Unknown'}

Select tasks for the sprint (~80% capacity). Respond with JSON only."""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"},
                max_tokens=1024,
            )

            content = response.choices[0].message.content
            result = json.loads(content)

            return {
                "recommended_tasks": result.get("recommended_tasks", []),
                "total_story_points": result.get("total_story_points", 0),
                "capacity_utilization": result.get("capacity_utilization", 0.0),
                "reasoning": result.get("reasoning", "GPT-4 planning"),
                "warnings": result.get("warnings", []),
            }

        except Exception as e:
            logger.error(f"OpenAI sprint planning failed: {e}", exc_info=True)
            raise

    async def detect_dependencies(
        self,
        task_title: str,
        task_description: str,
        all_tasks: list[dict],
    ) -> list[dict[str, Any]]:
        """Detect dependencies using GPT-4"""

        if not self.client:
            raise ValueError("OpenAI API key not configured")

        tasks_text = "\n".join(
            [f"{i+1}. {t['title']} (ID: {t['id'][:8]})" for i, t in enumerate(all_tasks[:30])]
        )

        prompt = f"""Analyze dependencies for this task.

Current Task:
Title: {task_title}
Description: {task_description}

Available Tasks:
{tasks_text}

Find dependencies. Respond with JSON only."""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"},
                max_tokens=512,
            )

            content = response.choices[0].message.content
            result = json.loads(content)

            return result.get("dependencies", [])

        except Exception as e:
            logger.error(f"OpenAI dependency detection failed: {e}", exc_info=True)
            return []

    async def generate_text(self, prompt: str, max_tokens: int = 2048) -> str:
        """Generate text from a free-form prompt using OpenAI."""
        if not self.client:
            raise ValueError("OpenAI API key not configured")

        response = self.client.chat.completions.create(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            max_tokens=max_tokens,
        )
        return response.choices[0].message.content or ""

    def get_provider_name(self) -> str:
        return "openai"

    def get_model_name(self) -> str:
        return self.model
