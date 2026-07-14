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
"""

import logging
import os

from opentelemetry import trace

# Accepted OTEL_ENABLED tokens — the single source of truth shared by the
# bootstrap gate (setup.configure_otel), the Celery worker-log gate, and the
# Django LOGGING gate, so enabling via any documented token (see the README)
# behaves identically everywhere.
_TRUTHY_VALUES = ("1", "true", "yes", "on")

# Trace-context fields appended to the JSON log formatter when OTel is enabled;
# populated by TraceContextFilter.
_TRACE_LOG_FIELDS = "%(service_name)s %(trace_id)s %(span_id)s %(trace_flags)s"


def is_otel_enabled() -> bool:
    """Return True when OTEL_ENABLED is set to a recognized truthy token."""
    return os.environ.get("OTEL_ENABLED", "0").strip().lower() in _TRUTHY_VALUES


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
    """Trace-correlate a Django LOGGING dict in place. No-op unless OTel is enabled.

    When enabled, extends the JSON formatter's fmt with the trace-context fields
    and attaches TraceContextFilter to every handler. Attaching at the handler
    level (rather than the root logger) is required because most plane.* loggers
    set propagate=False; runtime mutation also wouldn't survive Django's
    dictConfig. The off path leaves the log schema byte-for-byte unchanged.

    Shared by settings/local.py and settings/production.py so the two stay in
    lockstep.
    """
    if not is_otel_enabled():
        return
    logging_config["formatters"]["json"]["fmt"] = (
        "%(levelname)s %(asctime)s %(module)s %(name)s %(message)s " + _TRACE_LOG_FIELDS
    )
    logging_config.setdefault("filters", {})["trace_context"] = {
        "()": "plane.observability.logging.TraceContextFilter",
    }
    for handler in logging_config["handlers"].values():
        handler["filters"] = ["trace_context"]
