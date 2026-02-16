"""
Task dependency management tools for MCP Server.

Provides tools to query and manage blocking relationships between tasks.
"""

import json
import logging
from typing import Any
from urllib.parse import urljoin

import httpx
from mcp.server.fastmcp import Context, FastMCP

from src.mcp_server.utils.error_handling import MCPErrorFormatter
from src.mcp_server.utils.timeout_config import get_default_timeout
from src.server.config.service_discovery import get_api_url

logger = logging.getLogger(__name__)


def register_dependency_tools(mcp: FastMCP):
    """Register task dependency tools with the MCP server."""

    @mcp.tool()
    async def find_task_dependencies(
        ctx: Context,
        task_id: str | None = None,
        project_id: str | None = None,
    ) -> str:
        """
        Find task dependencies (blocking relationships).

        Args:
            task_id: Get dependencies for a specific task (blocks + blocked_by)
            project_id: Get all dependencies for a project

        Returns:
            JSON with dependency information
        """
        try:
            api_url = get_api_url()

            async with httpx.AsyncClient(timeout=get_default_timeout()) as client:
                if task_id:
                    url = urljoin(api_url + "/", f"api/tasks/{task_id}/dependencies")
                    response = await client.get(url)
                elif project_id:
                    url = urljoin(api_url + "/", f"api/projects/{project_id}/dependencies")
                    response = await client.get(url)
                else:
                    return json.dumps({"error": "Provide either task_id or project_id"})

                response.raise_for_status()
                return json.dumps(response.json(), indent=2)

        except httpx.HTTPStatusError as e:
            return MCPErrorFormatter.format_http_error(e)
        except Exception as e:
            logger.error(f"Error finding dependencies: {str(e)}", exc_info=True)
            return json.dumps({"error": str(e)})

    @mcp.tool()
    async def manage_task_dependency(
        ctx: Context,
        action: str,
        task_id: str | None = None,
        depends_on_id: str | None = None,
        dependency_id: str | None = None,
    ) -> str:
        """
        Manage task dependencies (create or delete blocking relationships).

        Args:
            action: "create" | "delete"
            task_id: The task that is blocked (required for create)
            depends_on_id: The task that blocks task_id (required for create)
            dependency_id: The dependency ID to delete (required for delete)

        Returns:
            JSON with result of the operation
        """
        try:
            api_url = get_api_url()

            async with httpx.AsyncClient(timeout=get_default_timeout()) as client:
                if action == "create":
                    if not task_id or not depends_on_id:
                        return json.dumps({"error": "task_id and depends_on_id are required for create"})

                    url = urljoin(api_url + "/", f"api/tasks/{task_id}/dependencies")
                    response = await client.post(url, json={"depends_on_id": depends_on_id})
                    response.raise_for_status()
                    return json.dumps(response.json(), indent=2)

                elif action == "delete":
                    if not dependency_id:
                        return json.dumps({"error": "dependency_id is required for delete"})

                    url = urljoin(api_url + "/", f"api/dependencies/{dependency_id}")
                    response = await client.delete(url)
                    response.raise_for_status()
                    return json.dumps(response.json(), indent=2)

                else:
                    return json.dumps({"error": f"Unknown action '{action}'. Use 'create' or 'delete'."})

        except httpx.HTTPStatusError as e:
            return MCPErrorFormatter.format_http_error(e)
        except Exception as e:
            logger.error(f"Error managing dependency: {str(e)}", exc_info=True)
            return json.dumps({"error": str(e)})
