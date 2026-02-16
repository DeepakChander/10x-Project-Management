"""
Task management tools for MCP Server.

Provides tools for task CRUD operations and dependency management.
"""

from .dependency_tools import register_dependency_tools
from .task_tools import register_task_tools

__all__ = ["register_task_tools", "register_dependency_tools"]
