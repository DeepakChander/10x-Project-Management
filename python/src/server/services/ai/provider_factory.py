"""
AI Provider Factory

Selects and instantiates the appropriate AI provider based on configuration
"""

import logging
import os
from typing import Any, Optional

from .base_provider import AIProvider
from .claude_provider import ClaudeProvider
from .ollama_provider import OllamaProvider
from .openai_provider import OpenAIProvider

logger = logging.getLogger(__name__)


class AIProviderFactory:
    """Factory for creating AI providers"""

    @staticmethod
    def get_provider(
        provider_name: Optional[str] = None,
        model: Optional[str] = None,
        api_key: Optional[str] = None,
    ) -> AIProvider:
        """
        Get AI provider instance.

        Args:
            provider_name: 'claude', 'openai', or 'ollama' (defaults to env var or 'ollama')
            model: Model name (optional, uses provider default)
            api_key: API key (optional, uses env var)

        Returns:
            Configured AIProvider instance
        """
        # Determine provider from env or parameter
        provider = provider_name or os.getenv("AI_PROVIDER", "ollama")

        try:
            if provider == "claude":
                return ClaudeProvider(api_key=api_key, model=model or "claude-3-5-sonnet-20241022")

            elif provider == "openai":
                return OpenAIProvider(api_key=api_key, model=model or "gpt-4o")

            elif provider == "ollama":
                # Use host.docker.internal for Docker, localhost for local dev
                ollama_url = os.getenv("OLLAMA_BASE_URL", "http://host.docker.internal:11434")
                return OllamaProvider(model=model or "llama3.1:8b", base_url=ollama_url)

            else:
                logger.warning(f"Unknown AI provider '{provider}', falling back to ollama")
                return OllamaProvider()

        except Exception as e:
            logger.error(f"Failed to create AI provider '{provider}': {e}")
            # Fallback to ollama
            logger.info("Falling back to Ollama provider")
            return OllamaProvider()

    @staticmethod
    def get_available_providers() -> list[dict[str, Any]]:
        """
        Get list of available AI providers with their status.

        Returns:
            [
                {
                    "name": "claude",
                    "display_name": "Anthropic Claude",
                    "available": bool,
                    "default_model": str
                },
                ...
            ]
        """
        providers = []

        # Claude
        claude_available = bool(os.getenv("ANTHROPIC_API_KEY"))
        providers.append({
            "name": "claude",
            "display_name": "Anthropic Claude",
            "available": claude_available,
            "default_model": "claude-3-5-sonnet-20241022",
            "status": "Ready" if claude_available else "API key required",
        })

        # OpenAI
        openai_available = bool(os.getenv("OPENAI_API_KEY"))
        providers.append({
            "name": "openai",
            "display_name": "OpenAI GPT-4",
            "available": openai_available,
            "default_model": "gpt-4o",
            "status": "Ready" if openai_available else "API key required",
        })

        # Ollama
        providers.append({
            "name": "ollama",
            "display_name": "Ollama (Local)",
            "available": True,  # Always available (assumes running locally)
            "default_model": "llama3.1:8b",
            "status": "Ready (local)",
        })

        return providers
