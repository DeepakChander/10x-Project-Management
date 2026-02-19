"""
Webhook Delivery Service

Sends webhooks to registered AI agents
"""

import hashlib
import hmac
import json
import logging
from datetime import datetime
from typing import Any

import httpx

from ..utils import get_supabase_client

logger = logging.getLogger(__name__)


class WebhookService:
    """Service for webhook delivery"""

    def __init__(self, supabase_client=None):
        self.client = supabase_client or get_supabase_client()

    async def send_task_assigned_webhook(
        self,
        task_id: str,
        task_title: str,
        assigned_to: str,
        assigned_by: str,
        priority: str,
        due_date: str | None,
    ):
        """
        Send task_assigned webhook to agent.

        Args:
            task_id: Task ID
            task_title: Task title
            assigned_to: Agent user ID
            assigned_by: Human user ID
            priority: Task priority
            due_date: Deadline
        """
        try:
            # Get agent's webhook config
            webhook_response = (
                self.client.table("archon_agent_webhooks")
                .select("*")
                .eq("agent_id", assigned_to)
                .eq("is_active", True)
                .execute()
            )

            if not webhook_response.data:
                logger.info(f"No webhook registered for agent {assigned_to}")
                return

            for webhook in webhook_response.data:
                # Check if subscribed to task_assigned events
                if "task_assigned" not in webhook.get("events", []):
                    continue

                # Build payload
                payload = {
                    "event": "task_assigned",
                    "task_id": task_id,
                    "task_title": task_title,
                    "assigned_by": assigned_by,
                    "priority": priority,
                    "due_date": due_date,
                    "action_required": "acknowledge",
                }

                # Send webhook
                await self._deliver_webhook(
                    webhook_id=webhook["id"],
                    webhook_url=webhook["webhook_url"],
                    webhook_secret=webhook.get("webhook_secret"),
                    payload=payload,
                )

        except Exception as e:
            logger.error(f"Failed to send webhook: {e}", exc_info=True)

    async def _deliver_webhook(
        self,
        webhook_id: str,
        webhook_url: str,
        webhook_secret: str | None,
        payload: dict,
    ):
        """Deliver webhook with signature verification"""
        try:
            headers = {"Content-Type": "application/json"}

            # Add signature for verification
            if webhook_secret:
                # Use JSON serialization for deterministic HMAC signing
                payload_str = json.dumps(payload, sort_keys=True)
                signature = hmac.new(
                    webhook_secret.encode(),
                    payload_str.encode(),
                    hashlib.sha256,
                ).hexdigest()
                headers["X-10x-Signature"] = f"sha256={signature}"

            # Send webhook
            async with httpx.AsyncClient(timeout=10.0) as client:
                start_time = datetime.now()
                response = await client.post(webhook_url, json=payload, headers=headers)
                response_time = int((datetime.now() - start_time).total_seconds() * 1000)

                # Log delivery
                self.client.table("archon_webhook_deliveries").insert({
                    "webhook_id": webhook_id,
                    "event_type": payload.get("event"),
                    "payload": payload,
                    "status_code": response.status_code,
                    "response_body": response.text[:1000],  # First 1000 chars
                    "response_time_ms": response_time,
                }).execute()

                logger.info(
                    f"Webhook delivered | url={webhook_url} | "
                    f"status={response.status_code} | time={response_time}ms"
                )

        except Exception as e:
            # Log failed delivery
            self.client.table("archon_webhook_deliveries").insert({
                "webhook_id": webhook_id,
                "event_type": payload.get("event"),
                "payload": payload,
                "status_code": 0,
                "error_message": str(e),
            }).execute()

            # Increment failed count - fetch current value first
            webhook_response = (
                self.client.table("archon_agent_webhooks")
                .select("failed_deliveries")
                .eq("id", webhook_id)
                .execute()
            )

            if webhook_response.data:
                current_failed = webhook_response.data[0].get("failed_deliveries", 0) or 0
                self.client.table("archon_agent_webhooks").update({
                    "failed_deliveries": current_failed + 1
                }).eq("id", webhook_id).execute()

            logger.error(f"Webhook delivery failed | url={webhook_url} | error={e}")
