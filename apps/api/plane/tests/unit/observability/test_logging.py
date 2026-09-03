# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Tests for plane.observability.logging.TraceContextFilter."""

import copy
import logging

import pytest
from opentelemetry.sdk.trace import TracerProvider

from plane.observability.logging import (
    TraceContextFilter,
    extend_logging_config,
    is_otel_active,
)


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


# ---------------------------------------------------------------------------
# extend_logging_config
# ---------------------------------------------------------------------------


def _sample_logging_config() -> dict:
    """A trimmed stand-in for the LOGGING dict in plane/settings/*.py."""
    return {
        "version": 1,
        "disable_existing_loggers": True,
        "formatters": {
            "json": {
                "()": "pythonjsonlogger.json.JsonFormatter",
                "fmt": "%(levelname)s %(asctime)s %(module)s %(name)s %(message)s",
            }
        },
        "handlers": {"console": {"level": "DEBUG", "class": "logging.StreamHandler", "formatter": "json"}},
        "loggers": {"plane.api": {"level": "INFO", "handlers": ["console"], "propagate": False}},
    }


@pytest.mark.unit
def test_extend_logging_config_is_a_noop_when_disabled():
    config = _sample_logging_config()
    before = copy.deepcopy(config)
    extend_logging_config(config)
    assert config == before


@pytest.mark.unit
def test_extend_logging_config_is_a_noop_when_enabled_without_endpoint(monkeypatch):
    # OTEL_ENABLED=1 with no endpoint installs no TracerProvider, so the log
    # schema must not change — otherwise every line gains empty trace ids.
    monkeypatch.setenv("OTEL_ENABLED", "1")
    config = _sample_logging_config()
    before = copy.deepcopy(config)
    extend_logging_config(config)
    assert config == before


@pytest.mark.unit
def test_extend_logging_config_adds_trace_fields_when_active(monkeypatch):
    monkeypatch.setenv("OTEL_ENABLED", "1")
    monkeypatch.setenv("OTEL_EXPORTER_OTLP_ENDPOINT", "http://localhost:4317")
    config = _sample_logging_config()

    extend_logging_config(config)

    assert "%(trace_id)s" in config["formatters"]["json"]["fmt"]
    assert "trace_context" in config["filters"]
    assert config["handlers"]["console"]["filters"] == ["trace_context"]


@pytest.mark.unit
def test_extend_logging_config_activates_on_signal_specific_endpoint(monkeypatch):
    monkeypatch.setenv("OTEL_ENABLED", "1")
    monkeypatch.setenv("OTEL_EXPORTER_OTLP_TRACES_ENDPOINT", "http://localhost:4318/v1/traces")
    config = _sample_logging_config()

    extend_logging_config(config)

    assert "trace_context" in config["filters"]


@pytest.mark.unit
def test_extend_logging_config_preserves_existing_handler_filters(monkeypatch):
    monkeypatch.setenv("OTEL_ENABLED", "1")
    monkeypatch.setenv("OTEL_EXPORTER_OTLP_ENDPOINT", "http://localhost:4317")
    config = _sample_logging_config()
    config["handlers"]["console"]["filters"] = ["require_debug_true"]

    extend_logging_config(config)

    assert config["handlers"]["console"]["filters"] == ["require_debug_true", "trace_context"]


@pytest.mark.unit
def test_extend_logging_config_keeps_observability_loggers_alive(monkeypatch):
    # disable_existing_loggers=True would otherwise silence the bootstrap and
    # exporter loggers created before dictConfig runs.
    monkeypatch.setenv("OTEL_ENABLED", "1")
    monkeypatch.setenv("OTEL_EXPORTER_OTLP_ENDPOINT", "http://localhost:4317")
    config = _sample_logging_config()

    extend_logging_config(config)

    assert "plane.observability" in config["loggers"]
    assert "opentelemetry" in config["loggers"]


@pytest.mark.unit
@pytest.mark.parametrize(
    "enabled,endpoint,expected",
    [
        ("1", "http://localhost:4317", True),
        ("1", "", False),
        ("0", "http://localhost:4317", False),
        ("on", "http://localhost:4317", True),
    ],
)
def test_is_otel_active(enabled, endpoint, expected, monkeypatch):
    monkeypatch.setenv("OTEL_ENABLED", enabled)
    if endpoint:
        monkeypatch.setenv("OTEL_EXPORTER_OTLP_ENDPOINT", endpoint)
    assert is_otel_active() is expected
