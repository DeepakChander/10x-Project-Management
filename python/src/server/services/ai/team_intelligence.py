"""
AI Team Intelligence Service

Builds and updates team member profiles in ai_team_intelligence.
Tracks skills, WIP capacity, velocity, review quality, and
collaboration patterns from task completion history.
"""

import logging
from typing import Optional

from ...config.database import get_supabase_client

logger = logging.getLogger(__name__)

# Minimum tasks before confidence reaches meaningful levels
MIN_TASKS_FOR_CONFIDENCE = 5

# Assignee values that are not real people — skip profiling
NON_HUMAN_ASSIGNEES = {"User", "10x", "AI IDE Agent", "Agent", "", None}


class AITeamIntelligenceService:
    def __init__(self, supabase_client=None):
        self.client = supabase_client or get_supabase_client()

    # ── Public API ──────────────────────────────────────────────────────────

    def record_task_completion(self, event_data: dict) -> None:
        """
        Update a team member's profile when they complete a task.
        Updates: data_points, preferred_task_types, skills_strong, sprint velocity proxy.
        """
        assignee = event_data.get("assignee")
        if assignee in NON_HUMAN_ASSIGNEES:
            return

        try:
            person = self._find_person_by_name(assignee)
            if not person:
                logger.debug(f"No user profile found for assignee='{assignee}', skipping")
                return

            person_id = person["id"]
            profile = self._get_or_create_profile(person_id)

            task_type = event_data.get("task_type") or "general"
            duration_days = event_data.get("duration_actual_days")
            story_points = event_data.get("story_points")

            new_data_points = (profile.get("data_points") or 0) + 1

            # Add task type to preferred list
            preferred = set(profile.get("preferred_task_types") or [])
            preferred.add(task_type)

            # Update skills_strong if they complete this type quickly relative to average
            skills_strong = self._update_strong_skills(
                profile.get("skills_strong") or [],
                task_type,
                duration_days,
                profile,
            )

            # Recalculate confidence
            new_confidence = min((new_data_points / 20.0) * 0.95, 0.95)

            self.client.table("ai_team_intelligence").update({
                "data_points": new_data_points,
                "preferred_task_types": list(preferred),
                "skills_strong": skills_strong,
                "confidence": round(new_confidence, 2),
            }).eq("person_id", person_id).execute()

            logger.info(
                f"Team intelligence updated | person={assignee} "
                f"task_type={task_type} data_points={new_data_points}"
            )

        except Exception as e:
            logger.warning(f"Failed to record task completion for '{assignee}': {e}")

    def record_task_rejection(self, event_data: dict) -> None:
        """
        Called when an assignee's task is sent back from review.
        Decreases their first_review_approval_rate.
        """
        assignee = event_data.get("assignee")
        if assignee in NON_HUMAN_ASSIGNEES:
            return

        try:
            person = self._find_person_by_name(assignee)
            if not person:
                return

            profile = self._get_or_create_profile(person["id"])
            self._update_approval_rate(person["id"], profile, approved=False)

        except Exception as e:
            logger.warning(f"Failed to record rejection for '{assignee}': {e}")

    def record_first_review_approval(self, event_data: dict) -> None:
        """
        Called when task passes review on first attempt (review → done).
        Increases first_review_approval_rate.
        """
        assignee = event_data.get("assignee")
        if assignee in NON_HUMAN_ASSIGNEES:
            return

        try:
            person = self._find_person_by_name(assignee)
            if not person:
                return

            profile = self._get_or_create_profile(person["id"])
            self._update_approval_rate(person["id"], profile, approved=True)

        except Exception as e:
            logger.warning(f"Failed to record approval for '{assignee}': {e}")

    def get_profile(self, person_id: str) -> Optional[dict]:
        """Return a team member's AI intelligence profile."""
        try:
            response = (
                self.client.table("ai_team_intelligence")
                .select("*")
                .eq("person_id", person_id)
                .limit(1)
                .execute()
            )
            return response.data[0] if response.data else None

        except Exception as e:
            logger.warning(f"Failed to get profile for person_id={person_id}: {e}")
            return None

    def get_best_assignee_for_task(self, task_type: str) -> Optional[dict]:
        """
        Find the team member best suited for a given task type.
        Returns the person with the highest approval rate who has done this task type before.
        """
        try:
            # Search by task type in skills_strong first
            response = (
                self.client.table("ai_team_intelligence")
                .select("person_id, first_review_approval_rate, data_points, confidence")
                .contains("skills_strong", [task_type])
                .gte("confidence", 0.25)
                .order("first_review_approval_rate", desc=True)
                .limit(1)
                .execute()
            )

            if response.data:
                return response.data[0]

            # Fall back to preferred_task_types
            response = (
                self.client.table("ai_team_intelligence")
                .select("person_id, first_review_approval_rate, data_points, confidence")
                .contains("preferred_task_types", [task_type])
                .gte("confidence", 0.25)
                .order("first_review_approval_rate", desc=True)
                .limit(1)
                .execute()
            )

            return response.data[0] if response.data else None

        except Exception as e:
            logger.warning(f"Failed to find best assignee for task_type={task_type}: {e}")
            return None

    def refresh_all_profiles(self) -> dict:
        """
        Full rebuild of all team intelligence profiles from historical task data.
        Call this when initializing or after a major data import.
        Returns summary of profiles built.
        """
        logger.info("Starting full team intelligence refresh")

        try:
            # Get all completed tasks with assignee and timing data
            response = (
                self.client.table("archon_tasks")
                .select("assignee, task_type, priority, story_points, started_at, completed_at, reviewer_id")
                .eq("status", "done")
                .not_.is_("assignee", "null")
                .execute()
            )

            tasks = response.data or []
            assignees_processed = set()
            profiles_built = 0

            # Group tasks by assignee
            by_assignee: dict[str, list[dict]] = {}
            for task in tasks:
                a = task.get("assignee")
                if a and a not in NON_HUMAN_ASSIGNEES:
                    by_assignee.setdefault(a, []).append(task)

            for assignee, assignee_tasks in by_assignee.items():
                person = self._find_person_by_name(assignee)
                if not person:
                    continue

                self._rebuild_profile_from_tasks(person["id"], assignee, assignee_tasks)
                assignees_processed.add(assignee)
                profiles_built += 1

            logger.info(f"Team intelligence refresh complete | profiles_built={profiles_built}")
            return {"profiles_built": profiles_built, "assignees": list(assignees_processed)}

        except Exception as e:
            logger.error(f"Team intelligence refresh failed: {e}", exc_info=True)
            return {"profiles_built": 0, "error": str(e)}

    # ── Internal helpers ─────────────────────────────────────────────────────

    def _find_person_by_name(self, assignee: str) -> Optional[dict]:
        """Look up user profile by display_name or email matching the assignee string."""
        try:
            response = (
                self.client.table("archon_users_profile")
                .select("id, display_name, email")
                .or_(f"display_name.eq.{assignee},email.eq.{assignee}")
                .limit(1)
                .execute()
            )
            return response.data[0] if response.data else None

        except Exception as e:
            logger.debug(f"Person lookup failed for '{assignee}': {e}")
            return None

    def _get_or_create_profile(self, person_id: str) -> dict:
        """Get existing AI team intelligence profile or create an empty one."""
        response = (
            self.client.table("ai_team_intelligence")
            .select("*")
            .eq("person_id", person_id)
            .limit(1)
            .execute()
        )

        if response.data:
            return response.data[0]

        new_profile: dict = {
            "person_id": person_id,
            "skills_strong": [],
            "skills_learning": [],
            "skills_avoid": [],
            "optimal_wip": 3,
            "preferred_task_types": [],
            "first_review_approval_rate": 50.0,
            "avg_review_cycles": 1.0,
            "quality_trend": "stable",
            "data_points": 0,
            "confidence": 0.0,
        }
        result = self.client.table("ai_team_intelligence").insert(new_profile).execute()
        return result.data[0] if result.data else new_profile

    def _update_approval_rate(self, person_id: str, profile: dict, approved: bool) -> None:
        """Recalculate approval rate using an exponential moving average."""
        current_rate = profile.get("first_review_approval_rate") or 50.0
        data_points = max(profile.get("data_points") or 1, 1)

        # Weight: newer data has more influence, capped at 20%
        weight = min(1.0 / data_points, 0.20)
        new_value = 100.0 if approved else 0.0
        new_rate = current_rate * (1 - weight) + new_value * weight

        # Detect quality trend
        if new_rate > current_rate + 2:
            trend = "improving"
        elif new_rate < current_rate - 2:
            trend = "declining"
        else:
            trend = "stable"

        try:
            self.client.table("ai_team_intelligence").update({
                "first_review_approval_rate": round(new_rate, 2),
                "quality_trend": trend,
            }).eq("person_id", person_id).execute()
        except Exception as e:
            logger.warning(f"Failed to update approval rate for person_id={person_id}: {e}")

    def _update_strong_skills(
        self,
        current_strong: list[str],
        task_type: str,
        duration_days: Optional[float],
        profile: dict,
    ) -> list[str]:
        """
        Add task_type to skills_strong if this person has done it enough times
        (appears 3+ times in preferred_task_types history, simplified heuristic).
        """
        preferred = profile.get("preferred_task_types") or []
        # Count how many times this task_type already appears (proxy for repetition)
        count = preferred.count(task_type) + 1  # +1 for the current one being added

        if count >= 3 and task_type not in current_strong:
            current_strong = list(current_strong) + [task_type]
            logger.info(
                f"Skill promoted to strong | person_id={profile.get('person_id')} "
                f"task_type={task_type}"
            )

        return current_strong

    def _rebuild_profile_from_tasks(self, person_id: str, assignee: str, tasks: list[dict]) -> None:
        """
        Rebuild a full profile from scratch given all of a person's completed tasks.
        Used during full refresh.
        """
        task_type_counts: dict[str, int] = {}
        total_story_points = 0

        for task in tasks:
            tt = task.get("task_type") or "general"
            task_type_counts[tt] = task_type_counts.get(tt, 0) + 1
            total_story_points += task.get("story_points") or 0

        # Build preferred (all types seen) and strong (seen 3+ times)
        preferred = list(task_type_counts.keys())
        strong = [tt for tt, count in task_type_counts.items() if count >= 3]

        data_points = len(tasks)
        confidence = min((data_points / 20.0) * 0.95, 0.95)

        profile_data = {
            "person_id": person_id,
            "preferred_task_types": preferred,
            "skills_strong": strong,
            "data_points": data_points,
            "confidence": round(confidence, 2),
        }

        # Upsert (insert if missing, update if exists)
        existing = self._get_or_create_profile(person_id)
        self.client.table("ai_team_intelligence").update(profile_data).eq("person_id", person_id).execute()
        logger.info(f"Profile rebuilt | assignee={assignee} data_points={data_points} strong_skills={strong}")
