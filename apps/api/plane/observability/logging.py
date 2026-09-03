# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Trace-context log correlation for the API.

`TraceContextFilter` adds trace_id / span_id / trace_flags / service_name
attributes to every LogRecord. Empty values when no span is active.

The filter is wired in via Django's LOGGING dict (see
plane/settings/local.py and plane/settings/production.py) and attached to
every handler, so it works regardless of logger propagation settings.
configure_otel() does not install it at runtime — Django's dictConfig
would wipe a runtime-installed filter when settings are applied.

This module deliberately depends only on the OpenTelemetry *API* (no SDK, no
instrumentation packages) so the Django settings modules can import it cheaply
and so the env-gate predicates below have a single home.
"""

import logging
import os

from opentelemetry import trace

# Accepted OTEL_ENABLED tokens — the single source of truth shared by the
# bootstrap gate (setup.configure_otel), the Celery worker-log gate, and the
# Django LOGGING gate, so enabling via any documented token (see the README)
# behaves identically everywhere.
_TRUTHY_VALUES = ("1", "true", "yes", "on")

# Any of these makes the pinned OTLP exporters able to reach a collector; the
# spec lets an operator set only the signal-specific ones.
_ENDPOINT_VARS = (
    "OTEL_EXPORTER_OTLP_ENDPOINT",
    "OTEL_EXPORTER_OTLP_TRACES_ENDPOINT",
    "OTEL_EXPORTER_OTLP_METRICS_ENDPOINT",
)

# Trace-context fields appended to the JSON log formatter when OTel is enabled;
# populated by TraceContextFilter.
_TRACE_LOG_FIELDS = "%(service_name)s %(trace_id)s %(span_id)s %(trace_flags)s"


def is_otel_enabled() -> bool:
    """Return True when OTEL_ENABLED is set to a recognized truthy token."""
    return os.environ.get("OTEL_ENABLED", "0").strip().lower() in _TRUTHY_VALUES


def has_otel_endpoint() -> bool:
    """Return True when at least one OTLP endpoint var is set."""
    return any(os.environ.get(name, "").strip() for name in _ENDPOINT_VARS)


def is_otel_active() -> bool:
    """Return True when OTel will actually be bootstrapped in this process.

    The single predicate shared by setup.configure_otel(), both Django settings
    modules and plane/celery.py. Gating the log schema on OTEL_ENABLED alone
    would diverge from the bootstrap gate: `OTEL_ENABLED=1` with no endpoint
    installs no TracerProvider, so every log line would gain permanently empty
    trace_id / span_id fields for zero telemetry.
    """
    return is_otel_enabled() and has_otel_endpoint()


class TraceContextFilter(logging.Filter):
    """Inject trace_id, span_id, trace_flags, service_name into LogRecord."""

    def filter(self, record: logging.LogRecord) -> bool:
        ctx = trace.get_current_span().get_span_context()
        if ctx.is_valid:
            record.trace_id = format(ctx.trace_id, "032x")
            record.span_id = format(ctx.span_id, "016x")
            record.trace_flags = int(ctx.trace_flags)
        else:
            record.trace_id = ""
            record.span_id = ""
            record.trace_flags = 0
        record.service_name = os.environ.get("OTEL_SERVICE_NAME", "plane-api")
        return True


def extend_logging_config(logging_config: dict) -> None:
    """Trace-correlate a Django LOGGING dict in place. No-op unless OTel is active.

    When active, extends the JSON formatter's fmt with the trace-context fields
    and attaches TraceContextFilter to every handler. Attaching at the handler
    level (rather than the root logger) is required because most plane.* loggers
    set propagate=False; runtime mutation also wouldn't survive Django's
    dictConfig. The off path leaves the log schema byte-for-byte unchanged.

    Also names the observability loggers explicitly. Both settings modules apply
    LOGGING with disable_existing_loggers=True, and by then the bootstrap has
    already created `plane.observability.*` and `opentelemetry.*` loggers — any
    logger not named here would be disabled, silencing export errors,
    instrumentor failures and flush warnings for the rest of the process.

    Shared by settings/local.py and settings/production.py so the two stay in
    lockstep.
    """
    if not is_otel_active():
        return
    logging_config["formatters"]["json"]["fmt"] = (
        "%(levelname)s %(asctime)s %(module)s %(name)s %(message)s " + _TRACE_LOG_FIELDS
    )
    logging_config.setdefault("filters", {})["trace_context"] = {
        "()": "plane.observability.logging.TraceContextFilter",
    }
    for handler in logging_config["handlers"].values():
        existing = list(handler.get("filters", []))
        if "trace_context" not in existing:
            existing.append("trace_context")
        handler["filters"] = existing

    logging_config["loggers"]["plane.observability"] = {
        "level": "INFO",
        "handlers": ["console"],
        "propagate": False,
    }
    logging_config["loggers"]["opentelemetry"] = {
        "level": "WARNING",
        "handlers": ["console"],
        "propagate": False,
    }
