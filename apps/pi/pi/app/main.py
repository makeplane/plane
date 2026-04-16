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

import logging
from contextlib import asynccontextmanager

import sentry_sdk
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from sentry_sdk.integrations.fastapi import FastApiIntegration
from sentry_sdk.integrations.logging import LoggingIntegration

from pi import logger
from pi import settings
from pi.app.api.v1.router import plane_pi_router
from pi.app.api.v2.router import plane_v2_router
from pi.app.middleware.feature_flag import FeatureFlagMiddleware

# LLM fixtures sync moved to explicit startup scripts
from pi.core.db.plane_pi.lifecycle import close_async_db
from pi.core.db.plane_pi.lifecycle import init_async_db

log = logger.getChild("FastAPI")
cors_origins = settings.CORS_ALLOWED_ORIGINS


def before_send(event, hint):
    """
    Filter events before sending them to Sentry.
    """
    exception = hint.get("exc_info")

    # Only allow events with actual exceptions
    if exception is None:
        return None  # Drop all non-exception events

    return event  # Allow other events to pass through


def configure_sentry():
    """Configure Sentry error tracking if enabled"""
    if not settings.DEBUG and settings.SENTRY_DSN and settings.SENTRY_DSN.strip() and settings.SENTRY_DSN.startswith("https://"):
        try:
            sentry_sdk.init(
                dsn=settings.SENTRY_DSN,
                integrations=[
                    FastApiIntegration(),
                    LoggingIntegration(level=logging.WARNING, event_level=logging.ERROR),
                ],
                before_send=before_send,
                traces_sample_rate=1.0,
                send_default_pii=True,
                environment=settings.SENTRY_ENVIRONMENT,
            )
            log.info("Sentry SDK initialized successfully")
        except Exception as e:
            log.warning(f"Failed to initialize Sentry SDK: {e}. Continuing without Sentry.")


def configure_datadog():
    """Configure DataDog tracing if enabled"""
    from ddtrace import config
    from ddtrace import patch

    if not settings.DD_ENABLED:
        return

    config.logs_injection = True
    config.version = settings.PROJECT_VERSION
    config.service = settings.DD_SERVICE
    config.env = settings.DD_ENV

    patch(
        logging=True,
        requests=True,
        fastapi=True,
        openai=True,
        psycopg=True,
        langchain=True,
        elasticsearch=True,
        sqlalchemy=True,
        aiohttp=True,
    )


def create_app() -> FastAPI:
    """Create and configure the FastAPI application"""
    configure_datadog()
    configure_sentry()

    base_path = settings.plane_api.BASE_PATH or ""

    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.PROJECT_VERSION,
        lifespan=lifespan,
        docs_url=f"{base_path}/docs",
        redoc_url=f"{base_path}/redoc",
        openapi_url=f"{base_path}/openapi.json",
    )

    # Add routes
    app.include_router(plane_pi_router, prefix=f"{base_path}/api/v1")
    app.include_router(plane_v2_router, prefix=f"{base_path}/api/v2")

    # Add CORS middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Add feature flag middleware with endpoint configuration
    # Only protect get-answer endpoints for now
    endpoint_feature_map = {
        # Web endpoints
        "/api/v1/chat/get-answer/": settings.feature_flags.AI_CHAT,
        "/api/v1/chat/initialize-chat/": settings.feature_flags.AI_CHAT,
        "/api/v1/chat/queue-answer/": settings.feature_flags.AI_CHAT,
        # "/api/v1/transcription/transcribe": settings.feature_flags.AI_CONVERSE,
        # Mobile endpoints
        "/api/v1/mobile/chat/get-answer/": settings.feature_flags.AI_CHAT,
        # "/api/v1/mobile/transcription/transcribe": settings.feature_flags.AI_CONVERSE,
    }
    app.add_middleware(FeatureFlagMiddleware, endpoint_feature_map=endpoint_feature_map)

    base_root = f"{base_path}/" if base_path else "/"

    @app.get(base_root)
    async def root():
        return HTMLResponse("Welcome to Plane AI API")

    return app


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Manage startup and shutdown actions."""
    try:
        await init_async_db(app)
        # LLM sync is now handled explicitly in start-application command
        # Vector sync is now handled by Celery workers instead of background task
        log.info("FastAPI application startup complete - Vector sync handled externally")
        yield
    finally:
        await close_async_db(app)
        log.info("Application shutdown complete")


def run_server():
    """Run the uvicorn server with configured settings"""
    host = str(settings.server.FASTAPI_APP_HOST)
    port = int(settings.server.FASTAPI_APP_PORT)
    workers = int(settings.server.FASTAPI_APP_WORKERS)
    worker_timeout = int(settings.server.FASTAPI_APP_WORKER_TIMEOUT)

    # JSON formatter for production
    uvicorn_log_config = {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "json": {
                "()": "pythonjsonlogger.jsonlogger.JsonFormatter",
                "fmt": "%(asctime)s %(name)s %(levelname)s %(message)s",
                "datefmt": "%Y-%m-%d %H:%M:%S",
            },
        },
        "handlers": {
            "default": {
                "formatter": "json",
                "class": "logging.StreamHandler",
                "stream": "ext://sys.stdout",
            },
            "access": {
                "formatter": "json",
                "class": "logging.StreamHandler",
                "stream": "ext://sys.stdout",
            },
        },
        "loggers": {
            "uvicorn": {"handlers": ["default"], "level": "INFO", "propagate": False},
            "uvicorn.error": {"handlers": ["default"], "level": "INFO", "propagate": False},
            "uvicorn.access": {"handlers": ["access"], "level": "INFO", "propagate": False},
        },
    }

    uvicorn.run(
        "pi.app.main:app",
        host=host,
        port=port,
        workers=workers,
        reload=settings.DEBUG,
        log_config=uvicorn_log_config,
        timeout_worker_healthcheck=worker_timeout,
    )


# Initialize application
app = create_app()
