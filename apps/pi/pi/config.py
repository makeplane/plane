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

"""Setting for the Plane AI project."""

import logging
import os
from dataclasses import dataclass
from dataclasses import field
from typing import Optional

import colorlog
from dotenv import load_dotenv

load_dotenv()


def get_env_bool(k: str, d: str = "") -> bool:
    """Get boolean env var."""
    return os.getenv(k, d).lower() in ("1", "true")


def get_env_int(k: str, d: str) -> int:
    """Get integer env var. Returns default if env var is missing or empty."""
    value = os.getenv(k, d)
    # Handle empty string - use default instead
    return int(value if value and value.strip() else d)


@dataclass
class PlaneAPI:
    """Configuration for Plane API endpoints and session."""

    HOST: str = os.getenv("PLANE_API_HOST", "https://api.plane.so")
    INTERNAL_HOST: str = (os.getenv("PLANE_INTERNAL_API_HOST", "").strip() or HOST).rstrip("/")
    BASE_PATH: str = os.getenv("PI_BASE_PATH", "")
    SESSION_CHECK: str = f"{INTERNAL_HOST}/api/users/session/"
    SESSION_COOKIE_NAME: str = os.getenv("SESSION_COOKIE_NAME", "session-id")
    FRONTEND_URL: str = os.getenv("PLANE_FRONTEND_URL", "https://app.plane.so")

    # OAuth Configuration
    PI_OAUTH_SLUG: str = "plane-ai"
    OAUTH_REDIRECT_URI: str = os.getenv("PLANE_OAUTH_REDIRECT_URI", "")
    OAUTH_URL_ENCRYPTION_KEY: str = os.getenv("PLANE_OAUTH_URL_ENCRYPTION_KEY", "Ajvaq_jsqNuI8AuRWyC1y-iro7csYpab0tYn98Q68mU=")
    PLANE_OAUTH_CLIENT_ID: str = os.getenv("PLANE_OAUTH_CLIENT_ID", "")
    PLANE_OAUTH_CLIENT_SECRET: str = os.getenv("PLANE_OAUTH_CLIENT_SECRET", "")
    AES_SECRET_KEY: str = os.getenv("AES_SECRET_KEY", "plane-testing")
    AES_SALT: str = os.getenv("AES_SALT", "aes-salt")

    # OAuth state expiry time in seconds (default: 23 hours = 82800 seconds)
    OAUTH_STATE_EXPIRY_SECONDS: int = get_env_int("PLANE_OAUTH_STATE_EXPIRY_SECONDS", "82800")


@dataclass
class FeatureFlags:
    """Feature flags constants"""

    # https://github.com/makeplane/plane-ee/blob/preview/packages/constants/src/feature-flag.ts#L59

    AI_DEDUPE = "AI_DEDUPE"
    AI_CHAT = "AI_CHAT"
    AI_CONVERSE = "AI_CONVERSE"
    AI_FILE_UPLOADS = "AI_FILE_UPLOADS"
    AI_PAGES_BLOCKS = "AI_PAGES_BLOCKS"
    AI_PAGES_SUMMARY = "AI_PAGES_SUMMARY"
    AI_MCP_CONNECTORS = "AI_MCP_CONNECTORS"
    AI_TEXT_TO_PQL = "AI_TEXT_TO_PQL"


@dataclass
class Server:
    """FastAPI server configuration settings."""

    FASTAPI_APP_HOST: str = os.getenv("FASTAPI_APP_HOST", "")
    FASTAPI_APP_PORT: str = os.getenv("FASTAPI_APP_PORT", "")
    FASTAPI_APP_WORKERS: str = os.getenv("FASTAPI_APP_WORKERS", "")
    PLANE_PI_INTERNAL_API_SECRET: str = os.getenv("PI_INTERNAL_SECRET", "")
    FASTAPI_APP_WORKER_TIMEOUT: str = os.getenv("FASTAPI_APP_WORKER_TIMEOUT", "60")


@dataclass
class VectorDB:
    """Configuration for vector database and related settings."""

    DEBUG: bool = get_env_bool("DEBUG")

    DEV_WORKSPACE_ID: str | None = os.getenv("DEV_WORKSPACE_ID")
    FEED_DOCS_DATA: bool = get_env_bool("FEED_DOCS_DATA", "0")
    FEED_ISSUES_DATA: bool = get_env_bool("FEED_ISSUES_DATA", "0")
    FEED_PAGES_DATA: bool = get_env_bool("FEED_PAGES_DATA", "0")
    FEED_SLICES: int = get_env_int("FEED_SLICES", "1")

    SCROLL_TIMEOUT: str = os.getenv("SCROLL_TIMEOUT", "10m")
    CONNECTION_TIMEOUT: int = 120
    BULK_SIZE: int = 100
    BATCH_SIZE: int = get_env_int("BATCH_SIZE", "64")

    # For vectorization
    DOCS_REPO_OWNER: str = "makeplane"
    DOCS_REPO_NAME: str = "docs,developer-docs"
    DOCS_BRANCH: str = "master"

    # For url construction in chat response
    DOCS_URL_BASE: str = "https://docs.plane.so"
    DEVELOPER_DOCS_URL_BASE: str = "https://developers.plane.so"

    # OpenSearch Configuration
    OPENSEARCH_URL: str = os.getenv("OPENSEARCH_URL", "")
    OPENSEARCH_USER: str = os.getenv("OPENSEARCH_USER", "") or os.getenv("OPENSEARCH_USERNAME", "")
    OPENSEARCH_PASSWORD: str = os.getenv("OPENSEARCH_PASSWORD", "")

    # Model Configuration
    ML_MODEL_ID: str = os.getenv("OPENSEARCH_ML_MODEL_ID", "")
    EMBEDDING_MODEL: str = os.getenv("EMBEDDING_MODEL", "cohere/embed-v4.0")
    EMBEDDING_DIMENSION: int = int(os.getenv("OPENSEARCH_EMBEDDING_DIMENSION", "1536"))

    @staticmethod
    def generate_index_name(suffix: str) -> str:
        prefix = os.getenv("OPENSEARCH_INDEX_PREFIX", "")
        if prefix:
            return f"{prefix}_{suffix}"
        else:
            return suffix

    # Index Configuration
    ISSUE_INDEX: str = generate_index_name("issues")
    PAGES_INDEX: str = generate_index_name("pages")
    MODULES_INDEX: str = generate_index_name("modules")
    CYCLES_INDEX: str = generate_index_name("cycles")
    PROJECTS_INDEX: str = generate_index_name("projects")
    COMMENTS_INDEX: str = generate_index_name("issue_comments")
    DOCS_INDEX: str = generate_index_name("docs_semantic")
    CHAT_SEARCH_INDEX: str = generate_index_name("pi_chat_messages")
    CACHE_INDEX: str = generate_index_name("rewritten_query_cache")
    CACHE_THRESHOLD: float = float(os.getenv("CACHE_THRESHOLD", "0.9"))

    # Ingest Pipeline Configuration
    DOCS_PIPELINE_NAME: str = "docs-embedding-pipeline"

    # Duplicate Detection Configuration
    DUPES_EMBED_CUTOFF: float = 0.75

    # Vector Search Configuration
    ISSUE_VECTOR_SEARCH_CUTOFF: float = 0.75
    PAGE_VECTOR_SEARCH_CUTOFF: float = 0.69
    DOC_VECTOR_SEARCH_CUTOFF: float = 0.69

    # KNN Configuration
    KNN_TOP_K: int = 50

    # Live Sync Configuration
    LIVE_SYNC_BATCH: int = get_env_int("LIVE_SYNC_BATCH", "1000")


@dataclass
class LLMModels:
    """Available language models for use in the application."""

    GPT_4O: str = "gpt-4o"
    GPT_4_1: str = "gpt-4.1"
    GPT_4_1_NANO: str = "gpt-4.1-nano"
    GPT_4O_MINI: str = "gpt-4o-mini"
    GPT_4O_SEARCH_PREVIEW: str = "gpt-4o-search-preview"  # OpenAI model with built-in web search
    LITE_LLM_CLAUDE_SONNET_4: str = "us.anthropic.claude-sonnet-4-20250514-v1:0"
    GPT_5_1: str = "gpt-5.1"
    GPT_5_2: str = "gpt-5.2"
    GPT_5_4: str = "gpt-5.4"
    DEFAULT: str = GPT_5_4
    CLAUDE_SONNET_4_0: str = "claude-sonnet-4-0"
    CLAUDE_SONNET_4_5: str = "claude-sonnet-4-5"
    CLAUDE_SONNET_4_6: str = "claude-sonnet-4-6"
    CLAUDE_HAIKU_4_5: str = "claude-haiku-4-5"  # Lightweight Claude model for fast/cheap tasks
    CUSTOM: str = field(default_factory=lambda: os.getenv("CUSTOM_LLM_MODEL_KEY", ""))

    def __post_init__(self):
        custom_enabled = os.getenv("CUSTOM_LLM_ENABLED", "false").lower() == "true"
        has_openai = bool(os.getenv("OPENAI_API_KEY", "").strip())
        has_anthropic = bool(os.getenv("CLAUDE_API_KEY", "").strip())
        if custom_enabled and not has_openai and not has_anthropic:
            # Custom-only deployment: override DEFAULT to custom model
            if self.CUSTOM:
                self.DEFAULT = self.CUSTOM


@dataclass
class LLMConfig:
    """Configuration for various language model APIs and settings."""

    # API Keys
    OPENAI_API_KEY: str = field(default_factory=lambda: os.getenv("OPENAI_API_KEY", ""))
    CLAUDE_API_KEY: str = field(default_factory=lambda: os.getenv("CLAUDE_API_KEY", ""))
    COHERE_API_KEY: str = field(default_factory=lambda: os.getenv("COHERE_API_KEY", ""))
    GROQ_API_KEY: str = field(default_factory=lambda: os.getenv("GROQ_API_KEY", ""))
    MODEL_SECRET_ARN: str = field(default_factory=lambda: os.getenv("MODEL_SECRET_ARN", ""))

    def __post_init__(self) -> None:
        secret_arn = self.MODEL_SECRET_ARN
        has_aws_creds = bool(os.getenv("AWS_ROLE_ARN", "") or os.getenv("AWS_CONTAINER_CREDENTIALS_FULL_URI", ""))
        if not (secret_arn and has_aws_creds):
            return
        from pi.utils.aws_secrets import get_secret

        region = os.getenv("AWS_REGION", "us-east-1")
        secret = get_secret(secret_arn, region)
        if not os.getenv("OPENAI_API_KEY"):
            self.OPENAI_API_KEY = str(secret.get(os.getenv("MODEL_OPENAI_KEY"), "") or "")
        if not os.getenv("CLAUDE_API_KEY"):
            self.CLAUDE_API_KEY = str(secret.get(os.getenv("MODEL_CLAUDE_KEY"), "") or "")
        if not os.getenv("GROQ_API_KEY"):
            self.GROQ_API_KEY = str(secret.get(os.getenv("MODEL_GROQ_KEY"), "") or "")
        if not os.getenv("COHERE_API_KEY"):
            self.COHERE_API_KEY = str(secret.get(os.getenv("MODEL_COHERE_KEY"), "") or "")
        if not os.getenv("CUSTOM_LLM_API_KEY"):
            key = str(secret.get(os.getenv("MODEL_CUSTOM_LLM_API_KEY"), "") or "")
            if key:
                self.CUSTOM_LLM_API_KEY = key

    # Base URLs (default to official endpoints; override via env for proxies/gateways)
    OPENAI_BASE_URL: str = field(default_factory=lambda: os.getenv("OPENAI_BASE_URL", "https://api.openai.com/v1"))
    CLAUDE_BASE_URL: str = field(default_factory=lambda: os.getenv("CLAUDE_BASE_URL", "https://api.anthropic.com"))
    COHERE_BASE_URL: str = field(default_factory=lambda: os.getenv("COHERE_BASE_URL", "https://api.cohere.ai/v1/embed"))
    GROQ_BASE_URL: str = field(default_factory=lambda: os.getenv("GROQ_BASE_URL", "https://api.groq.com/"))

    USER_VISIBLE_MODELS_OPENAI: list[str] = field(default_factory=lambda: ["gpt-5.4", "gpt-5.2"])
    USER_VISIBLE_MODELS_ANTHROPIC: list[str] = field(default_factory=lambda: ["claude-sonnet-4-5", "claude-sonnet-4-6"])
    ALL_USER_VISIBLE_MODELS: list[str] = field(
        default_factory=lambda: [
            "gpt-5.1",
            "gpt-5.4",
            "gpt-5.2",
            "claude-sonnet-4-5",
            "claude-sonnet-4-6",
        ]
    )

    # Anthropic models that support prompt caching (cache_control parameter).
    # Only direct Anthropic API models should be listed here -- NOT custom/LiteLLM models.
    # Models in USER_VISIBLE_MODELS_ANTHROPIC but absent here will work fine, just without caching.
    ANTHROPIC_CACHE_ELIGIBLE_MODELS: list[str] = field(default_factory=lambda: ["claude-sonnet-4-0", "claude-sonnet-4-5", "claude-sonnet-4-6"])

    # Provider default models
    PROVIDER_DEFAULT_MODELS: dict[str, str] = field(
        default_factory=lambda: {
            "openai": LLMModels.GPT_5_4,
            "anthropic": LLMModels.CLAUDE_SONNET_4_6,
        }
    )

    PROVIDER_DEFAULT_MODELS_FAST: dict[str, str] = field(
        default_factory=lambda: {
            "openai": LLMModels.GPT_4_1,
            "anthropic": LLMModels.CLAUDE_SONNET_4_0,
        }
    )

    PROVIDER_DEFAULT_MODELS_LIGHTWEIGHT: dict[str, str] = field(
        default_factory=lambda: {
            "openai": LLMModels.GPT_4_1_NANO,
            "anthropic": LLMModels.CLAUDE_HAIKU_4_5,
        }
    )

    # Model Names
    TESTED_FOR_WORKSPACE: list = field(
        default_factory=lambda: [
            LLMModels.GPT_4_1,
            LLMModels.GPT_5_1,
            LLMModels.GPT_5_2,
            LLMModels.GPT_5_4,
            LLMModels.CLAUDE_SONNET_4_0,
            LLMModels.CLAUDE_SONNET_4_5,
            LLMModels.CLAUDE_SONNET_4_6,
        ]
    )
    CONTEXT_OFF_TEMPERATURE: float = 0.6
    OPENAI_RANDOM_SEED: int = 314
    ENABLE_MODEL_VERIFICATION_LOGGING: bool = (
        False  # field(default_factory=lambda: os.getenv("ENABLE_MODEL_VERIFICATION_LOGGING", "false").lower() == "true")
    )
    # SQL Agent timeout configuration
    # Timeout in seconds for SQL table selection LLM calls
    # If a call exceeds this time, it will retry with a fallback model (GPT-4o)
    SQL_TABLE_SELECTION_TIMEOUT: float = 5.0

    # Web Search Configuration
    # Anthropic server-side web search tool type (versioned by Anthropic)
    ANTHROPIC_WEB_SEARCH_TOOL_TYPE: str = "web_search_20250305"
    # Maximum number of web search results to return
    WEB_SEARCH_MAX_RESULTS: int = 5

    # Custom Self-Hosted LLM Configuration
    CUSTOM_LLM_ENABLED: bool = field(default_factory=lambda: os.getenv("CUSTOM_LLM_ENABLED", "false").lower() == "true")

    CUSTOM_LLM_NAME: str = field(default_factory=lambda: (os.getenv("CUSTOM_LLM_NAME") or "").strip() or "Custom LLM")
    CUSTOM_LLM_MODEL_KEY: str = field(default_factory=lambda: os.getenv("CUSTOM_LLM_MODEL_KEY", ""))
    CUSTOM_LLM_DESCRIPTION: str = field(default_factory=lambda: (os.getenv("CUSTOM_LLM_DESCRIPTION") or "").strip() or "Custom LLM")
    CUSTOM_LLM_PROVIDER: str = field(default_factory=lambda: (os.getenv("CUSTOM_LLM_PROVIDER") or "").strip() or "openai")

    CUSTOM_LLM_BASE_URL: str = field(default_factory=lambda: os.getenv("CUSTOM_LLM_BASE_URL", ""))
    CUSTOM_LLM_API_KEY: str = field(default_factory=lambda: os.getenv("CUSTOM_LLM_API_KEY", ""))
    CUSTOM_LLM_MAX_TOKENS: int = field(default_factory=lambda: get_env_int("CUSTOM_LLM_MAX_TOKENS", "128000"))
    CUSTOM_LLM_AWS_REGION: str = field(default_factory=lambda: os.getenv("CUSTOM_LLM_AWS_REGION", ""))
    BEDROCK_INFERENCE_PROFILE_ARN: str = field(default_factory=lambda: os.getenv("BEDROCK_INFERENCE_PROFILE_ARN", ""))
    BEDROCK_INFERENCE_PROFILE_ID: str = field(default_factory=lambda: os.getenv("BEDROCK_INFERENCE_PROFILE_ID", ""))

    # Provider → required config fields
    LLM_PROVIDER_REQUIRED_ENV: dict[str, list[str]] = field(
        default_factory=lambda: {
            "openai": ["CUSTOM_LLM_MODEL_KEY", "CUSTOM_LLM_API_KEY", "CUSTOM_LLM_BASE_URL"],
            "bedrock": ["CUSTOM_LLM_MODEL_KEY", "CUSTOM_LLM_API_KEY", "CUSTOM_LLM_AWS_REGION"],
            "bedrock_inference_profile": ["CUSTOM_LLM_MODEL_KEY", "CUSTOM_LLM_AWS_REGION"],
        }
    )

    @property
    def use_inference_profile(self) -> bool:
        """True when an inference profile ARN/ID is set AND ambient AWS credentials are available (IRSA/EKS Pod Identity)."""
        has_profile = bool(self.BEDROCK_INFERENCE_PROFILE_ARN or self.BEDROCK_INFERENCE_PROFILE_ID)
        has_aws_creds = bool(
            os.getenv("AWS_ROLE_ARN", "")
            or os.getenv("AWS_CONTAINER_CREDENTIALS_FULL_URI", "")
            or os.getenv("AWS_CONTAINER_AUTHORIZATION_TOKEN_FILE", "")  # EKS Pod Identity token file
            or os.getenv("AWS_WEB_IDENTITY_TOKEN_FILE", "")  # IRSA token file
        )
        return has_profile and has_aws_creds


@dataclass
class Chat:
    """Configuration for chat-related functionality."""

    NUM_SIMILAR_DOCS: int = 10
    MAX_CHAT_LENGTH: int = 10
    CHUNKS_BEFORE_TITLE_GEN: int = 20
    MENTION_TAGS: dict = field(
        default_factory=lambda: {
            "issues": "issue",
            "pages": "page",
            "cycles": "cycle",
            "modules": "module",
            "projects": "project",
            "users": "user",
            "workitems": "workitem",
            "epics": "epic",
            "labels": "label",
            "states": "state",
            "issue_views": "issue_view",
            "teams": "teamspace",
            "initiatives": "initiative",
            "types": "type",
            "milestones": "milestone",
        },
    )
    MAX_TOOL_CALLS_PER_AGENT_RUN: int = 5
    MAX_ACTION_EXECUTOR_ITERATIONS: int = 100
    # Multi-hop tool picker: when total tool count exceeds this threshold,
    # run a rolling-batch LLM picker to select only the relevant tools.
    TOOL_COUNT_THRESHOLD: int = 80
    TOOL_PICKER_BATCH_SIZE: int = 40
    MAX_CATEGORY_RESELECT_INVOCATIONS: int = 3
    # Maximum number of tools to classify in a single LLM call.
    # Keeps structured JSON output reliable for large MCP servers (100+ tools).
    MCP_TOOL_CLASSIFICATION_BATCH_SIZE: int = 40
    MCP_OSMOSIS_MAX_CONCURRENCY: int = 8


@dataclass
class Transcription:
    """Configuration for transcription services and their pricing."""

    # Groq Whisper Configuration (API key now in LLMConfig.GROQ_API_KEY)
    GROQ_MODEL_PRICING_PER_HOUR: dict = field(
        default_factory=lambda: {
            "whisper-large-v3": 0.111,
            "whisper-large-v3-turbo": 0.04,
        }
    )

    # Default Configuration
    DEFAULT_MODEL: str = "whisper-large-v3"
    DEFAULT_PROVIDER: str = "groq"


@dataclass
class Database:
    USER: Optional[str] = os.getenv("PLANE_PI_POSTGRES_USER", None)
    PASSWORD: Optional[str] = os.getenv("PLANE_PI_POSTGRES_PASSWORD", None)
    HOST: Optional[str] = os.getenv("PLANE_PI_POSTGRES_HOST", None)
    PORT: Optional[str] = os.getenv("PLANE_PI_POSTGRES_PORT", None)
    DB: Optional[str] = os.getenv("PLANE_PI_POSTGRES_DB", None)
    URL: Optional[str] = os.getenv("PLANE_PI_DATABASE_URL", None)
    RDS_SECRET_ARN: str = os.getenv("RDS_SECRET_ARN", "")

    # Connection pool settings for Celery workers
    CELERY_POOL_SIZE: int = get_env_int("CELERY_DB_POOL_SIZE", "20")
    CELERY_POOL_MAX_OVERFLOW: int = get_env_int("CELERY_DB_POOL_MAX_OVERFLOW", "30")
    CELERY_POOL_TIMEOUT: int = get_env_int("CELERY_DB_POOL_TIMEOUT", "10")
    CELERY_POOL_RECYCLE: int = get_env_int("CELERY_DB_POOL_RECYCLE", "3600")

    def _credentials_from_secret(self, force_refresh: bool = False) -> dict:
        from pi.utils.aws_secrets import get_secret

        region = os.getenv("AWS_REGION", "us-east-1")
        secret = get_secret(self.RDS_SECRET_ARN, region, force_refresh=force_refresh)
        return {
            "host": secret.get(os.getenv("RDS_DB_HOST_KEY"), self.HOST or ""),
            "port": secret.get(os.getenv("RDS_DB_PORT_KEY"), self.PORT or 5432),
            "user": secret.get(os.getenv("RDS_DB_USERNAME_KEY"), self.USER or ""),
            "password": secret.get(os.getenv("RDS_DB_PASSWORD_KEY"), self.PASSWORD or ""),
            "name": secret.get(os.getenv("RDS_DB_NAME_KEY"), self.DB or ""),
        }

    def connection_url(self) -> str:
        if self.URL:
            return self.URL
        has_aws_creds = bool(os.getenv("AWS_ROLE_ARN", "") or os.getenv("AWS_CONTAINER_CREDENTIALS_FULL_URI", ""))
        if self.RDS_SECRET_ARN and has_aws_creds:
            from urllib.parse import quote

            c = self._credentials_from_secret()
            return f"postgresql://{quote(str(c['user']))}:{quote(str(c['password']))}@{c['host']}:{c['port']}/{c['name']}"
        from urllib.parse import quote

        user = quote(str(self.USER or ""), safe="")
        password = quote(str(self.PASSWORD or ""), safe="")
        return f"postgresql://{user}:{password}@{self.HOST}:{self.PORT}/{self.DB}"

    def async_connection_url(self) -> str:
        if self.URL:
            if "asyncpg" not in self.URL:
                return self.URL.replace("postgresql", "postgresql+asyncpg")
            return self.URL
        has_aws_creds = bool(os.getenv("AWS_ROLE_ARN", "") or os.getenv("AWS_CONTAINER_CREDENTIALS_FULL_URI", ""))
        if self.RDS_SECRET_ARN and has_aws_creds:
            from urllib.parse import quote

            c = self._credentials_from_secret()
            return f"postgresql+asyncpg://{quote(str(c['user']))}:{quote(str(c['password']))}@{c['host']}:{c['port']}/{c['name']}"
        from urllib.parse import quote

        user = quote(str(self.USER or ""), safe="")
        password = quote(str(self.PASSWORD or ""), safe="")
        return f"postgresql+asyncpg://{user}:{password}@{self.HOST}:{self.PORT}/{self.DB}"


@dataclass
class Celery:
    """Configuration for Celery background tasks."""

    DEFAULT_QUEUE: str = "plane_pi_queue"
    DEFAULT_EXCHANGE: str = "plane_pi_exchange"
    DEFAULT_ROUTING_KEY: str = "plane_pi"

    # Using RabbitMQ for message brokering only (no result backend)
    # Tasks run asynchronously but progress is tracked via logs only
    BROKER_URL: str = os.getenv("CELERY_BROKER_URL", "") or os.getenv("AMQP_URL", "") or "pyamqp://guest@localhost:5672//"
    RESULT_BACKEND: str | None = None

    def __post_init__(self) -> None:
        def _parse_host_port_vhost(raw: str) -> tuple[str | None, int | None, str | None]:
            """
            Parse `host:port[/vhost]` (no scheme) into (host, port, vhost).
            Returns (None, None, None) if `raw` doesn't match this shape.
            """
            if "://" in raw:
                return None, None, None
            if "@" in raw:
                return None, None, None
            if raw.strip() != raw or not raw:
                return None, None, None
            host_port, _, vhost_part = raw.partition("/")
            host_port = host_port.strip()
            if not host_port:
                return None, None, None
            host: str | None = None
            port: int | None = None
            if ":" in host_port:
                h, p = host_port.rsplit(":", 1)
                if h and p.isdigit():
                    host = h
                    port = int(p)
            else:
                host = host_port
            vhost: str | None = None
            if vhost_part:
                vhost = "/" + vhost_part
            return host, port, vhost

        def _default_port_for_scheme(scheme: str) -> int:
            # Align to common RabbitMQ defaults; for AmazonMQ users typically want amqps/5671.
            if scheme == "amqps":
                return 5671
            return 5672

        broker_env = os.getenv("CELERY_BROKER_URL") or os.getenv("AMQP_URL")
        secret_arn = os.getenv("AMAZONMQ_SECRET_ARN", "")
        has_aws_creds = bool(os.getenv("AWS_ROLE_ARN", "") or os.getenv("AWS_CONTAINER_CREDENTIALS_FULL_URI", ""))

        # If no broker env var is set, keep existing behavior: fall back to secret-only mode.
        if not broker_env:
            if not (secret_arn and has_aws_creds):
                return
            from urllib.parse import quote

            from pi.utils.aws_secrets import get_secret

            region = os.getenv("AWS_REGION", "us-east-1")
            secret = get_secret(secret_arn, region)
            secret_user = quote(str(secret.get(os.getenv("RABBITMQ_USER_KEY"), "")), safe="")
            secret_password = quote(str(secret.get(os.getenv("RABBITMQ_PASSWORD_KEY"), "")), safe="")
            secret_host = secret.get(os.getenv("RABBITMQ_HOST_KEY"), "")
            secret_port = secret.get(os.getenv("RABBITMQ_PORT_KEY"), 5671)
            secret_vhost = quote(str(secret.get(os.getenv("RABBITMQ_VHOST_KEY"), "/")), safe="")
            self.BROKER_URL = f"amqps://{secret_user}:{secret_password}@{secret_host}:{secret_port}/{secret_vhost}"
            return

        # If broker is provided but missing credentials (e.g. `host:5671`), inject creds from secret.
        if not (secret_arn and has_aws_creds):
            return

        from urllib.parse import quote
        from urllib.parse import urlparse

        from pi.utils.aws_secrets import get_secret

        parsed = urlparse(broker_env) if "://" in broker_env else None

        # If broker env is a full URL and already includes creds, keep as-is.
        if parsed and parsed.scheme and parsed.hostname and parsed.username and parsed.password:
            return

        # Support `host:port[/vhost]` by treating as `amqps://` (defaulting to 5671).
        host_from_raw, port_from_raw, vhost_from_raw = _parse_host_port_vhost(broker_env)
        if parsed is None and host_from_raw is None:
            return

        region = os.getenv("AWS_REGION", "us-east-1")
        secret = get_secret(secret_arn, region)
        secret_user = str(secret.get(os.getenv("RABBITMQ_USER_KEY"), ""))
        secret_password = str(secret.get(os.getenv("RABBITMQ_PASSWORD_KEY"), ""))
        if not (secret_user and secret_password):
            return

        scheme = "amqps"
        if parsed and parsed.scheme:
            scheme = parsed.scheme

        host = host_from_raw
        port = port_from_raw
        vhost: str | None = vhost_from_raw

        if parsed is not None:
            host = parsed.hostname or host
            port = parsed.port or port
            if parsed.path:
                # Normalize common cases: "", "/", "//" all mean root vhost "/"
                if parsed.path in ("", "/", "//"):
                    vhost = "/"
                else:
                    vhost = "/" + parsed.path.lstrip("/")

        host = (host or str(secret.get(os.getenv("RABBITMQ_HOST_KEY"), ""))) or ""
        port = int(port or secret.get(os.getenv("RABBITMQ_PORT_KEY"), _default_port_for_scheme(scheme)))
        vhost = vhost or str(secret.get(os.getenv("RABBITMQ_VHOST_KEY"), "/")) or "/"

        user = quote(secret_user, safe="")
        password = quote(secret_password, safe="")
        vhost_q = quote(vhost, safe="")
        self.BROKER_URL = f"{scheme}://{user}:{password}@{host}:{port}/{vhost_q}"

    TASK_SERIALIZER: str = "json"
    RESULT_SERIALIZER: str = "json"
    ACCEPT_CONTENT: list = field(default_factory=lambda: ["json"])
    TIMEZONE: str = "UTC"
    ENABLE_UTC: bool = True

    # Vector sync specific settings
    VECTOR_SYNC_ENABLED: bool = get_env_bool("CELERY_VECTOR_SYNC_ENABLED", "1")
    VECTOR_SYNC_INTERVAL: int = get_env_int("CELERY_VECTOR_SYNC_INTERVAL", "30")  # seconds
    VECTOR_SYNC_MAX_RETRIES: int = get_env_int("CELERY_VECTOR_SYNC_MAX_RETRIES", "3")
    VECTOR_SYNC_RETRY_DELAY: int = get_env_int("CELERY_VECTOR_SYNC_RETRY_DELAY", "30")  # seconds
    DOCS_VECTORIZATION_ENABLED: bool = get_env_bool("CELERY_DOCS_SYNC_ENABLED", "1")
    DOCS_VECTORIZATION_INTERVAL: int = get_env_int("CELERY_DOCS_SYNC_INTERVAL", "86400")  # 24 hours

    # Workspace plan sync settings (Pro/Business management)
    WORKSPACE_PLAN_SYNC_ENABLED: bool = get_env_bool("CELERY_WORKSPACE_PLAN_SYNC_ENABLED", "1")
    WORKSPACE_PLAN_SYNC_INTERVAL: int = get_env_int("CELERY_WORKSPACE_PLAN_SYNC_INTERVAL", "86400")  # 24 hours
    # Maximum concurrent workspace sync jobs
    MAX_CONCURRENT_VECTORIZATION_JOBS: int = 2
    # Chat search sync settings
    PI_MESSAGES_INDEX_SYNC_ENABLED: bool = get_env_bool("CELERY_PI_MESSAGES_INDEX_SYNC_ENABLED", "0")


@dataclass
class Settings:
    """Main configuration class for the Plane AI project."""

    PROJECT_NAME: str = "Plane AI"
    PROJECT_VERSION: str = "1.0.3"
    DEBUG: bool = get_env_bool("DEBUG")

    cors_origins_raw: str = os.getenv("CORS_ALLOWED_ORIGINS", "")
    CORS_ALLOWED_ORIGINS = [origin.strip() for origin in cors_origins_raw.split(",") if origin.strip()]

    # Sentry Configuration
    SENTRY_DSN: str | None = os.getenv("SENTRY_DSN")
    SENTRY_ENVIRONMENT: str = os.getenv("SENTRY_ENVIRONMENT", "development")

    # AWS Configuration for S3 attachments
    AWS_S3_BUCKET: str = os.getenv("AWS_S3_BUCKET", "") or os.getenv("AWS_S3_BUCKET_NAME", "")
    AWS_S3_REGION: str = os.getenv("AWS_S3_REGION", "") or os.getenv("AWS_REGION", "")
    AWS_ACCESS_KEY_ID: str = os.getenv("AWS_ACCESS_KEY_ID", "")
    AWS_SECRET_ACCESS_KEY: str = os.getenv("AWS_SECRET_ACCESS_KEY", "")
    # If AWS_S3_ENDPOINT_URL is set, use it (for MinIO or S3-compatible storage)
    # If empty/unset, boto3 will use default AWS S3 endpoints
    AWS_S3_ENDPOINT_URL: str | None = os.getenv("AWS_S3_ENDPOINT_URL") or None
    # Use MinIO mode (generates public URLs using request host instead of internal endpoint)
    # When True, presigned URLs use the request's public hostname instead of AWS_S3_ENDPOINT_URL
    USE_MINIO: bool = get_env_bool("USE_MINIO", "0")
    FILE_SIZE_LIMIT: int = 10485760  # 10MB
    AWS_S3_ENV: str = os.getenv("AWS_S3_ENV", "")

    # AWS Bedrock Configuration (for embeddings) - separate credentials
    BR_AWS_ACCESS_KEY_ID: str = os.getenv("BR_AWS_ACCESS_KEY_ID") or os.getenv("AWS_ACCESS_KEY_ID") or ""
    BR_AWS_SECRET_ACCESS_KEY: str = os.getenv("BR_AWS_SECRET_ACCESS_KEY") or os.getenv("AWS_SECRET_ACCESS_KEY") or ""
    BR_AWS_SESSION_TOKEN: str | None = os.getenv("BR_AWS_SESSION_TOKEN")
    BR_AWS_REGION: str = os.getenv("BR_AWS_REGION", "us-east-1")

    DD_ENABLED: bool = get_env_bool("DD_ENABLED", "0")
    DD_ENV: str = os.getenv("DD_ENV", "dev")
    DD_SERVICE: str = os.getenv("DD_SERVICE", "plane-pi-api")
    DD_AGENT_HOST: str = os.getenv("DD_AGENT_HOST", "")
    DD_TRACE_SAMPLE_RATE: float = float(os.getenv("DD_TRACE_SAMPLE_RATE", "0.0") or "0.0")

    # Feature Flag Server Configuration
    FEATURE_FLAG_SERVER_BASE_URL: str = os.getenv("FEATURE_FLAG_SERVER_BASE_URL", "http://localhost:8000")
    FEATURE_FLAG_SERVER_AUTH_TOKEN: str = os.getenv("FEATURE_FLAG_SERVER_AUTH_TOKEN", "")

    FOLLOWER_POSTGRES_URI: str = os.getenv("FOLLOWER_POSTGRES_URI", "")
    FOLLOWER_RDS_SECRET_ARN: str = os.getenv("FOLLOWER_RDS_SECRET_ARN", "")

    MCP_TOOL_EXECUTION_TIMEOUT: int = get_env_int("MCP_TOOL_EXECUTION_TIMEOUT", "30")
    MCP_CONNECTOR_DISCOVERY_TIMEOUT: int = get_env_int("MCP_CONNECTOR_DISCOVERY_TIMEOUT", "15")

    def follower_connection_url(self) -> str:
        """Return the follower DB DSN, refreshing from Secrets Manager on TTL expiry."""
        if self.FOLLOWER_POSTGRES_URI:
            return self.FOLLOWER_POSTGRES_URI
        has_aws_creds = bool(os.getenv("AWS_ROLE_ARN", "") or os.getenv("AWS_CONTAINER_CREDENTIALS_FULL_URI", ""))
        if self.FOLLOWER_RDS_SECRET_ARN and has_aws_creds:
            from urllib.parse import quote

            from pi.utils.aws_secrets import get_secret

            region = os.getenv("AWS_REGION", "us-east-1")
            secret = get_secret(self.FOLLOWER_RDS_SECRET_ARN, region)
            user = quote(
                str(secret.get(os.getenv("FOLLOWER_RDS_DB_USERNAME_KEY"), "")),
                safe="",
            )
            password = quote(
                str(secret.get(os.getenv("FOLLOWER_RDS_DB_PASSWORD_KEY"), "")),
                safe="",
            )
            host = secret.get(os.getenv("FOLLOWER_RDS_DB_HOST_KEY"), "")
            port = secret.get(os.getenv("FOLLOWER_RDS_DB_PORT_KEY"), 5432)
            name = secret.get(os.getenv("FOLLOWER_RDS_DB_NAME_KEY"), "")
            return f"postgresql://{user}:{password}@{host}:{port}/{name}"
        return self.FOLLOWER_POSTGRES_URI

    # Tools in which Pi accesses follower-db or OpenSearch directly (bypassing API layer) should be listed here
    ACCESS_CONTROLLED_TOOL_NAMES: list[str] = field(
        default_factory=lambda: ["structured_db_tool", "vector_search_tool", "pages_search_tool", "fetch_cycle_details", "entity_search"]
    )

    chat = Chat()
    server = Server()
    plane_api = PlaneAPI()
    vector_db = VectorDB()
    llm_model = LLMModels()
    llm_config = LLMConfig()
    feature_flags = FeatureFlags()
    transcription = Transcription()
    database = Database()
    celery = Celery()

    # Class attribute for the configured logger
    _configured_logger: Optional[logging.Logger] = None
    _logger_configured: bool = False

    @classmethod
    def setup_logger(cls):
        handler = colorlog.StreamHandler()

        # Suppress APScheduler logs below error
        colorlog.getLogger("apscheduler").setLevel(colorlog.ERROR)
        colorlog.getLogger("apscheduler.scheduler").setLevel(colorlog.ERROR)
        colorlog.getLogger("apscheduler").propagate = False

        # Suppress OpenSearch HTTP request logs
        colorlog.getLogger("opensearch").setLevel(colorlog.ERROR)  # Hide HTTP requests
        colorlog.getLogger("opensearchpy").setLevel(colorlog.WARNING)
        colorlog.getLogger("opensearchpy").propagate = False

        # Suppress OpenAI client debug logs
        colorlog.getLogger("openai").setLevel(colorlog.WARNING)
        colorlog.getLogger("openai._base_client").setLevel(colorlog.WARNING)
        colorlog.getLogger("httpx").setLevel(colorlog.WARNING)
        colorlog.getLogger("httpcore").setLevel(colorlog.WARNING)

        # Suppress urllib3 HTTP request logs (used by requests library)
        colorlog.getLogger("urllib3").setLevel(colorlog.WARNING)
        colorlog.getLogger("urllib3.connectionpool").setLevel(colorlog.WARNING)

        # Suppress Anthropic client debug logs
        colorlog.getLogger("anthropic").setLevel(colorlog.WARNING)
        colorlog.getLogger("anthropic._base_client").setLevel(colorlog.WARNING)

        # Suppress MCP client debug logs
        colorlog.getLogger("mcp").setLevel(colorlog.WARNING)
        colorlog.getLogger("mcp.client").setLevel(colorlog.WARNING)
        colorlog.getLogger("mcp.client.streamable_http").setLevel(colorlog.WARNING)

        # Suppress watchfiles debug logs
        colorlog.getLogger("watchfiles").setLevel(colorlog.WARNING)
        colorlog.getLogger("watchfiles").propagate = False
        colorlog.getLogger("watchfiles.main").setLevel(colorlog.WARNING)
        colorlog.getLogger("watchfiles.main").propagate = False

        # Suppress AMQP debug logs
        colorlog.getLogger("amqp").setLevel(colorlog.WARNING)
        colorlog.getLogger("amqp").propagate = False

        # Suppress matplotlib debug logs (especially font_manager)
        colorlog.getLogger("matplotlib").setLevel(colorlog.WARNING)

        # Suppress markdown_it debug logs
        colorlog.getLogger("markdown_it").setLevel(colorlog.WARNING)

        # Suppress boto3/botocore debug logs
        colorlog.getLogger("boto3").setLevel(colorlog.INFO)
        colorlog.getLogger("botocore").setLevel(colorlog.INFO)
        colorlog.getLogger("botocore.hooks").setLevel(colorlog.INFO)
        colorlog.getLogger("botocore.loaders").setLevel(colorlog.INFO)
        colorlog.getLogger("botocore.configprovider").setLevel(colorlog.INFO)
        colorlog.getLogger("botocore.endpoint").setLevel(colorlog.INFO)
        colorlog.getLogger("botocore.client").setLevel(colorlog.INFO)
        colorlog.getLogger("botocore.utils").setLevel(colorlog.INFO)
        colorlog.getLogger("botocore.credentials").setLevel(colorlog.WARNING)
        colorlog.getLogger("botocore.tokens").setLevel(colorlog.WARNING)

        # Suppress langchain_aws noisy logs
        colorlog.getLogger("langchain_aws").setLevel(colorlog.WARNING)
        colorlog.getLogger("langchain_aws.utils").setLevel(colorlog.ERROR)
        colorlog.getLogger("langchain_aws.llms.bedrock").setLevel(colorlog.WARNING)
        colorlog.getLogger("langchain_aws.chat_models.bedrock").setLevel(colorlog.WARNING)

        # Suppress Datadog trace debug logs and errors (if agent not running)
        colorlog.getLogger("ddtrace").setLevel(colorlog.WARNING)
        colorlog.getLogger("ddtrace._monkey").setLevel(colorlog.WARNING)
        colorlog.getLogger("ddtrace.tracer").setLevel(colorlog.WARNING)
        colorlog.getLogger("ddtrace.writer").setLevel(colorlog.WARNING)
        colorlog.getLogger("ddtrace.internal").setLevel(colorlog.WARNING)
        colorlog.getLogger("ddtrace.internal.module").setLevel(colorlog.WARNING)
        colorlog.getLogger("ddtrace.internal.telemetry").setLevel(colorlog.WARNING)
        colorlog.getLogger("ddtrace.internal.telemetry.writer").setLevel(colorlog.WARNING)
        colorlog.getLogger("ddtrace.internal.runtime").setLevel(colorlog.WARNING)
        colorlog.getLogger("ddtrace.internal.runtime.container").setLevel(colorlog.WARNING)
        colorlog.getLogger("ddtrace.internal.writer").setLevel(colorlog.WARNING)
        colorlog.getLogger("ddtrace.internal.writer.writer").setLevel(colorlog.WARNING)
        colorlog.getLogger("ddtrace._trace.processor").setLevel(colorlog.WARNING)
        colorlog.getLogger("ddtrace._trace.sampler").setLevel(colorlog.WARNING)
        colorlog.getLogger("ddtrace.settings.endpoint_config").setLevel(colorlog.WARNING)
        colorlog.getLogger("ddtrace.vendor.dogstatsd").setLevel(colorlog.WARNING)
        colorlog.getLogger("datadog").setLevel(colorlog.WARNING)
        colorlog.getLogger("datadog.dogstatsd").setLevel(colorlog.WARNING)

        # Suppress Alembic migration verbose logs
        colorlog.getLogger("alembic").setLevel(colorlog.WARNING)
        colorlog.getLogger("alembic.runtime.migration").setLevel(colorlog.WARNING)

        # Conditional logging format based on DD_ENABLED (Datadog)
        # When Datadog is enabled (production), use JSON logging for structured logs
        # When Datadog is disabled (local dev), use colored logs for readability
        dd_enabled = get_env_bool("DD_ENABLED", "0")
        if dd_enabled:
            # Production: Use JSON formatter for structured logging (Datadog)
            from pythonjsonlogger.json import JsonFormatter

            colorlog.getLogger("ddtrace.internal.telemetry").setLevel(colorlog.INFO)
            colorlog.getLogger("ddtrace.internal.telemetry.writer").setLevel(colorlog.INFO)
            json_formatter = JsonFormatter(fmt="%(asctime)s %(name)s %(levelname)s %(message)s", datefmt="%Y-%m-%d %H:%M:%S")
            handler.setFormatter(json_formatter)
        else:
            # Local development: Use colorlog for readable output
            color_formatter = colorlog.ColoredFormatter(
                "%(log_color)s%(asctime)s %(name)-20s %(levelname)-8s%(reset)s %(message)s",
                datefmt="%Y-%m-%d %H:%M:%S",
                log_colors={
                    "DEBUG": "cyan",
                    "INFO": "green",
                    "WARNING": "yellow",
                    "ERROR": "red",
                    "CRITICAL": "red,bg_white",
                },
            )
            handler.setFormatter(color_formatter)

        # Get the root logger and configure it
        root_logger = colorlog.getLogger()

        # Determine log level from LOG_LEVEL env var (standard Python level names).
        # Falls back to DEBUG boolean for backward compatibility.
        log_level_name = os.getenv("LOG_LEVEL", "").strip().upper()
        if log_level_name and hasattr(logging, log_level_name):
            log_level = getattr(logging, log_level_name)
        else:
            # Backward-compatible fallback: DEBUG env var → DEBUG level, otherwise INFO
            debug_enabled = get_env_bool("DEBUG")
            log_level = logging.DEBUG if debug_enabled else logging.INFO

        root_logger.setLevel(log_level)

        root_logger.addHandler(handler)
        root_logger.propagate = True

        # Suppress noisy Celery internal loggers
        colorlog.getLogger("celery.utils.functional").setLevel(colorlog.WARNING)
        colorlog.getLogger("celery.worker.strategy").setLevel(colorlog.INFO)
        colorlog.getLogger("celery.app.trace").setLevel(colorlog.INFO)

        # Store the configured logger for consistent access
        cls._configured_logger = root_logger

        # Log the configuration for confirmation (only once)
        if not hasattr(cls, "_logger_configured"):
            root_logger.info(f"Logging configured - Level: {logging.getLevelName(log_level)}")
            cls._logger_configured = True

        return root_logger

    @classmethod
    def get_logger(cls, name):
        # Use the configured root logger if no name is provided
        if not name:
            return getattr(cls, "_configured_logger", colorlog.getLogger())
        return colorlog.getLogger(name)


settings = Settings()
settings.setup_logger()
logger = settings.get_logger("")
