"""
Coding Agent — AI agent for executing software development project tasks.

Receives tasks from the project backlog and produces actionable output:
implementation plans, code reviews, bug analysis, or research summaries.
Uses the knowledge base to find relevant context before generating output.
"""

import logging
import os
from dataclasses import dataclass
from typing import Any

from pydantic_ai import Agent, RunContext

from .base_agent import ArchonDependencies, BaseAgent

logger = logging.getLogger(__name__)


@dataclass
class TaskExecutionDeps(ArchonDependencies):
    """Dependencies for task execution."""

    task_id: str = ""
    project_id: str | None = None
    assignee: str = "Coding Agent"


class CodingAgent(BaseAgent[TaskExecutionDeps, str]):
    """
    AI agent for executing software development tasks from the project backlog.

    Capabilities:
    - Analyse task descriptions and extract clear requirements
    - Search the knowledge base for relevant documentation and patterns
    - Generate implementation plans with concrete steps and code snippets
    - Produce code reviews, bug analyses, or research summaries
    - Flag ambiguities or blockers that require human input
    """

    def __init__(self, model: str | None = None, **kwargs: Any):
        if model is None:
            model = os.getenv("CODING_AGENT_MODEL", "openai:gpt-4o-mini")
        super().__init__(model=model, name="CodingAgent", retries=3, enable_rate_limiting=True, **kwargs)

    def _create_agent(self, **kwargs: Any) -> Agent:
        agent = Agent(
            model=self.model,
            deps_type=TaskExecutionDeps,
            system_prompt="""You are a software development task agent for a project management system.

Your job: analyse a task from the backlog, search for relevant context, and produce concise, actionable output.

Rules:
- Always start with a 1–2 sentence summary of what the task requires
- Search the knowledge base before writing your answer when the task involves documentation or known patterns
- For implementation tasks: list concrete numbered steps with code snippets where helpful
- For bug tasks: provide a root-cause analysis and the fix
- For research tasks: summarise key findings with sources
- End with "Blockers / Questions:" section if anything is unclear (leave blank if none)
- Keep total response under 800 words
- Be direct and practical — no padding""",
            **kwargs,
        )

        @agent.tool
        async def search_knowledge_base(ctx: RunContext[TaskExecutionDeps], query: str) -> str:
            """Search the project knowledge base for relevant documentation and code examples."""
            try:
                from .mcp_client import get_mcp_client
                import json

                mcp = await get_mcp_client()
                raw = await mcp.perform_rag_query(query=query, source=None, match_count=5)
                data = json.loads(raw)

                if not data.get("success"):
                    return "No results found in knowledge base."

                results = data.get("results", [])
                if not results:
                    return "No relevant documentation found for this query."

                formatted = []
                for r in results[:3]:
                    content = (r.get("content") or "")[:400]
                    url = r.get("metadata", {}).get("url", r.get("url", ""))
                    formatted.append(f"**Source:** {url}\n{content}")

                return "\n\n---\n\n".join(formatted)

            except Exception as e:
                logger.warning(f"Knowledge base search failed: {e}")
                return f"Could not search knowledge base: {e}"

        return agent

    def get_system_prompt(self) -> str:
        return "Coding Agent for automated project task execution."
