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
