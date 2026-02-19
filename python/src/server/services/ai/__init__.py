"""
AI Services Module

Provides AI-powered features with multiple provider support
and the self-learning knowledge engine.
"""

from .base_provider import AIProvider
from .claude_provider import ClaudeProvider
from .ollama_provider import OllamaProvider
from .openai_provider import OpenAIProvider
from .provider_factory import AIProviderFactory
from .observation_processor import AIObservationProcessor
from .pattern_extractor import AIPatternExtractorService
from .team_intelligence import AITeamIntelligenceService
from .quality_patterns import AIQualityPatternService

__all__ = [
    "AIProvider",
    "ClaudeProvider",
    "OpenAIProvider",
    "OllamaProvider",
    "AIProviderFactory",
    "AIObservationProcessor",
    "AIPatternExtractorService",
    "AITeamIntelligenceService",
    "AIQualityPatternService",
]
