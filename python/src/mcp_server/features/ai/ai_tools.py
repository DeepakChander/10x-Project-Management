"""
AI Features MCP Tools

Provides tools for AI-powered project setup suggestions, team intelligence,
quality patterns, task estimation, and sprint planning.
"""

import json
import logging
from urllib.parse import urljoin

import httpx
from mcp.server.fastmcp import Context, FastMCP

from src.mcp_server.utils.error_handling import MCPErrorFormatter
from src.mcp_server.utils.timeout_config import get_default_timeout
from src.server.config.service_discovery import get_api_url

logger = logging.getLogger(__name__)


def register_ai_tools(mcp: FastMCP):
    """Register all AI tools with the MCP server."""

    @mcp.tool()
    async def estimate_task(
        ctx: Context,
        task_id: str,
        project_id: str,
    ) -> str:
        """
        Get AI estimation for a task (story points and duration).

        Args:
            task_id: The task ID to estimate
            project_id: The project the task belongs to

        Returns:
            JSON with story_points, duration_days, and confidence
        """
        try:
            api_url = get_api_url()
            url = urljoin(api_url + "/", f"api/ai/tasks/{task_id}/estimate")

            async with httpx.AsyncClient(timeout=get_default_timeout()) as client:
                response = await client.post(url, params={"project_id": project_id})
                response.raise_for_status()
                return json.dumps(response.json(), indent=2)

        except httpx.HTTPStatusError as e:
            return MCPErrorFormatter.format_http_error(e)
        except Exception as e:
            logger.error(f"Error estimating task: {str(e)}", exc_info=True)
            return json.dumps({"error": str(e)})

    @mcp.tool()
    async def plan_sprint(
        ctx: Context,
        project_id: str,
        capacity_hours: int,
    ) -> str:
        """
        Get AI recommendations for sprint planning.

        Args:
            project_id: The project to plan a sprint for
            capacity_hours: Total team capacity in hours for the sprint

        Returns:
            JSON with recommended tasks, estimated hours, and rationale
        """
        try:
            api_url = get_api_url()
            url = urljoin(api_url + "/", f"api/ai/projects/{project_id}/plan-sprint")

            async with httpx.AsyncClient(timeout=get_default_timeout()) as client:
                response = await client.post(url, json={"sprint_capacity_hours": capacity_hours})
                response.raise_for_status()
                return json.dumps(response.json(), indent=2)

        except httpx.HTTPStatusError as e:
            return MCPErrorFormatter.format_http_error(e)
        except Exception as e:
            logger.error(f"Error planning sprint: {str(e)}", exc_info=True)
            return json.dumps({"error": str(e)})

    @mcp.tool()
    async def suggest_project_setup(
        ctx: Context,
        project_id: str,
        title: str,
        description: str | None = None,
    ) -> str:
        """
        Get AI-generated task suggestions for a new project (Magic Moment).

        The AI analyzes the project title and description, matches it against
        learned patterns from past projects, and suggests a full task list with
        assignments and effort estimates.

        Args:
            project_id: The project ID to generate suggestions for
            title: The project title
            description: Optional project description (more detail = better suggestions)

        Returns:
            JSON with suggested tasks, confidence level, and template source.
            If description is too short, returns needs_description=true.
        """
        try:
            api_url = get_api_url()
            url = urljoin(api_url + "/", f"api/ai/projects/{project_id}/suggest-setup")

            payload: dict = {"title": title}
            if description:
                payload["description"] = description

            async with httpx.AsyncClient(timeout=get_default_timeout()) as client:
                response = await client.post(url, json=payload)
                response.raise_for_status()
                return json.dumps(response.json(), indent=2)

        except httpx.HTTPStatusError as e:
            return MCPErrorFormatter.format_http_error(e)
        except Exception as e:
            logger.error(f"Error generating project setup suggestions: {str(e)}", exc_info=True)
            return json.dumps({"error": str(e)})

    @mcp.tool()
    async def get_team_intelligence(
        ctx: Context,
        person_id: str | None = None,
        task_type: str | None = None,
    ) -> str:
        """
        Get team intelligence profiles — who's good at what, approval rates, and skill strengths.

        Use this to find the best person to assign a task to, or to understand
        a specific team member's strengths and workload patterns.

        Args:
            person_id: Get profile for a specific team member (UUID from archon_users_profile).
                       Omit to list all profiles.
            task_type: Find the best assignee for a specific task type (e.g. "backend", "frontend",
                       "testing"). Provide this instead of person_id for assignment recommendations.

        Returns:
            JSON with team member profiles, skills, approval rates, and task preferences.
            When task_type is provided, returns the recommended assignee.
        """
        try:
            api_url = get_api_url()

            async with httpx.AsyncClient(timeout=get_default_timeout()) as client:
                if task_type:
                    url = urljoin(api_url + "/", f"api/ai/best-assignee/{task_type}")
                    response = await client.get(url)
                elif person_id:
                    url = urljoin(api_url + "/", f"api/ai/team-intelligence/{person_id}")
                    response = await client.get(url)
                else:
                    url = urljoin(api_url + "/", "api/ai/team-intelligence")
                    response = await client.get(url)

                response.raise_for_status()
                return json.dumps(response.json(), indent=2)

        except httpx.HTTPStatusError as e:
            return MCPErrorFormatter.format_http_error(e)
        except Exception as e:
            logger.error(f"Error getting team intelligence: {str(e)}", exc_info=True)
            return json.dumps({"error": str(e)})

    @mcp.tool()
    async def manage_ai_learning(
        ctx: Context,
        action: str,
        batch_size: int = 50,
    ) -> str:
        """
        Manage the AI self-learning engine.

        Actions:
          - "status"  — Show pending observations, knowledge store sizes, and recent accuracy.
          - "learn"   — Trigger processing of pending observations (runs in background).
          - "rebuild" — Full knowledge store rebuild from all historical data (admin, heavy operation).
          - "accuracy"— Show AI suggestion accuracy trend over the last 12 months.

        Args:
            action: "status" | "learn" | "rebuild" | "accuracy"
            batch_size: Number of observations to process per batch (default 50, only for "learn")

        Returns:
            JSON with the result for the requested action.
        """
        try:
            api_url = get_api_url()

            async with httpx.AsyncClient(timeout=get_default_timeout()) as client:
                if action == "status":
                    url = urljoin(api_url + "/", "api/ai/learn/status")
                    response = await client.get(url)

                elif action == "learn":
                    url = urljoin(api_url + "/", "api/ai/learn")
                    response = await client.post(url, params={"batch_size": batch_size})

                elif action == "rebuild":
                    url = urljoin(api_url + "/", "api/ai/rebuild")
                    response = await client.post(url)

                elif action == "accuracy":
                    url = urljoin(api_url + "/", "api/ai/accuracy")
                    response = await client.get(url, params={"limit": 12})

                else:
                    return json.dumps({
                        "error": f"Unknown action '{action}'. Use: status, learn, rebuild, accuracy"
                    })

                response.raise_for_status()
                return json.dumps(response.json(), indent=2)

        except httpx.HTTPStatusError as e:
            return MCPErrorFormatter.format_http_error(e)
        except Exception as e:
            logger.error(f"Error in manage_ai_learning({action}): {str(e)}", exc_info=True)
            return json.dumps({"error": str(e)})

    @mcp.tool()
    async def get_quality_patterns(
        ctx: Context,
        task_type: str | None = None,
        min_rejection_rate: float = 0.2,
    ) -> str:
        """
        Get AI-learned quality patterns — which task types get rejected most and why.

        Returns prevention tips for a specific task type, or a list of high-rejection
        task types that need attention. Use this when creating tasks to proactively
        surface quality guidance to the team.

        Args:
            task_type: Get prevention tips for a specific task type (e.g. "backend-api",
                       "ui-component", "database-migration"). Omit to list all patterns.
            min_rejection_rate: Minimum rejection rate to include in results (0.0-1.0).
                                Default 0.2 (20%). Only used when task_type is not provided.

        Returns:
            JSON with rejection rates, categories, sample sizes, and prevention tips.
        """
        try:
            api_url = get_api_url()

            async with httpx.AsyncClient(timeout=get_default_timeout()) as client:
                if task_type:
                    url = urljoin(api_url + "/", f"api/ai/quality-patterns/{task_type}/tips")
                    response = await client.get(url)
                else:
                    url = urljoin(api_url + "/", "api/ai/quality-patterns")
                    response = await client.get(url, params={"min_rejection_rate": min_rejection_rate})

                response.raise_for_status()
                return json.dumps(response.json(), indent=2)

        except httpx.HTTPStatusError as e:
            return MCPErrorFormatter.format_http_error(e)
        except Exception as e:
            logger.error(f"Error getting quality patterns: {str(e)}", exc_info=True)
            return json.dumps({"error": str(e)})
