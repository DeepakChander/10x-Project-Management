"""
AI Observation Processor

Reads unprocessed rows from ai_observations and routes each event
to the correct knowledge-store updater.

Event routing:
  task_completed   → duration estimates + team intelligence
  task_rejected    → quality patterns + team intelligence
  task_approved    → quality patterns + team intelligence
  project_completed → project templates + task blueprints
  sprint_completed  → (velocity already tracked in archon_team_velocity)
  task_stalled     → (surfaced as a suggestion, no knowledge store update needed)
"""

import logging
from typing import Optional

from src.server.utils import get_supabase_client
from .pattern_extractor import AIPatternExtractorService
from .team_intelligence import AITeamIntelligenceService
from .quality_patterns import AIQualityPatternService

logger = logging.getLogger(__name__)

# Number of observations to process per batch
DEFAULT_BATCH_SIZE = 50


class AIObservationProcessor:
    def __init__(self, supabase_client=None):
        self.client = supabase_client or get_supabase_client()

        # Shared client passed to all sub-services for connection reuse
        self.pattern_extractor = AIPatternExtractorService(self.client)
        self.team_intelligence = AITeamIntelligenceService(self.client)
        self.quality_patterns = AIQualityPatternService(self.client)

    # ── Public API ──────────────────────────────────────────────────────────

    def process_pending(self, batch_size: int = DEFAULT_BATCH_SIZE) -> dict:
        """
        Fetch and process unprocessed observations.
        Marks each observation as processed (success or failed).

        Returns a summary dict:
          {processed: int, failed: int, total: int}
        """
        observations = self._fetch_unprocessed(batch_size)
        total = len(observations)

        if total == 0:
            logger.debug("No pending observations to process")
            return {"processed": 0, "failed": 0, "total": 0}

        logger.info(f"Processing {total} pending observations")

        processed = 0
        failed = 0

        for obs in observations:
            obs_id = obs["id"]
            event_type = obs.get("event_type", "unknown")

            try:
                learnings = self._dispatch(obs)
                self._mark_processed(obs_id, learnings=learnings)
                processed += 1
                logger.debug(f"Observation processed | id={obs_id} event={event_type}")

            except Exception as e:
                logger.error(
                    f"Failed to process observation | id={obs_id} event={event_type}: {e}",
                    exc_info=True,
                )
                self._mark_failed(obs_id, error=str(e))
                failed += 1

        logger.info(
            f"Observation batch complete | processed={processed} failed={failed} total={total}"
        )
        return {"processed": processed, "failed": failed, "total": total}

    def process_single(self, observation_id: str) -> bool:
        """
        Process a single observation by ID.
        Returns True on success, False on failure.
        """
        try:
            response = (
                self.client.table("ai_observations")
                .select("*")
                .eq("id", observation_id)
                .limit(1)
                .execute()
            )

            if not response.data:
                logger.warning(f"Observation {observation_id} not found")
                return False

            obs = response.data[0]
            learnings = self._dispatch(obs)
            self._mark_processed(observation_id, learnings=learnings)
            return True

        except Exception as e:
            logger.error(f"Failed to process observation {observation_id}: {e}", exc_info=True)
            self._mark_failed(observation_id, error=str(e))
            return False

    def get_pending_count(self) -> int:
        """Return the number of unprocessed observations."""
        try:
            response = (
                self.client.table("ai_observations")
                .select("id", count="exact")
                .eq("processed", False)
                .execute()
            )
            return response.count or 0
        except Exception as e:
            logger.warning(f"Failed to get pending observation count: {e}")
            return 0

    # ── Event dispatcher ─────────────────────────────────────────────────────

    def _dispatch(self, obs: dict) -> list[str]:
        """
        Route an observation to the appropriate handlers.
        Returns a list of learnings (strings) describing what was updated.
        """
        event_type = obs.get("event_type", "")
        event_data: dict = obs.get("event_data") or {}
        project_id: Optional[str] = obs.get("project_id")
        learnings: list[str] = []

        if event_type == "task_completed":
            # Update duration estimates for this task type
            self.pattern_extractor.update_duration_estimate(event_data)
            learnings.append(f"duration_estimate updated for task_type={event_data.get('task_type', 'general')}")

            # Update team member's profile
            self.team_intelligence.record_task_completion(event_data)
            if event_data.get("assignee"):
                learnings.append(f"team_intelligence updated for assignee={event_data['assignee']}")

        elif event_type == "task_rejected":
            # Record rejection in quality patterns
            self.quality_patterns.record_rejection(event_data)
            learnings.append(f"quality_pattern rejection recorded for task_type={event_data.get('task_type', 'general')}")

            # Also update team member's approval rate
            self.team_intelligence.record_task_rejection(event_data)

        elif event_type == "task_approved":
            # Record first-review success in quality patterns
            self.quality_patterns.record_approval(event_data)
            learnings.append(f"quality_pattern approval recorded for task_type={event_data.get('task_type', 'general')}")

            # Update team member's approval rate (positive)
            self.team_intelligence.record_first_review_approval(event_data)

        elif event_type == "project_completed":
            # Full project template extraction (heavier operation)
            if project_id:
                template_id = self.pattern_extractor.extract_project_template(project_id)
                if template_id:
                    learnings.append(f"project_template upserted | template_id={template_id}")
            else:
                logger.warning("project_completed event has no project_id, skipping template extraction")

        elif event_type == "sprint_completed":
            # Sprint velocity is tracked separately in archon_team_velocity via existing logic.
            # ai_model_accuracy will be updated by the scheduled accuracy calculator.
            learnings.append("sprint_completed noted — velocity tracking handled by existing sprint service")

        elif event_type in ("task_stalled", "dependency_blocked", "sprint_started", "agent_task_completed"):
            # These events are observed for future pattern extraction
            # but do not currently update a knowledge store.
            learnings.append(f"{event_type} recorded for future analysis")

        else:
            logger.warning(f"Unknown event_type='{event_type}' in observation {obs.get('id')}")

        return learnings

    # ── Database helpers ─────────────────────────────────────────────────────

    def _fetch_unprocessed(self, limit: int) -> list[dict]:
        """Fetch up to `limit` unprocessed observations, oldest first."""
        try:
            response = (
                self.client.table("ai_observations")
                .select("*")
                .eq("processed", False)
                .order("created_at")
                .limit(limit)
                .execute()
            )
            return response.data or []

        except Exception as e:
            logger.error(f"Failed to fetch unprocessed observations: {e}", exc_info=True)
            return []

    def _mark_processed(self, obs_id: str, learnings: list[str]) -> None:
        """Mark an observation as successfully processed."""
        try:
            self.client.table("ai_observations").update({
                "processed": True,
                "processed_at": "now()",
                "patterns_extracted": [{"learning": l} for l in learnings],
                "applied_to": list({l.split(" ")[0] for l in learnings}),
            }).eq("id", obs_id).execute()
        except Exception as e:
            logger.warning(f"Failed to mark observation {obs_id} as processed: {e}")

    def _mark_failed(self, obs_id: str, error: str) -> None:
        """Mark an observation as processed-but-failed so it is not retried."""
        try:
            self.client.table("ai_observations").update({
                "processed": True,
                "processed_at": "now()",
                "patterns_extracted": [{"error": error}],
            }).eq("id", obs_id).execute()
        except Exception as e:
            logger.warning(f"Failed to mark observation {obs_id} as failed: {e}")
