# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Tests for plane.observability.logging.TraceContextFilter."""

import logging

import pytest
from opentelemetry.sdk.trace import TracerProvider

from plane.observability.logging import TraceContextFilter


def _make_record() -> logging.LogRecord:
    return logging.LogRecord(
        name="t",
        level=logging.INFO,
        pathname=__file__,
        lineno=1,
        msg="x",
        args=(),
        exc_info=None,
    )


@pytest.mark.unit
def test_filter_writes_empty_ids_when_no_active_span():
    record = _make_record()
    TraceContextFilter().filter(record)
    assert record.trace_id == ""
    assert record.span_id == ""
    assert record.trace_flags == 0


@pytest.mark.unit
def test_filter_writes_ids_when_span_active():
    # Use a local SDK TracerProvider — do NOT call set_tracer_provider so
    # the global state isn't mutated for sibling tests.
    tracer = TracerProvider().get_tracer(__name__)
    with tracer.start_as_current_span("unit-span"):
        record = _make_record()
        TraceContextFilter().filter(record)

    assert len(record.trace_id) == 32
    assert len(record.span_id) == 16
    assert int(record.trace_id, 16) != 0
    assert int(record.span_id, 16) != 0


@pytest.mark.unit
def test_filter_always_returns_true():
    # Filter is a "decorator" — it enriches the record but never drops it.
    assert TraceContextFilter().filter(_make_record()) is True


@pytest.mark.unit
def test_service_name_uses_env_when_set(monkeypatch):
    monkeypatch.setenv("OTEL_SERVICE_NAME", "custom-service")
    record = _make_record()
    TraceContextFilter().filter(record)
    assert record.service_name == "custom-service"


@pytest.mark.unit
def test_service_name_falls_back_to_plane_api():
    record = _make_record()
    TraceContextFilter().filter(record)
    assert record.service_name == "plane-api"


@pytest.mark.unit
def test_trace_flags_is_int_for_log_record_compat():
    # python-json-logger serializes ints natively; ensure trace_flags is
    # an int and not a TraceFlags enum object that would render as a repr.
    tracer = TracerProvider().get_tracer(__name__)
    with tracer.start_as_current_span("unit-span"):
        record = _make_record()
        TraceContextFilter().filter(record)
    assert isinstance(record.trace_flags, int)
