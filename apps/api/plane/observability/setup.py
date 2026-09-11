# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""OpenTelemetry bootstrap for the Plane API.

Single entry point: configure_otel(). Idempotent. No-op unless OTel is active
(OTEL_ENABLED truthy *and* an OTLP endpoint configured — see
plane.observability.logging.is_otel_active).

SDK and instrumentor imports are deliberately deferred into the functions that
need them. This module is imported by manage.py, wsgi.py, asgi.py and celery.py
in *every* process, including the OTEL-disabled default; a module-scope
``import opentelemetry.instrumentation.httpx`` would make a missing optional
dependency (httpx is only declared under that package's ``instruments`` extra)
crash every entrypoint even with OTEL_ENABLED=0.
"""

import atexit
import logging
import os
import sys
import uuid
from importlib import import_module

from opentelemetry import metrics, trace

from plane.observability.logging import has_otel_endpoint, is_otel_enabled

logger = logging.getLogger(__name__)

_CONFIGURED = False

# Providers are created per *process*: gunicorn forks workers and the Celery
# prefork pool forks task children, and each needs its own exporter channel.
_PROVIDERS_READY = False

# Kept at module scope so flush_otel() can force-flush them on worker shutdown
# (prefork children exit via os._exit and skip atexit).
_TRACER_PROVIDER = None
_METER_PROVIDER = None

_NOISY_OTEL_LOGGERS = (
    "opentelemetry",
    "opentelemetry.exporter.otlp",
    "opentelemetry.exporter.otlp.proto.grpc",
    "opentelemetry.exporter.otlp.proto.http",
    "opentelemetry.instrumentation",
    "opentelemetry.sdk.trace.export",
)

_HTTP_PROTOCOLS = ("http/protobuf", "http")

# (module path, class name, instrument() kwargs). Resolved lazily so an import
# failure is isolated to the one instrumentor that failed.
_INSTRUMENTORS = (
    ("opentelemetry.instrumentation.django", "DjangoInstrumentor", {}),
    ("opentelemetry.instrumentation.celery", "CeleryInstrumentor", {}),
    ("opentelemetry.instrumentation.psycopg", "PsycopgInstrumentor", {"enable_commenter": False}),
    ("opentelemetry.instrumentation.redis", "RedisInstrumentor", {}),
    ("opentelemetry.instrumentation.requests", "RequestsInstrumentor", {}),
    ("opentelemetry.instrumentation.httpx", "HTTPXClientInstrumentor", {}),
)


def _protocol() -> str:
    """Return the normalized OTEL_EXPORTER_OTLP_PROTOCOL value.

    Stripped as well as lowercased: env-file values are taken literally, so a
    stray trailing space would otherwise fail the _HTTP_PROTOCOLS membership
    test and silently pick the gRPC exporter for an HTTP endpoint.
    """
    return os.environ.get("OTEL_EXPORTER_OTLP_PROTOCOL", "grpc").strip().lower()


def _setenv_default(key: str, value: str) -> None:
    """os.environ.setdefault that also replaces a blank value.

    Compose interpolation like ``${OTEL_TRACES_SAMPLER:-}`` injects an *empty
    string* rather than leaving the var unset, which makes plain setdefault a
    no-op and hands the SDK a value it rejects — silently falling back to 100%
    sampling, or raising on ``float("")`` for the sampler arg.
    """
    if not os.environ.get(key, "").strip():
        os.environ[key] = value


def _apply_defaults() -> None:
    """Set defaults for standard OTEL env vars. Operator overrides win."""
    _setenv_default("OTEL_SERVICE_NAME", "plane-api")
    _setenv_default("OTEL_TRACES_SAMPLER", "parentbased_traceidratio")
    _setenv_default("OTEL_TRACES_SAMPLER_ARG", "0.1")
    _setenv_default("OTEL_EXPORTER_OTLP_PROTOCOL", "grpc")


def _build_resource():
    """Build the OTEL Resource.

    Resource.create() reads OTEL_SERVICE_NAME and OTEL_RESOURCE_ATTRIBUTES from
    the environment natively. We additionally set deployment.environment.name
    from a dedicated OTEL_ENVIRONMENT (or SENTRY_ENVIRONMENT) var. Note the
    current semconv key is `deployment.environment.name` (not the legacy
    `deployment.environment`).

    service.instance.id is stamped per process: gunicorn runs N workers without
    --preload and the Celery prefork pool forks children, so without it every
    process would export its own cumulative http.server.* streams under one
    byte-identical resource identity. That breaks OTLP's single-writer rule and
    makes the resulting counters and histograms unusable in most backends.
    """
    from opentelemetry.sdk.resources import Resource

    attributes: dict[str, str] = {"service.instance.id": str(uuid.uuid4())}
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


def _setup_tracing(resource) -> None:
    global _TRACER_PROVIDER
    from opentelemetry.sdk.trace import TracerProvider
    from opentelemetry.sdk.trace.export import BatchSpanProcessor

    # shutdown_on_exit=False: the SDK's atexit hook joins the batch worker
    # thread *unbounded*, and the OTLP exporter retries an unreachable collector
    # with backoff summing to ~1 minute per batch. That would stall every
    # short-lived manage.py command at boot and every recycled gunicorn worker.
    # _init_providers() registers the bounded flush_otel() instead.
    provider = TracerProvider(resource=resource, shutdown_on_exit=False)
    provider.add_span_processor(BatchSpanProcessor(_create_span_exporter()))
    trace.set_tracer_provider(provider)
    _TRACER_PROVIDER = provider


def _setup_metrics(resource) -> None:
    global _METER_PROVIDER
    from opentelemetry.sdk.metrics import MeterProvider
    from opentelemetry.sdk.metrics.export import PeriodicExportingMetricReader

    reader = PeriodicExportingMetricReader(_create_metric_exporter())
    # shutdown_on_exit=False for the same reason as the tracer provider above.
    provider = MeterProvider(resource=resource, metric_readers=[reader], shutdown_on_exit=False)
    metrics.set_meter_provider(provider)
    _METER_PROVIDER = provider


def _init_providers() -> None:
    """Create the exporters + providers for the *current* process. Idempotent."""
    global _PROVIDERS_READY
    if _PROVIDERS_READY:
        return
    resource = _build_resource()
    _setup_tracing(resource)
    _setup_metrics(resource)
    atexit.register(flush_otel)
    _PROVIDERS_READY = True


def init_process_providers() -> None:
    """Create this process's providers after a fork.

    Called from Celery's worker_process_init when configure_otel() was asked to
    defer provider creation (see configure_otel's defer_providers). No-op when
    OTel is not configured or the providers already exist.
    """
    if not _CONFIGURED:
        return
    _init_providers()


def _instrument_libraries() -> None:
    """Patch Django + Celery + downstream client libraries.

    DjangoInstrumentor emits HTTP server spans + http.server.* metrics.
    CeleryInstrumentor emits a span per task with celery.action, task_name,
    task_id, state, and propagates traceparent across the queue so a
    request that enqueues a task is linked to that task's execution span.
    The others add child spans so latency can be decomposed (SQL query,
    Redis op, outbound HTTP).

    Each instrumentor is isolated — *including its import* — so a single failure
    (version mismatch, missing optional dependency) is logged and skipped
    without blocking the other instrumentors or application startup.
    """
    for module_path, class_name, kwargs in _INSTRUMENTORS:
        try:
            instrumentor_cls = getattr(import_module(module_path), class_name)
            instrumentor_cls().instrument(**kwargs)
        except Exception as exc:
            logger.warning("Failed to instrument %s: %s", class_name, exc)


def _quiet_otel_loggers() -> None:
    """Pin OTEL SDK / exporter loggers to WARNING.

    Without this, a misconfigured or unreachable collector floods stdout
    with per-export INFO/ERROR messages on every batch flush.
    """
    for name in _NOISY_OTEL_LOGGERS:
        logging.getLogger(name).setLevel(logging.WARNING)


def _log_boot_banner(message: str, *args) -> None:
    """Emit a one-off INFO line before Django has configured logging.

    configure_otel() runs before dictConfig in every entrypoint, so the root
    logger has no handlers and logging.lastResort only emits WARNING and above —
    a plain logger.info() here would be dropped. Attach a temporary stderr
    handler for this single record so the boot confirmation the README tells
    operators to look for actually appears.
    """
    handler = logging.StreamHandler(sys.stderr)
    handler.setFormatter(logging.Formatter("%(levelname)s %(asctime)s %(name)s %(message)s"))
    previous_level = logger.level
    logger.addHandler(handler)
    logger.setLevel(logging.INFO)
    try:
        logger.info(message, *args)
    finally:
        logger.removeHandler(handler)
        logger.setLevel(previous_level)
        handler.close()


def configure_otel(*, defer_providers: bool = False) -> None:
    """Configure OpenTelemetry tracing + metrics.

    No-op unless OTEL_ENABLED is truthy and an OTLP endpoint is configured.
    Idempotent — safe to call from wsgi.py, asgi.py, manage.py, and celery.py.

    Pass defer_providers=True when this process will fork workers that do the
    actual exporting (the Celery prefork pool): instrumentation and env defaults
    are applied here, but the exporters — whose gRPC channel is not fork-safe —
    are left to init_process_providers() in each child.

    Log correlation is wired separately via Django's LOGGING dict (see
    plane.observability.logging.extend_logging_config) and, for Celery, via the
    after_setup_logger handlers in plane/celery.py.
    """
    global _CONFIGURED
    if _CONFIGURED:
        return
    if not is_otel_enabled():
        return
    if not has_otel_endpoint():
        logger.warning(
            "OTEL_ENABLED=1 but OTEL_EXPORTER_OTLP_ENDPOINT is not set "
            "(nor OTEL_EXPORTER_OTLP_TRACES_ENDPOINT / OTEL_EXPORTER_OTLP_METRICS_ENDPOINT); "
            "OpenTelemetry bootstrap skipped"
        )
        return

    _apply_defaults()
    if not defer_providers:
        _init_providers()
    _instrument_libraries()
    _quiet_otel_loggers()

    _CONFIGURED = True
    _log_boot_banner(
        "OpenTelemetry configured: service=%s, endpoint=%s, protocol=%s, sampler=%s(%s), providers=%s",
        os.environ.get("OTEL_SERVICE_NAME"),
        os.environ.get("OTEL_EXPORTER_OTLP_ENDPOINT"),
        os.environ.get("OTEL_EXPORTER_OTLP_PROTOCOL"),
        os.environ.get("OTEL_TRACES_SAMPLER"),
        os.environ.get("OTEL_TRACES_SAMPLER_ARG"),
        "deferred to worker children" if defer_providers else "ready",
    )


def flush_otel(timeout_millis: int = 3000) -> None:
    """Best-effort bounded flush of buffered spans + metrics.

    Used in two places, both of which must not stall:

    - Celery prefork children exit via os._exit and never run atexit hooks, so
      the worker_process_shutdown signal calls this to keep the tail of each
      child's spans/metrics from being dropped on --max-tasks-per-child
      recycling and warm shutdown.
    - Registered as this process's atexit hook in place of the SDK's own
      unbounded provider shutdown (see _setup_tracing).

    Never raises and is bounded by the timeout, so it cannot stall interpreter
    exit or child replacement even when the collector is unreachable.
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
