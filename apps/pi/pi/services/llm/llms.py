# SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
# SPDX-License-Identifier: LicenseRef-Plane-Commercial
#
# Licensed under the Plane Commercial License (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
# https://plane.so/legals/eula
#
# DO NOT remove or modify this notice.
# NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.

"""Language Model Factory and Configuration Module.

This module provides centralized LLM creation for the Plane AI application.
"""

from dataclasses import dataclass
from typing import Any
from typing import AsyncIterator
from typing import Callable
from typing import Dict
from typing import Iterator
from typing import Optional
from typing import Tuple
from uuid import UUID

from langchain_anthropic import ChatAnthropic
from langchain_aws import ChatBedrock
from langchain_core.language_models.base import BaseLanguageModel
from langchain_core.runnables import Runnable
from langchain_core.runnables import RunnableConfig
from langchain_openai import ChatOpenAI
from pydantic import SecretStr
from sqlmodel.ext.asyncio.session import AsyncSession

from pi import logger
from pi import settings
from pi.app.models.enums import MessageMetaStepType
from pi.core.db.plane_pi.lifecycle import get_streaming_db_session

log = logger.getChild(__name__)


@dataclass
class LLMConfig:
    """Configuration for LLM instances."""

    model: str
    temperature: Optional[float] = 0.2
    streaming: bool = False
    seed: Optional[int] = None
    max_completion_tokens: Optional[int] = None
    frequency_penalty: Optional[float] = None
    base_url: Optional[str] = None
    api_key: Optional[str] = None
    reasoning_effort: Optional[str] = None
    tracking_model_key: Optional[str] = None

    def __post_init__(self) -> None:
        if self.seed is None:
            self.seed = settings.llm_config.OPENAI_RANDOM_SEED

    @classmethod
    def openai(
        cls,
        model: str,
        *,
        streaming: bool = False,
        temperature: float = 0.2,
        seed: Optional[int] = None,
        max_completion_tokens: Optional[int] = None,
        frequency_penalty: Optional[float] = None,
        reasoning_effort: Optional[str] = None,
        base_url: Optional[str] = None,
        api_key: Optional[str] = None,
        tracking_model_key: Optional[str] = None,
    ) -> "LLMConfig":
        """Create an OpenAI LLM configuration."""
        return cls(
            model=model,
            temperature=temperature,
            streaming=streaming,
            seed=seed,
            max_completion_tokens=max_completion_tokens,
            frequency_penalty=frequency_penalty,
            reasoning_effort=reasoning_effort,
            tracking_model_key=tracking_model_key,
            base_url=base_url or settings.llm_config.OPENAI_BASE_URL,
            api_key=api_key or settings.llm_config.OPENAI_API_KEY,
        )

    @classmethod
    def anthropic(
        cls,
        model: str,
        *,
        streaming: bool = False,
        temperature: float = 0.2,
        seed: Optional[int] = None,
        max_completion_tokens: Optional[int] = None,
        frequency_penalty: Optional[float] = None,
        reasoning_effort: Optional[str] = None,
        base_url: Optional[str] = None,
        api_key: Optional[str] = None,
        tracking_model_key: Optional[str] = None,
    ) -> "LLMConfig":
        """Create an Anthropic LLM configuration (OpenAI-compatible gateway)."""
        return cls(
            model=model,
            temperature=temperature,
            streaming=streaming,
            seed=seed,
            max_completion_tokens=max_completion_tokens,
            frequency_penalty=frequency_penalty,
            reasoning_effort=reasoning_effort,
            tracking_model_key=tracking_model_key,
            base_url=base_url or settings.llm_config.CLAUDE_BASE_URL,
            api_key=api_key or settings.llm_config.CLAUDE_API_KEY,
        )

    @classmethod
    def groq(
        cls,
        model: str,
        *,
        streaming: bool = False,
        temperature: float = 0.2,
        seed: Optional[int] = None,
        max_completion_tokens: Optional[int] = None,
        frequency_penalty: Optional[float] = None,
        base_url: Optional[str] = None,
        api_key: Optional[str] = None,
    ) -> "LLMConfig":
        """Create a Groq LLM configuration (OpenAI-compatible API)."""
        # Config stores root URL (e.g. https://api.groq.com/);
        # ChatOpenAI needs the OpenAI-compatible base: {root}/openai/v1
        groq_root = (base_url or settings.llm_config.GROQ_BASE_URL).rstrip("/")
        groq_chat_url = f"{groq_root}/openai/v1"
        return cls(
            model=model,
            temperature=temperature,
            streaming=streaming,
            seed=seed,
            max_completion_tokens=max_completion_tokens,
            frequency_penalty=frequency_penalty,
            base_url=groq_chat_url,
            api_key=api_key or settings.llm_config.GROQ_API_KEY,
        )


class TrackedLLM(Runnable):
    """Wrapper for LLMs that automatically tracks token usage."""

    def __init__(self, llm: Any, model_key: str):
        """Initialize TrackedLLM wrapper.

        Args:
            llm: The underlying LLM instance
            model_key: The model key (e.g., "gpt-4o", "gpt-4.1")
        """
        super().__init__()
        self._llm = llm
        self._model_key = model_key
        self._tracking_context: Optional[Dict[str, Any]] = None
        self.model_name = model_key  # For compatibility

    def set_tracking_context(self, message_id: UUID, db: AsyncSession, step_type: MessageMetaStepType, chat_id: Optional[str] = None) -> None:
        """Set token tracking context for subsequent LLM calls.

        Args:
            message_id: The message ID to associate with token usage
            db: Database session for storing token usage
            step_type: The type of step being performed
            chat_id: Optional chat ID for logging correlation
        """
        self._tracking_context = {"message_id": message_id, "db": db, "step_type": step_type, "chat_id": chat_id}

    def clear_tracking_context(self) -> None:
        """Clear the tracking context."""
        self._tracking_context = None

    async def _track_tokens(self, response: Any) -> None:
        """Track token usage if context is set."""
        if self._tracking_context:
            try:
                from pi.services.llm.token_tracker import TokenTracker

                # Use an isolated short-lived DB session to avoid concurrent AsyncSession usage
                async with get_streaming_db_session() as local_db:
                    tracker = TokenTracker(local_db, self._tracking_context["message_id"])
                    await tracker.track_llm_usage(response, self._model_key, self._tracking_context["step_type"])
            except Exception as e:
                log.warning(f"Failed to track token usage: {e}")

    # Delegate all BaseLanguageModel methods to the underlying LLM
    async def ainvoke(self, input: Any, config: Optional[RunnableConfig] = None, **kwargs: Any) -> Any:  # noqa: A002
        """Async invoke with automatic token tracking."""
        import time

        start_time = time.time()
        response = await self._llm.ainvoke(input, config, **kwargs)
        elapsed = time.time() - start_time
        chat_id = self._tracking_context.get("chat_id") if self._tracking_context else None
        step_type = self._tracking_context.get("step_type") if self._tracking_context else None
        chat_prefix = f"ChatID: {chat_id} - " if chat_id else ""
        step_suffix = f" ({step_type.value})" if step_type else ""
        log.info(f"{chat_prefix}LLM[{self._model_key}] ainvoke took {elapsed:.2f}s{step_suffix}")
        await self._track_tokens(response)
        return response

    def invoke(self, input: Any, config: Optional[RunnableConfig] = None, **kwargs: Any) -> Any:  # noqa: A002
        """Sync invoke - note: token tracking only works with async methods."""
        response = self._llm.invoke(input, config, **kwargs)
        # Can't track tokens in sync mode - would need async context
        if self._tracking_context:
            log.warning("Token tracking skipped in sync invoke - use ainvoke for tracking")
        return response

    async def astream(self, input: Any, config: Optional[RunnableConfig] = None, **kwargs: Optional[Any]) -> AsyncIterator[Any]:  # noqa: A002
        """Async stream with automatic token tracking."""
        import time

        start_time = time.time()
        chunks = []
        first_chunk_time = None
        chat_id = self._tracking_context.get("chat_id") if self._tracking_context else None
        step_type = self._tracking_context.get("step_type") if self._tracking_context else None
        chat_prefix = f"ChatID: {chat_id} - " if chat_id else ""
        step_suffix = f" ({step_type.value})" if step_type else ""

        async for chunk in self._llm.astream(input, config, **(kwargs or {})):
            if not chunk:  # covers None or falsy chunks
                log.warning(f"{chat_prefix}TrackedLLM[{self._model_key}]: Received an empty chunk")
                log.debug(f"{chat_prefix}Empty chunk input: {getattr(input, "messages", input)}")
            else:
                if first_chunk_time is None:
                    first_chunk_time = time.time()
                    ttfc = first_chunk_time - start_time
                    log.info(f"{chat_prefix}LLM[{self._model_key}] astream TTFC: {ttfc:.2f}s{step_suffix}")
                chunks.append(chunk)
                yield chunk

        if not chunks:
            log.error(f"{chat_prefix}TrackedLLM[{self._model_key}]: Stream completed with no chunks")
            log.debug(f"{chat_prefix}Empty stream input: {getattr(input, "messages", input)}")

        elapsed = time.time() - start_time
        log.info(f"{chat_prefix}LLM[{self._model_key}] astream total took {elapsed:.2f}s{step_suffix}")

        # Track aggregated chunks
        if chunks and self._tracking_context:
            try:
                # Aggregate chunks to get final usage metadata
                aggregate = None
                for chunk in chunks:
                    aggregate = chunk if aggregate is None else aggregate + chunk

                if aggregate and hasattr(aggregate, "usage_metadata") and aggregate.usage_metadata:
                    await self._track_tokens(aggregate)
            except Exception as e:
                log.warning(f"Failed to track streaming tokens: {e}")

    def stream(self, input: Any, config: Optional[RunnableConfig] = None, **kwargs: Optional[Any]) -> Iterator[Any]:  # noqa: A002
        """Sync stream - note: token tracking only works with async methods."""
        if self._tracking_context:
            log.warning("Token tracking skipped in sync stream - use astream for tracking")
        return self._llm.stream(input, config, **(kwargs or {}))

    # Pass through common attributes
    def __getattr__(self, name: str) -> Any:
        """Delegate attribute access to the underlying LLM."""
        return getattr(self._llm, name)

    @property
    def InputType(self):
        """Return the input type of the underlying LLM."""
        return getattr(self._llm, "InputType", Any)

    @property
    def OutputType(self):
        """Return the output type of the underlying LLM."""
        return getattr(self._llm, "OutputType", Any)

    def with_structured_output(self, *args, **kwargs) -> "TrackedLLM":
        """Return a new TrackedLLM with structured output."""
        structured_llm = self._llm.with_structured_output(*args, **kwargs)
        tracked_structured = TrackedLLM(structured_llm, self._model_key)
        # Preserve tracking context
        tracked_structured._tracking_context = self._tracking_context
        return tracked_structured

    def bind_tools(self, *args, **kwargs) -> "TrackedLLM":
        """Return a new TrackedLLM with tools bound."""
        # Use getattr to handle bind_tools since it's not on BaseLanguageModel interface
        if hasattr(self._llm, "bind_tools"):
            bound_llm = self._llm.bind_tools(*args, **kwargs)
        else:
            raise AttributeError(f"{self._llm.__class__.__name__} does not support bind_tools")
        tracked_bound = TrackedLLM(bound_llm, self._model_key)
        # Preserve tracking context
        tracked_bound._tracking_context = self._tracking_context
        return tracked_bound


def create_openai_llm(config: LLMConfig, track_tokens: bool = True, **overrides: Any) -> Any:
    """Create OpenAI chat model from config with optional token tracking.

    Args:
        config: LLM configuration
        track_tokens: Whether to wrap the LLM with token tracking (default: True)
        **overrides: Additional parameters to pass to ChatOpenAI

    Returns:
        TrackedLLM if track_tokens is True, otherwise ChatOpenAI
    """
    # Build parameters with explicit types
    api_key: str = config.api_key or SecretStr(settings.llm_config.OPENAI_API_KEY).get_secret_value()
    base_url: Optional[str] = config.base_url

    openai_params: Dict[str, Any] = {
        "api_key": api_key,
        "model": config.model,
        "streaming": config.streaming,
        **overrides,
    }

    if config.temperature is not None:
        openai_params["temperature"] = config.temperature

    # Only include base_url if explicitly provided (for Azure OpenAI, proxies, etc.)
    if base_url:
        openai_params["base_url"] = base_url

    # Only add seed parameter for non-Claude models (Claude doesn't support seed)
    if config.seed is not None and not config.model.startswith("anthropic."):
        openai_params["seed"] = config.seed

    # GPT-5 family supports configurable reasoning effort.
    if config.reasoning_effort is not None and config.model.startswith("gpt-5"):
        openai_params["reasoning_effort"] = config.reasoning_effort

    # Base gpt-5 has more restrictive parameter support than versioned GPT-5.* models.
    if config.model == "gpt-5":
        openai_params.pop("temperature", None)  # Only supports default temperature (1.0)
        openai_params.pop("frequency_penalty", None)  # Not supported for gpt-5
        openai_params.pop("seed", None)  # Not supported for gpt-5

    # Handle gpt-4o-search-preview - doesn't support temperature parameter
    if config.model == settings.llm_model.GPT_4O_SEARCH_PREVIEW:
        openai_params.pop("temperature", None)
        openai_params.pop("seed", None)

    # Always enable stream_usage so that astream()/astream_events() calls
    # include token usage metadata in streamed chunks, regardless of whether
    # the model was created with streaming=True or streaming=False.
    openai_params["stream_usage"] = True

    llm = ChatOpenAI(**openai_params)

    if track_tokens:
        # Handle GPT-5 variants - we need to determine which variant based on reasoning_effort
        if config.tracking_model_key:
            tracking_model_key = config.tracking_model_key
        elif config.model == "gpt-5":
            tracking_model_key = "gpt-5-standard"
        else:
            tracking_model_key = config.model

        return TrackedLLM(llm, tracking_model_key)
    else:
        return llm


def create_anthropic_llm(config: LLMConfig, track_tokens: bool = True, **overrides: Any) -> Any:
    """Create Anthropic chat model with prompt caching support.

    Args:
        config: LLM configuration
        track_tokens: Whether to wrap the LLM with token tracking (default: True)
        **overrides: Additional parameters to pass to ChatAnthropic

    Returns:
        TrackedLLM if track_tokens is True, otherwise ChatAnthropic
    """
    # Build parameters for ChatAnthropic
    api_key: str = config.api_key or settings.llm_config.CLAUDE_API_KEY

    anthropic_params: Dict[str, Any] = {
        "model": config.model,
        "temperature": config.temperature,
        "anthropic_api_key": api_key,
        "streaming": config.streaming,
    }

    # Set max_tokens if specified (ChatAnthropic uses max_tokens, not max_completion_tokens)
    if config.max_completion_tokens:
        anthropic_params["max_tokens"] = config.max_completion_tokens

    # Handle overrides - convert max_completion_tokens to max_tokens if present
    if "max_completion_tokens" in overrides:
        anthropic_params["max_tokens"] = overrides.pop("max_completion_tokens")

    # Add remaining overrides
    anthropic_params.update(overrides)

    # Override base URL if using custom endpoint (e.g., for proxy)
    if config.base_url:
        anthropic_params["anthropic_api_url"] = config.base_url

    # Note: Prompt caching is enabled by adding cache_control to individual messages
    # via additional_kwargs, not by passing a parameter to ChatAnthropic constructor.
    # See: askmode_tool_executor.py for implementation.

    anthropic_params["stream_usage"] = True

    llm = ChatAnthropic(**anthropic_params)

    if track_tokens:
        # Map model names to database-friendly tracking keys
        tracking_model_key = config.model
        if config.model == settings.llm_model.CLAUDE_SONNET_4_6:
            tracking_model_key = "claude-sonnet-4-6"
        elif config.model == settings.llm_model.CLAUDE_SONNET_4_5:
            tracking_model_key = "claude-sonnet-4-5"
        elif config.model == settings.llm_model.CLAUDE_SONNET_4_0:
            tracking_model_key = "claude-sonnet-4-0"

        return TrackedLLM(llm, tracking_model_key)
    else:
        return llm


def _is_custom_model(model_key: str) -> bool:
    """Check if the model_key refers to the custom self-hosted model."""
    return (
        settings.llm_config.CUSTOM_LLM_ENABLED
        and bool(settings.llm_config.CUSTOM_LLM_MODEL_KEY)
        and model_key == settings.llm_config.CUSTOM_LLM_MODEL_KEY
    )


def _create_custom_llm_config(*, streaming: bool = False) -> LLMConfig:
    """Build an LLMConfig for the custom self-hosted model."""
    if settings.llm_config.use_inference_profile:
        model = settings.llm_config.BEDROCK_INFERENCE_PROFILE_ARN or settings.llm_config.BEDROCK_INFERENCE_PROFILE_ID
        api_key = ""
    else:
        model = settings.llm_config.CUSTOM_LLM_MODEL_KEY
        api_key = settings.llm_config.CUSTOM_LLM_API_KEY
    return LLMConfig(
        model=model,
        base_url=settings.llm_config.CUSTOM_LLM_BASE_URL,
        api_key=api_key,
        streaming=streaming,
        temperature=None,
    )


def _create_bedrock_llm(config: LLMConfig, track_tokens: bool = True, **overrides: Any) -> Any:
    """Create a Bedrock LLM instance via ChatBedrock."""
    bedrock_params: dict[str, Any] = {
        "model": config.model,
        "region_name": settings.llm_config.CUSTOM_LLM_AWS_REGION,
        "streaming": config.streaming or False,
    }

    if settings.llm_config.use_inference_profile:
        bedrock_params["provider"] = "anthropic"
    else:
        bedrock_params["bedrock_api_key"] = config.api_key

    if config.temperature is not None:
        bedrock_params["temperature"] = config.temperature

    # Bedrock uses max_tokens, not max_completion_tokens
    if config.max_completion_tokens:
        bedrock_params["max_tokens"] = config.max_completion_tokens

    # Handle overrides - convert max_completion_tokens to max_tokens if present
    if "max_completion_tokens" in overrides:
        bedrock_params["max_tokens"] = overrides.pop("max_completion_tokens")

    bedrock_params.update(overrides)

    llm = ChatBedrock(**bedrock_params)
    return TrackedLLM(llm, config.model) if track_tokens else llm


def create_custom_llm(config: LLMConfig, track_tokens: bool = True, **overrides: Any) -> Any:
    """Create the appropriate LangChain chat model based on CUSTOM_LLM_PROVIDER.

    Supported values: openai (default), bedrock.
    """
    provider = settings.llm_config.CUSTOM_LLM_PROVIDER.lower().strip()

    try:
        if provider == "openai":
            return create_openai_llm(config, track_tokens=track_tokens, **overrides)
        elif provider == "bedrock":
            return _create_bedrock_llm(config, track_tokens=track_tokens, **overrides)
        else:
            log.warning(f"Unknown CUSTOM_LLM_PROVIDER '{provider}' (supported: openai, bedrock). Falling back to openai.")
            return create_openai_llm(config, track_tokens=track_tokens, **overrides)
    except ImportError:
        raise
    except Exception as e:
        log.error(f"Failed to create custom LLM (provider={provider}, model={config.model}): {e}")
        raise


_model_provider_map: dict[str, str] | None = None


def _get_model_provider(name: str) -> str:
    """Determine the provider for a model name.

    Builds a reverse map from all config sources (user-visible lists, provider
    default maps for default/fast/lightweight tiers) so that any model the
    system references — including internal-only ones like haiku — routes to the
    correct SDK.  Unknown models default to ``"openai"``.
    """
    global _model_provider_map
    if _model_provider_map is None:
        mapping: dict[str, str] = {}
        for model in settings.llm_config.USER_VISIBLE_MODELS_ANTHROPIC:
            mapping[model] = "anthropic"
        for model in settings.llm_config.USER_VISIBLE_MODELS_OPENAI:
            mapping[model] = "openai"
        for provider_map in (
            settings.llm_config.PROVIDER_DEFAULT_MODELS,
            settings.llm_config.PROVIDER_DEFAULT_MODELS_FAST,
            settings.llm_config.PROVIDER_DEFAULT_MODELS_LIGHTWEIGHT,
        ):
            for provider, model in provider_map.items():
                mapping[model] = provider
        _model_provider_map = mapping
    return _model_provider_map.get(name, "openai")


ProviderConfigFactory = Callable[..., LLMConfig]
ProviderLLMFactory = Callable[..., Any]
ProviderFactoryPair = Tuple[ProviderConfigFactory, ProviderLLMFactory]


_PROVIDER_FACTORY: Dict[str, ProviderFactoryPair] = {
    "anthropic": (LLMConfig.anthropic, create_anthropic_llm),
    "openai": (LLMConfig.openai, create_openai_llm),
}


@dataclass(frozen=True)
class ResolvedModelSpec:
    """Concrete provider/config pair used to instantiate an LLM."""

    provider: str
    config: LLMConfig


def _resolve_model_spec(
    model_name: str,
    *,
    streaming: bool = False,
    temperature: float = 0.2,
) -> ResolvedModelSpec:
    """Resolve a user-facing model name into a concrete provider/config pair."""
    name = model_name.lower()

    if _is_custom_model(name):
        return ResolvedModelSpec(
            provider="custom",
            config=_create_custom_llm_config(streaming=streaming),
        )

    provider = _get_model_provider(name)
    provider_factory = _PROVIDER_FACTORY.get(provider)
    if provider_factory is None:
        provider_factory = _PROVIDER_FACTORY["openai"]
    config_factory, _ = provider_factory
    return ResolvedModelSpec(
        provider=provider,
        config=config_factory(name, streaming=streaming, temperature=temperature),
    )


def _create_llm_from_spec(spec: ResolvedModelSpec, **overrides: Any) -> Any:
    """Instantiate an LLM from a resolved provider/config pair."""
    if spec.provider == "custom":
        return create_custom_llm(spec.config, **overrides)

    provider_factory = _PROVIDER_FACTORY.get(spec.provider)
    if provider_factory is None:
        provider_factory = _PROVIDER_FACTORY["openai"]
    _, llm_factory = provider_factory
    return llm_factory(spec.config, **overrides)


def _resolve_llm(
    model_name: str,
    *,
    streaming: bool = False,
    temperature: float = 0.2,
    **overrides: Any,
) -> Any:
    """Create an LLM instance for the given model name.

    Routes: custom → provider-based (Anthropic / OpenAI) → GPT-5 special cases → OpenAI default.
    """
    spec = _resolve_model_spec(model_name, streaming=streaming, temperature=temperature)
    return _create_llm_from_spec(spec, **overrides)


def _has_openai_key() -> bool:
    return bool(settings.llm_config.OPENAI_API_KEY and settings.llm_config.OPENAI_API_KEY.strip())


def _has_claude_key() -> bool:
    return bool(settings.llm_config.CLAUDE_API_KEY and settings.llm_config.CLAUDE_API_KEY.strip())


def _has_groq_key() -> bool:
    return bool(settings.llm_config.GROQ_API_KEY and settings.llm_config.GROQ_API_KEY.strip())


class LLMFactory:
    """Single entry point for creating LLM instances.

    All methods are classmethods so callers can use ``LLMFactory.get_chat_llm(...)``
    without instantiating.  Module-level aliases (e.g. ``get_chat_llm``) are provided
    for backward compatibility.
    """

    # -- core tiers (streaming / temperature variants) -------------------------

    @classmethod
    def get_default_llm(cls, model_name: Optional[str] = None) -> Any:
        return _resolve_llm(model_name or settings.llm_model.DEFAULT, streaming=False, temperature=0.2)

    @classmethod
    def get_stream_llm(cls, model_name: Optional[str] = None) -> Any:
        return _resolve_llm(model_name or settings.llm_model.DEFAULT, streaming=True, temperature=0.2)

    @classmethod
    def get_decomposer_llm(cls, model_name: Optional[str] = None) -> Any:
        return _resolve_llm(model_name or settings.llm_model.DEFAULT, streaming=False, temperature=0.0)

    @classmethod
    def get_fast_llm(cls, streaming: bool = False, model_name: Optional[str] = None) -> Any:
        """Cheap/fast tier: OpenAI gpt-4.1 → Claude sonnet-4.0 → custom → default."""
        if model_name and _is_custom_model(model_name):
            return _resolve_llm(model_name, streaming=streaming)

        if _has_openai_key():
            return _resolve_llm(settings.llm_config.PROVIDER_DEFAULT_MODELS_FAST["openai"], streaming=streaming)
        elif _has_claude_key():
            return _resolve_llm(settings.llm_config.PROVIDER_DEFAULT_MODELS_FAST["anthropic"], streaming=streaming)
        else:
            return cls.get_default_llm(settings.llm_model.DEFAULT)

    # -- purpose-specific constructors -----------------------------------------

    @classmethod
    def get_chat_llm(cls, llm_name: str) -> Any:
        """Streaming LLM for interactive chat with fallback."""
        try:
            return _resolve_llm(llm_name, streaming=True, temperature=0.2)
        except Exception as e:
            log.error(f"Failed to create LLM client ({llm_name!r}): {e}")
            return _resolve_llm(cls.get_fallback_model_name(llm_name), streaming=True, temperature=0.2)

    @classmethod
    def get_tool_llm(cls, model_name: Optional[str] = None) -> Any:
        """Non-streaming lazy LLM used for tool binding and orchestration."""
        resolved = _resolve_model_spec(model_name or settings.llm_model.GPT_4_1, streaming=False, temperature=0.2)
        return LazyLLM(lambda spec=resolved: _create_llm_from_spec(spec))

    @classmethod
    def get_sql_agent_llm(cls, operation_type: str, llm_model: str = settings.llm_model.GPT_4_1) -> BaseLanguageModel:
        """Non-streaming LLM tuned for SQL generation."""
        try:
            name = llm_model.lower()
            overrides: Dict[str, Any] = {"max_completion_tokens": 4096}

            if not (_is_custom_model(name) or _get_model_provider(name) == "anthropic"):
                overrides["frequency_penalty"] = 0.2

            return _resolve_llm(llm_model, streaming=False, temperature=0.2, **overrides)
        except Exception as e:
            log.error(f"Failed to create SQL agent LLM for operation '{operation_type}': {e}")
            fallback_config = LLMConfig.openai(settings.llm_model.GPT_4_1, temperature=0.2, streaming=False)
            return create_openai_llm(fallback_config)

    @classmethod
    def get_lightweight_llm(cls, *, streaming: bool = False, temperature: float = 0.0, model_name: Optional[str] = None) -> BaseLanguageModel:
        """Cheapest available LLM for lightweight tasks (title gen, dedupe, etc.).

        When *model_name* is provided, the lightweight model is chosen from the
        same provider so we don't cross provider boundaries (e.g. user selects
        Claude → title gen uses Haiku, not GPT-4.1 nano).

        When *model_name* is None, falls back to whichever provider key is available.
        """
        lw = settings.llm_config.PROVIDER_DEFAULT_MODELS_LIGHTWEIGHT

        if model_name:
            if _is_custom_model(model_name):
                return _resolve_llm(model_name, streaming=streaming, temperature=temperature)
            provider = _get_model_provider(model_name.lower())
            return _resolve_llm(lw.get(provider, lw["openai"]), streaming=streaming, temperature=temperature)

        if _has_openai_key():
            return _resolve_llm(lw["openai"], streaming=streaming, temperature=temperature)
        if _has_claude_key():
            return _resolve_llm(lw["anthropic"], streaming=streaming, temperature=temperature)
        if settings.llm_config.CUSTOM_LLM_ENABLED and settings.llm_config.CUSTOM_LLM_MODEL_KEY:
            return _resolve_llm(settings.llm_config.CUSTOM_LLM_MODEL_KEY, streaming=streaming, temperature=temperature)
        return cls.get_default_llm(settings.llm_model.DEFAULT)

    @classmethod
    def get_pql_llm(cls) -> Any:
        """LLM for PQL translation — prefers Groq kimi-k2, falls back to fast LLM."""
        if _has_groq_key():
            config = LLMConfig.groq("moonshotai/kimi-k2-instruct-0905", streaming=False, temperature=0.2)
            return create_openai_llm(config)
        return cls.get_fast_llm(streaming=False)

    # -- helpers ---------------------------------------------------------------

    @staticmethod
    def get_fallback_model_name(current_model: Optional[str] = None) -> str:
        """Best available fallback model from the same provider as *current_model*.

        When *current_model* is given, the fallback stays within the same provider
        (e.g. Claude user gets Claude fallback, not GPT).  When None, falls back
        to whichever provider key is available.
        """
        fast = settings.llm_config.PROVIDER_DEFAULT_MODELS_FAST

        if current_model:
            if _is_custom_model(current_model):
                return current_model
            provider = _get_model_provider(current_model.lower())
            if provider in fast and (provider != "openai" or _has_openai_key()) and (provider != "anthropic" or _has_claude_key()):
                return fast[provider]

        if _has_openai_key():
            return fast.get("openai", settings.llm_model.GPT_4_1)
        elif _has_claude_key():
            return fast.get("anthropic", settings.llm_model.CLAUDE_SONNET_4_0)
        else:
            return settings.llm_model.DEFAULT

    @classmethod
    def create_openai(cls, **kwargs: Any) -> Any:
        """Create OpenAI model with direct parameters."""
        track_tokens = kwargs.pop("track_tokens", True)
        config = LLMConfig.openai(
            kwargs.pop("model", settings.llm_model.GPT_4O),
            temperature=kwargs.pop("temperature", 0.2),
            streaming=kwargs.pop("streaming", False),
            seed=kwargs.pop("seed", settings.llm_config.OPENAI_RANDOM_SEED),
            base_url=kwargs.pop("base_url", None),
            api_key=kwargs.pop("api_key", None),
        )
        return create_openai_llm(config, track_tokens=track_tokens, **kwargs)


class LazyLLM(Runnable):
    """Lazy initialization proxy for LLMs to avoid shared SSL contexts in forked processes."""

    def __init__(self, factory_func: Any):
        self._factory_func = factory_func
        self._proxy_target: Any = None

    @property
    def _target(self) -> Any:
        if self._proxy_target is None:
            self._proxy_target = self._factory_func()
        return self._proxy_target

    def invoke(self, input: Any, config: Optional[RunnableConfig] = None, **kwargs: Any) -> Any:  # noqa: A002
        return self._target.invoke(input, config, **kwargs)

    async def ainvoke(self, input: Any, config: Optional[RunnableConfig] = None, **kwargs: Any) -> Any:  # noqa: A002
        return await self._target.ainvoke(input, config, **kwargs)

    def stream(self, input: Any, config: Optional[RunnableConfig] = None, **kwargs: Any) -> Iterator[Any]:  # noqa: A002
        return self._target.stream(input, config, **kwargs)

    async def astream(self, input: Any, config: Optional[RunnableConfig] = None, **kwargs: Any) -> AsyncIterator[Any]:  # noqa: A002
        async for chunk in self._target.astream(input, config, **kwargs):
            yield chunk

    def bind_tools(self, *args: Any, **kwargs: Any) -> Any:
        return self._target.bind_tools(*args, **kwargs)

    def with_structured_output(self, *args: Any, **kwargs: Any) -> Any:
        return self._target.with_structured_output(*args, **kwargs)

    def set_tracking_context(self, message_id: UUID, db: AsyncSession, step_type: MessageMetaStepType, chat_id: Optional[str] = None) -> None:
        """Delegate tracking context to the underlying TrackedLLM."""
        return self._target.set_tracking_context(message_id, db, step_type, chat_id)

    def clear_tracking_context(self) -> None:
        """Delegate tracking context clearing to the underlying TrackedLLM."""
        return self._target.clear_tracking_context()

    def __getattr__(self, name: str) -> Any:
        return getattr(self._target, name)

    @property
    def InputType(self) -> Any:
        return self._target.InputType

    @property
    def OutputType(self) -> Any:
        return self._target.OutputType
