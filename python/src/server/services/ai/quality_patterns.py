"""
AI Quality Pattern Service

Tracks why tasks get rejected during review, aggregated by task type.
Builds prevention tips when rejection patterns are detected.
Updates ai_quality_patterns knowledge store.
"""

import logging
from typing import Optional

from src.server.utils import get_supabase_client

logger = logging.getLogger(__name__)

# Maps task_type strings to broad category buckets
TASK_TYPE_CATEGORY_MAP: dict[str, str] = {
    "blog_post": "content_creation",
    "social_caption": "content_creation",
    "social_media_post": "content_creation",
    "email_copy": "content_creation",
    "email_campaign": "content_creation",
    "landing_page": "content_creation",
    "newsletter": "content_creation",
    "press_release": "content_creation",
    "case_study": "content_creation",
    "whitepaper": "content_creation",
    "design_mockup": "design",
    "ui_design": "design",
    "ux_design": "design",
    "brand_assets": "design",
    "logo_design": "design",
    "infographic": "design",
    "presentation": "design",
    "research": "research",
    "market_analysis": "research",
    "user_research": "research",
    "competitive_analysis": "research",
    "survey": "research",
    "api_endpoint": "engineering",
    "frontend_feature": "engineering",
    "backend_feature": "engineering",
    "bug_fix": "engineering",
    "code_review": "engineering",
    "unit_test": "engineering",
    "deployment": "engineering",
    "refactor": "engineering",
    "seo_optimization": "marketing",
    "ad_copy": "marketing",
    "paid_campaign": "marketing",
    "influencer_outreach": "marketing",
    "sprint_planning": "management",
    "retrospective": "management",
    "stakeholder_update": "management",
}

# Minimum rejection count before generating prevention tips
MIN_SAMPLES_FOR_TIPS = 3

# Rejection rate that triggers a quality_tip suggestion
REJECTION_THRESHOLD_PERCENT = 30.0


class AIQualityPatternService:
    def __init__(self, supabase_client=None):
        self.client = supabase_client or get_supabase_client()

    # ── Public API ──────────────────────────────────────────────────────────

    def record_rejection(self, event_data: dict) -> None:
        """
        Called when a task is sent back from review.
        Updates rejection count and recalculates rejection rate.
        """
        task_type = event_data.get("task_type") or "general"
        category = self._infer_category(task_type)

        try:
            pattern = self._get_or_create_pattern(task_type, category)
            total_reviews = (pattern.get("total_reviews") or 0) + 1
            total_rejections = (pattern.get("total_rejections") or 0) + 1
            rejection_rate = (total_rejections / total_reviews) * 100
            confidence = min((total_reviews / 10.0) * 0.95, 0.95)

            self.client.table("ai_quality_patterns").update({
                "total_reviews": total_reviews,
                "total_rejections": total_rejections,
                "rejection_rate": round(rejection_rate, 2),
                "sample_size": total_reviews,
                "confidence": round(confidence, 2),
            }).eq("task_type", task_type).eq("category", category).execute()

            logger.info(
                f"Quality rejection recorded | task_type={task_type} "
                f"rejection_rate={rejection_rate:.1f}%"
            )

            # Auto-generate prevention tips once enough data exists
            if total_rejections >= MIN_SAMPLES_FOR_TIPS:
                self._refresh_prevention_tips(task_type, category, pattern)

        except Exception as e:
            logger.warning(f"Failed to record rejection for task_type={task_type}: {e}")

    def record_approval(self, event_data: dict) -> None:
        """
        Called when a task passes review on the first attempt (review → done).
        Updates total review count only (not rejections).
        """
        task_type = event_data.get("task_type") or "general"
        category = self._infer_category(task_type)

        try:
            pattern = self._get_or_create_pattern(task_type, category)
            total_reviews = (pattern.get("total_reviews") or 0) + 1
            total_rejections = pattern.get("total_rejections") or 0
            rejection_rate = (total_rejections / total_reviews) * 100
            confidence = min((total_reviews / 10.0) * 0.95, 0.95)

            self.client.table("ai_quality_patterns").update({
                "total_reviews": total_reviews,
                "rejection_rate": round(rejection_rate, 2),
                "sample_size": total_reviews,
                "confidence": round(confidence, 2),
            }).eq("task_type", task_type).eq("category", category).execute()

            logger.info(
                f"Quality approval recorded | task_type={task_type} "
                f"rejection_rate={rejection_rate:.1f}%"
            )

        except Exception as e:
            logger.warning(f"Failed to record approval for task_type={task_type}: {e}")

    def get_prevention_tips(self, task_type: str) -> list[str]:
        """Return prevention tips for a given task type."""
        category = self._infer_category(task_type)

        try:
            response = (
                self.client.table("ai_quality_patterns")
                .select("prevention_tips, rejection_rate, confidence")
                .eq("task_type", task_type)
                .eq("category", category)
                .limit(1)
                .execute()
            )

            if not response.data:
                return []

            pattern = response.data[0]
            if (pattern.get("confidence") or 0) < 0.3:
                return []  # Not enough data to trust these tips

            return pattern.get("prevention_tips") or []

        except Exception as e:
            logger.warning(f"Failed to get prevention tips for {task_type}: {e}")
            return []

    def get_high_rejection_types(self, threshold: float = REJECTION_THRESHOLD_PERCENT) -> list[dict]:
        """Return all task types with rejection rate above threshold."""
        try:
            response = (
                self.client.table("ai_quality_patterns")
                .select("task_type, category, rejection_rate, total_reviews, prevention_tips")
                .gte("rejection_rate", threshold)
                .gte("confidence", 0.3)
                .order("rejection_rate", desc=True)
                .execute()
            )
            return response.data or []

        except Exception as e:
            logger.warning(f"Failed to get high rejection types: {e}")
            return []

    # ── Internal helpers ─────────────────────────────────────────────────────

    def _get_or_create_pattern(self, task_type: str, category: str) -> dict:
        """Fetch existing quality pattern or insert a new empty record."""
        response = (
            self.client.table("ai_quality_patterns")
            .select("*")
            .eq("task_type", task_type)
            .eq("category", category)
            .limit(1)
            .execute()
        )

        if response.data:
            return response.data[0]

        new_pattern = {
            "task_type": task_type,
            "category": category,
            "total_reviews": 0,
            "total_rejections": 0,
            "rejection_rate": 0.0,
            "sample_size": 0,
            "confidence": 0.0,
            "prevention_tips": [],
            "success_factors": [],
            "rejection_reasons": [],
        }
        result = self.client.table("ai_quality_patterns").insert(new_pattern).execute()
        return result.data[0] if result.data else new_pattern

    def _refresh_prevention_tips(self, task_type: str, category: str, pattern: dict) -> None:
        """
        Generate prevention tips based on the category and rejection history.
        Tips are static rules derived from the task type category.
        """
        tips = self._generate_tips_for_category(category, task_type)
        if not tips:
            return

        try:
            self.client.table("ai_quality_patterns").update({
                "prevention_tips": tips,
            }).eq("task_type", task_type).eq("category", category).execute()
        except Exception as e:
            logger.warning(f"Failed to refresh prevention tips: {e}")

    def _generate_tips_for_category(self, category: str, task_type: str) -> list[str]:
        """Return prevention tips based on category."""
        base_tips: dict[str, list[str]] = {
            "content_creation": [
                "Add target keyword list to task description before starting",
                "Link to brand voice guide in task description",
                "Specify exact word count range (min–max)",
                "Require source links for all factual claims",
                "Include target audience persona in the brief",
            ],
            "design": [
                "Attach brand color palette and typography guide to task",
                "Specify exact dimensions and file format required",
                "Share approved reference examples before starting",
                "Confirm platform/device requirements upfront",
            ],
            "engineering": [
                "Write acceptance criteria before implementation begins",
                "Add unit test requirement to definition of done",
                "Link to relevant API documentation",
                "Confirm error handling approach in advance",
            ],
            "research": [
                "Define specific research questions in task description",
                "Set minimum number of sources required",
                "Specify output format (slide deck, doc, spreadsheet)",
                "Confirm data sources are accessible before starting",
            ],
            "marketing": [
                "Include target audience and campaign goal in brief",
                "Attach competitor examples for reference",
                "Specify approved channels and platform requirements",
                "Include budget or performance target in description",
            ],
            "general": [
                "Write clear acceptance criteria before starting",
                "Add definition of done to task description",
                "Review requirements with reviewer before submitting",
            ],
        }

        return base_tips.get(category, base_tips["general"])

    def _infer_category(self, task_type: str) -> str:
        """Infer category from task_type string."""
        return TASK_TYPE_CATEGORY_MAP.get(task_type, "general")
