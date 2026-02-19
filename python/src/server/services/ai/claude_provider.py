"""
Claude AI Provider (Anthropic)

Uses Claude for intelligent task estimation and sprint planning
"""

import json
import logging
import os
from typing import Any, Optional

try:
    from anthropic import Anthropic
except ImportError:
    Anthropic = None

from .base_provider import AIProvider

logger = logging.getLogger(__name__)


class ClaudeProvider(AIProvider):
    """Anthropic Claude AI provider"""

    def __init__(
        self,
        api_key: Optional[str] = None,
        model: str = "claude-3-5-sonnet-20241022",
    ):
        super().__init__(api_key, model)
        self.api_key = api_key or os.getenv("ANTHROPIC_API_KEY")
        self.client = Anthropic(api_key=self.api_key) if self.api_key else None

    async def estimate_task(
        self,
        title: str,
        description: str,
        project_context: Optional[dict] = None,
    ) -> dict[str, Any]:
        """Estimate task using Claude"""

        if not self.client:
            raise ValueError("Claude API key not configured")

        prompt = f"""You are a senior software engineering project manager with 15+ years of experience estimating software tasks.

Analyze this task and provide an accurate estimation:

**Task Title:** {title}

**Task Description:** {description}

**Instructions:**
1. Estimate story points using Fibonacci scale (1, 2, 3, 5, 8, 13)
2. Estimate duration in hours (realistic, not ideal)
3. Provide confidence score (0.0 to 1.0)
4. Explain your reasoning

**Respond ONLY with valid JSON:**
{{
  "story_points": <number>,
  "duration_hours": <number>,
  "confidence": <0.0-1.0>,
  "reasoning": "<your explanation>"
}}"""

        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=1024,
                messages=[{"role": "user", "content": prompt}],
            )

            content = response.content[0].text
            result = json.loads(content)

            return {
                "story_points": result["story_points"],
                "duration_hours": result["duration_hours"],
                "confidence": result["confidence"],
                "reasoning": result["reasoning"],
            }

        except Exception as e:
            logger.error(f"Claude estimation failed: {e}", exc_info=True)
            raise

    async def plan_sprint(
        self,
        backlog_tasks: list[dict],
        capacity_hours: int,
        current_velocity: Optional[float] = None,
    ) -> dict[str, Any]:
        """Plan sprint using Claude"""

        if not self.client:
            raise ValueError("Claude API key not configured")

        # Format tasks for prompt
        tasks_text = "\n".join(
            [
                f"{i+1}. [{t.get('priority', 'medium').upper()}] {t['title']} "
                f"(ID: {t['id'][:8]}..., Points: {t.get('story_points', '?')})"
                for i, t in enumerate(backlog_tasks[:20])  # Limit to 20 tasks
            ]
        )

        velocity_text = f"Recent velocity: {current_velocity} points/sprint" if current_velocity else "No velocity data"

        prompt = f"""You are an expert Scrum Master planning the next sprint.

**Backlog Tasks:**
{tasks_text}

**Sprint Capacity:** {capacity_hours} hours
{velocity_text}

**Instructions:**
1. Select tasks that fit ~80% of capacity (leave 20% buffer)
2. Prioritize critical/high priority tasks
3. Consider dependencies and logical grouping
4. Warn if over 90% capacity

**Respond ONLY with valid JSON:**
{{
  "recommended_tasks": ["task-id-1", "task-id-2", ...],
  "total_story_points": <number>,
  "capacity_utilization": <0.0-1.0>,
  "reasoning": "<explanation>",
  "warnings": ["warning1", ...]
}}"""

        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=2048,
                messages=[{"role": "user", "content": prompt}],
            )

            content = response.content[0].text
            result = json.loads(content)

            return result

        except Exception as e:
            logger.error(f"Claude sprint planning failed: {e}", exc_info=True)
            raise

    async def detect_dependencies(
        self,
        task_title: str,
        task_description: str,
        all_tasks: list[dict],
    ) -> list[dict[str, Any]]:
        """Detect dependencies using Claude"""

        if not self.client:
            raise ValueError("Claude API key not configured")

        # Format tasks for analysis
        tasks_text = "\n".join(
            [f"{i+1}. {t['title']} (ID: {t['id'][:8]}...)" for i, t in enumerate(all_tasks[:30])]
        )

        prompt = f"""Analyze this task and identify dependencies from the task list.

**Current Task:**
Title: {task_title}
Description: {task_description}

**Available Tasks:**
{tasks_text}

**Instructions:**
Look for explicit or implicit dependencies. Keywords like "after", "requires", "depends on" indicate dependencies.

**Respond ONLY with valid JSON:**
{{
  "dependencies": [
    {{
      "depends_on_task_id": "<task-id>",
      "depends_on_title": "<task title>",
      "confidence": <0.0-1.0>,
      "reasoning": "<why this is a dependency>"
    }}
  ]
}}"""

        try:
            response = self.client.messages.create(
                model=self.model,
                max_tokens=1024,
                messages=[{"role": "user", "content": prompt}],
            )

            content = response.content[0].text
            result = json.loads(content)

            return result.get("dependencies", [])

        except Exception as e:
            logger.error(f"Claude dependency detection failed: {e}", exc_info=True)
            return []

    async def generate_text(self, prompt: str, max_tokens: int = 2048) -> str:
        """Generate text from a free-form prompt using Claude."""
        if not self.client:
            raise ValueError("Claude API key not configured")

        response = self.client.messages.create(
            model=self.model,
            max_tokens=max_tokens,
            messages=[{"role": "user", "content": prompt}],
        )
        return response.content[0].text

    def get_provider_name(self) -> str:
        return "claude"

    def get_model_name(self) -> str:
        return self.model
