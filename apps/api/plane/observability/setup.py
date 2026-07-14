# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""OpenTelemetry bootstrap for the Plane API.

Single entry point: configure_otel(). Idempotent. No-op unless OTEL_ENABLED
is truthy and OTEL_EXPORTER_OTLP_ENDPOINT is set.
"""

import logging
import os

from opentelemetry import metrics, trace
from opentelemetry.instrumentation.celery import CeleryInstrumentor
from opentelemetry.instrumentation.django import DjangoInstrumentor
from opentelemetry.instrumentation.httpx import HTTPXClientInstrumentor
from opentelemetry.instrumentation.psycopg import PsycopgInstrumentor
from opentelemetry.instrumentation.redis import RedisInstrumentor
from opentelemetry.instrumentation.requests import RequestsInstrumentor
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.sdk.metrics.export import PeriodicExportingMetricReader
from opentelemetry.sdk.resources import Resource
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor

from plane.observability.logging import is_otel_enabled

logger = logging.getLogger(__name__)

_CONFIGURED = False

# Kept at module scope so flush_otel() can force-flush them on worker shutdown
# (prefork children exit via os._exit and skip atexit).
_TRACER_PROVIDER: "TracerProvider | None" = None
_METER_PROVIDER: "MeterProvider | None" = None

_NOISY_OTEL_LOGGERS = (
    "opentelemetry",
    "opentelemetry.exporter.otlp",
    "opentelemetry.exporter.otlp.proto.grpc",
    "opentelemetry.exporter.otlp.proto.http",
    "opentelemetry.instrumentation",
    "opentelemetry.sdk.trace.export",
)

_HTTP_PROTOCOLS = ("http/protobuf", "http")


def _has_endpoint() -> bool:
    return bool(os.environ.get("OTEL_EXPORTER_OTLP_ENDPOINT", "").strip())


def _protocol() -> str:
    return os.environ.get("OTEL_EXPORTER_OTLP_PROTOCOL", "grpc").lower()


def _apply_defaults() -> None:
    """Set defaults for standard OTEL env vars. Operator overrides win."""
    os.environ.setdefault("OTEL_SERVICE_NAME", "plane-api")
    os.environ.setdefault("OTEL_TRACES_SAMPLER", "parentbased_traceidratio")
    os.environ.setdefault("OTEL_TRACES_SAMPLER_ARG", "0.1")
    os.environ.setdefault("OTEL_EXPORTER_OTLP_PROTOCOL", "grpc")


def _build_resource() -> Resource:
    """Build the OTEL Resource.

    Resource.create() reads OTEL_SERVICE_NAME and OTEL_RESOURCE_ATTRIBUTES from
    the environment natively. We additionally set deployment.environment.name
    from a dedicated OTEL_ENVIRONMENT (or SENTRY_ENVIRONMENT) var. Note the
    current semconv key is `deployment.environment.name` (not the legacy
    `deployment.environment`).
    """
    attributes: dict[str, str] = {}
    environment = os.environ.get("OTEL_ENVIRONMENT") or os.environ.get("SENTRY_ENVIRONMENT") or ""
    if environment:
        attributes["deployment.environment.name"] = environment
    return Resource.create(attributes)


def _create_span_exporter():
    """Return the OTLP span exporter that matches OTEL_EXPORTER_OTLP_PROTOCOL."""
    if _protocol() in _HTTP_PROTOCOLS:
        from opentelemetry.exporter.otlp.proto.http.trace_exporter import (
            OTLPSpanExporter as HttpSpanExporter,
        )

        return HttpSpanExporter()
    from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import (
        OTLPSpanExporter as GrpcSpanExporter,
    )

    return GrpcSpanExporter()


def _create_metric_exporter():
    """Return the OTLP metric exporter that matches OTEL_EXPORTER_OTLP_PROTOCOL."""
    if _protocol() in _HTTP_PROTOCOLS:
        from opentelemetry.exporter.otlp.proto.http.metric_exporter import (
            OTLPMetricExporter as HttpMetricExporter,
        )

        return HttpMetricExporter()
    from opentelemetry.exporter.otlp.proto.grpc.metric_exporter import (
        OTLPMetricExporter as GrpcMetricExporter,
    )

    return GrpcMetricExporter()


def _setup_tracing(resource: Resource) -> None:
    global _TRACER_PROVIDER
    provider = TracerProvider(resource=resource)
    provider.add_span_processor(BatchSpanProcessor(_create_span_exporter()))
    trace.set_tracer_provider(provider)
    _TRACER_PROVIDER = provider


def _setup_metrics(resource: Resource) -> None:
    global _METER_PROVIDER
    reader = PeriodicExportingMetricReader(_create_metric_exporter())
    provider = MeterProvider(resource=resource, metric_readers=[reader])
    metrics.set_meter_provider(provider)
    _METER_PROVIDER = provider


def _instrument_libraries() -> None:
    """Patch Django + Celery + downstream client libraries.

    DjangoInstrumentor emits HTTP server spans + http.server.* metrics.
    CeleryInstrumentor emits a span per task with celery.action, task_name,
    task_id, state, and propagates traceparent across the queue so a
    request that enqueues a task is linked to that task's execution span.
    The others add child spans so latency can be decomposed (SQL query,
    Redis op, outbound HTTP).

    Each instrumentor is isolated: a single failure (version mismatch, missing
    optional dependency) is logged and skipped so it neither blocks the other
    instrumentors nor takes down application startup.
    """
    instrumentors = (
        (DjangoInstrumentor, {}),
        (CeleryInstrumentor, {}),
        (PsycopgInstrumentor, {"enable_commenter": False}),
        (RedisInstrumentor, {}),
        (RequestsInstrumentor, {}),
        (HTTPXClientInstrumentor, {}),
    )
    for instrumentor_cls, kwargs in instrumentors:
        try:
            instrumentor_cls().instrument(**kwargs)
        except Exception as exc:
            logger.warning("Failed to instrument %s: %s", instrumentor_cls.__name__, exc)


def _quiet_otel_loggers() -> None:
    """Pin OTEL SDK / exporter loggers to WARNING.

    Without this, a misconfigured or unreachable collector floods stdout
    with per-export INFO/ERROR messages on every batch flush.
    """
    for name in _NOISY_OTEL_LOGGERS:
        logging.getLogger(name).setLevel(logging.WARNING)


def configure_otel() -> None:
    """Configure OpenTelemetry tracing + metrics.

    No-op unless OTEL_ENABLED is truthy and OTEL_EXPORTER_OTLP_ENDPOINT is set.
    Idempotent — safe to call from wsgi.py, asgi.py, manage.py, and celery.py.

    Log correlation is wired separately via Django's LOGGING dict (see
    plane/settings/local.py and production.py) and, for Celery, via the
    after_setup_logger handlers in plane/celery.py.
    """
    global _CONFIGURED
    if _CONFIGURED:
        return
    if not is_otel_enabled():
        return
    if not _has_endpoint():
        logger.warning("OTEL_ENABLED=1 but OTEL_EXPORTER_OTLP_ENDPOINT is not set; OpenTelemetry bootstrap skipped")
        return

    _apply_defaults()
    resource = _build_resource()
    _setup_tracing(resource)
    _setup_metrics(resource)
    _instrument_libraries()
    _quiet_otel_loggers()

    _CONFIGURED = True
    logger.info(
        "OpenTelemetry configured: service=%s, endpoint=%s, protocol=%s, sampler=%s(%s)",
        os.environ.get("OTEL_SERVICE_NAME"),
        os.environ.get("OTEL_EXPORTER_OTLP_ENDPOINT"),
        os.environ.get("OTEL_EXPORTER_OTLP_PROTOCOL"),
        os.environ.get("OTEL_TRACES_SAMPLER"),
        os.environ.get("OTEL_TRACES_SAMPLER_ARG"),
    )


def flush_otel(timeout_millis: int = 3000) -> None:
    """Best-effort bounded flush of buffered spans + metrics.

    Celery prefork children exit via os._exit and never run atexit hooks, so the
    worker_process_shutdown signal calls this to keep the tail of each child's
    spans/metrics from being dropped on --max-tasks-per-child recycling and warm
    shutdown. Never raises and is bounded by the timeout, so it cannot stall
    child replacement.
    """
    if _TRACER_PROVIDER is not None:
        try:
            _TRACER_PROVIDER.force_flush(timeout_millis=timeout_millis)
        except Exception as exc:
            logger.warning("OTel trace flush failed: %s", exc)
    if _METER_PROVIDER is not None:
        try:
            _METER_PROVIDER.force_flush(timeout_millis=timeout_millis)
        except Exception as exc:
            logger.warning("OTel metric flush failed: %s", exc)
