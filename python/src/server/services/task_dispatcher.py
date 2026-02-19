"""
Task Dispatcher Service

Background service that watches for tasks assigned to AI agents and
dispatches them for automatic execution via the agents service.

Architecture:
- Runs as an asyncio background task inside the main server
- Polls Supabase every 30 seconds for tasks assigned to agent names
- Dispatches each found task to the agents service (http://agents:{port})
- Uses Supabase directly for DB operations (no auth overhead)
- Stores agent output in archon_task_acknowledgements (submission_data)
- Posts agent output as a task comment using the system agent user UUID
"""

import asyncio
import logging
import os
from typing import Any

import httpx

from ..utils import get_supabase_client

logger = logging.getLogger(__name__)

# Agent names that trigger automatic task processing (matches task assignee field)
AGENT_ASSIGNEES = {"Coding Agent", "Archon", "10x Agent"}

# Fixed UUIDs for system agent users
AGENT_USER_IDS: dict[str, str] = {
    "Coding Agent": "00000000-0000-0000-0000-000000000010",
    "Archon": "00000000-0000-0000-0000-000000000011",
    "10x Agent": "00000000-0000-0000-0000-000000000012",
}

# Polling interval in seconds
POLL_INTERVAL = 30


def _get_agents_url() -> str:
    agents_port = os.getenv("ARCHON_AGENTS_PORT", "8052")
    if os.path.exists("/.dockerenv") or os.getenv("DOCKER_CONTAINER"):
        return f"http://agents:{agents_port}"
    return f"http://localhost:{agents_port}"


async def _call_agents_service(task: dict[str, Any]) -> str | None:
    """
    Send a task to the agents service for processing.
    Returns the agent's output string, or None if the service is unavailable.
    """
    url = f"{_get_agents_url()}/agents/execute-task"
    payload = {
        "task_id": task["id"],
        "title": task["title"],
        "description": task.get("description") or "",
        "project_id": task.get("project_id"),
        "assignee": task.get("assignee", "Coding Agent"),
    }
    if task.get("_user_api_key"):
        payload["user_api_key"] = task["_user_api_key"]
    if task.get("_user_model"):
        payload["user_model"] = task["_user_model"]

    try:
        async with httpx.AsyncClient(timeout=300.0) as client:
            response = await client.post(url, json=payload)
            response.raise_for_status()
            data = response.json()
            if data.get("success"):
                return data.get("result") or "Task processed successfully."
            else:
                logger.warning(f"Agents service reported failure: {data.get('error')}")
                return None
    except httpx.ConnectError:
        logger.warning("Agents service not reachable — task dispatch skipped (start the agents container)")
        return None
    except httpx.HTTPStatusError as e:
        logger.error(f"Agents service HTTP error: {e.response.status_code} - {e.response.text}")
        return None
    except Exception as e:
        logger.error(f"Failed to dispatch task {task['id']} to agents service: {e}")
        return None


async def _execute_agent_task(task: dict[str, Any]) -> None:
    """
    Execute a single agent task end-to-end:
    1. Call agents service for AI processing
    2. Post result as comment
    3. Record acknowledgement with submission_data
    4. Move task to 'review' (or back to 'todo' on failure)
    """
    task_id = task["id"]
    assignee = task.get("assignee", "Coding Agent")
    agent_user_id = AGENT_USER_IDS.get(assignee, AGENT_USER_IDS["Coding Agent"])

    client = get_supabase_client()

    result = await _call_agents_service(task)

    if result:
        # Post agent output as a task comment
        try:
            client.table("archon_task_comments").insert({
                "task_id": task_id,
                "user_id": agent_user_id,
                "comment_text": f"🤖 **{assignee} output:**\n\n{result}",
                "mentions": [],
            }).execute()
        except Exception as e:
            logger.warning(f"Failed to post agent comment for task {task_id}: {e}")

        # Record completion in acknowledgements
        try:
            client.table("archon_task_acknowledgements").insert({
                "task_id": task_id,
                "agent_id": assignee,
                "status": "submitted_for_review",
                "agent_message": "Work completed. Ready for human review.",
                "submission_data": {"result": result[:2000]},  # Truncate for JSONB
                "confidence_score": 0.80,
                "flagged_items": [],
            }).execute()
        except Exception as e:
            logger.warning(f"Failed to record agent acknowledgement for task {task_id}: {e}")

        # Move task to 'review' for human approval
        try:
            client.table("archon_tasks").update({"status": "review"}).eq("id", task_id).execute()
            logger.info(f"Task dispatcher: task '{task['title']}' ({task_id}) → review")
        except Exception as e:
            logger.error(f"Failed to move task {task_id} to review: {e}")

    else:
        # Agents service unavailable — return task to 'todo' and post a note
        try:
            client.table("archon_tasks").update({"status": "todo"}).eq("id", task_id).execute()
        except Exception as e:
            logger.error(f"Failed to return task {task_id} to todo: {e}")

        try:
            client.table("archon_task_comments").insert({
                "task_id": task_id,
                "user_id": agent_user_id,
                "comment_text": "⚠️ Agent could not process this task (agents service unavailable). Task returned to Todo.",
                "mentions": [],
            }).execute()
        except Exception as e:
            logger.warning(f"Failed to post unavailability comment: {e}")

        logger.warning(f"Task dispatcher: task {task_id} returned to 'todo' (agents service unavailable)")


async def _process_pending_agent_tasks() -> None:
    """
    Poll Supabase for tasks assigned to agent names in 'todo' status
    and dispatch them for processing.
    """
    try:
        client = get_supabase_client()

        response = (
            client.table("archon_tasks")
            .select("id, title, description, project_id, assignee, created_by")
            .in_("assignee", list(AGENT_ASSIGNEES))
            .in_("status", ["todo", "backlog"])  # Pick up from both backlog and todo
            .eq("archived", False)
            .limit(5)
            .execute()
        )

        tasks = response.data or []
        if not tasks:
            return

        logger.info(f"Task dispatcher: found {len(tasks)} pending agent task(s)")

        for task in tasks:
            task_id = task["id"]
            assignee = task.get("assignee", "Coding Agent")
            agent_user_id = AGENT_USER_IDS.get(assignee, AGENT_USER_IDS["Coding Agent"])

            # Claim task atomically — only succeeds if status is still backlog/todo
            current_status = task.get("status", "todo")
            claim = (
                client.table("archon_tasks")
                .update({"status": "doing"})
                .eq("id", task_id)
                .eq("status", current_status)
                .execute()
            )

            if not claim.data:
                logger.debug(f"Task {task_id} already claimed by another process")
                continue

            # For "10x Agent", verify the task creator has a personal API key configured
            if assignee == "10x Agent":
                created_by = task.get("created_by")
                user_key = None
                user_model = None
                if created_by:
                    try:
                        from .user_agent_config_service import UserAgentConfigService
                        config = UserAgentConfigService().get_config(created_by)
                        if config and config.get("enabled") and config.get("api_key"):
                            user_key = config["api_key"]
                            user_model = config.get("model")
                    except Exception as cfg_err:
                        logger.warning(f"Could not load agent config for user {created_by}: {cfg_err}")

                if not user_key:
                    # Return task to todo and post guidance comment
                    client.table("archon_tasks").update({"status": "todo"}).eq("id", task_id).execute()
                    client.table("archon_task_comments").insert({
                        "task_id": task_id,
                        "user_id": agent_user_id,
                        "comment_text": "⚙️ **10x Agent** needs a personal LLM API key to process this task.\n\nGo to **Settings → AI Agent** to configure your API key, then reassign the task.",
                        "mentions": [],
                    }).execute()
                    logger.info(f"Task {task_id} returned to todo — 10x Agent has no API key for creator {created_by}")
                    continue

                task["_user_api_key"] = user_key
                task["_user_model"] = user_model

            logger.info(f"Task dispatcher: claimed '{task['title']}' → dispatching to {assignee}")

            # Post acknowledgement comment
            try:
                client.table("archon_task_comments").insert({
                    "task_id": task_id,
                    "user_id": agent_user_id,
                    "comment_text": f"🤖 **{assignee}** has accepted this task and is starting work...",
                    "mentions": [],
                }).execute()
            except Exception as e:
                logger.warning(f"Failed to post acknowledgement for task {task_id}: {e}")

            # Record acknowledgement
            try:
                client.table("archon_task_acknowledgements").insert({
                    "task_id": task_id,
                    "agent_id": assignee,
                    "status": "accepted",
                    "agent_message": "Task accepted. Starting work.",
                    "response_time_ms": 0,
                }).execute()
            except Exception as e:
                logger.warning(f"Failed to record task acknowledgement: {e}")

            # Execute in background so the polling loop is not blocked
            asyncio.create_task(_execute_agent_task(task))

    except Exception as e:
        logger.error(f"Task dispatcher poll failed: {e}", exc_info=True)


def _ensure_agent_users() -> None:
    """
    Idempotently create global agent user records in archon_users_profile.

    Called on every server startup so that agent users exist for ALL organizations
    and ALL deployments — no manual SQL migration step required.
    The upsert is a no-op if the rows already exist.
    """
    try:
        client = get_supabase_client()
        agent_users = [
            {
                "id": AGENT_USER_IDS["Coding Agent"],
                "email": "coding-agent@system.internal",
                "display_name": "Coding Agent",
                "user_type": "agent",
                "status": "active",
            },
            {
                "id": AGENT_USER_IDS["Archon"],
                "email": "archon-agent@system.internal",
                "display_name": "Archon",
                "user_type": "agent",
                "status": "active",
            },
            {
                "id": AGENT_USER_IDS["10x Agent"],
                "email": "10x-agent@system.internal",
                "display_name": "10x Agent",
                "user_type": "agent",
                "status": "active",
            },
        ]
        client.table("archon_users_profile").upsert(agent_users, on_conflict="id").execute()
        logger.info("Agent system users verified/created (Coding Agent, Archon, 10x Agent)")
    except Exception as e:
        logger.warning(f"Could not ensure agent users exist: {e}")


async def start_task_dispatcher() -> None:
    """
    Run the task dispatcher polling loop indefinitely.
    Start this as a background asyncio task in the server lifespan.

    On startup, this function automatically creates the global agent user records
    so no manual SQL steps are ever needed — any organization that runs the server
    gets the agents automatically.
    """
    # Seed agent users on every startup (idempotent)
    _ensure_agent_users()

    logger.info(
        f"Task dispatcher started — polling every {POLL_INTERVAL}s "
        f"for tasks assigned to: {', '.join(AGENT_ASSIGNEES)}"
    )

    # Initial delay to let the server fully start before first poll
    await asyncio.sleep(10)

    while True:
        await _process_pending_agent_tasks()
        await asyncio.sleep(POLL_INTERVAL)
