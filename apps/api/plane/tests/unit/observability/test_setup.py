# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Tests for plane.observability.setup.configure_otel and helpers.

Strategy: mock at the boundary. The OTLP exporter factories and the
opentelemetry global setters (`set_tracer_provider`, `set_meter_provider`)
are patched so tests don't open real gRPC connections or mutate global
OTEL state. Instrumentor classes are patched at the same point — the
real DjangoInstrumentor is a module-level singleton that would survive
the test process and pollute other suites.
"""

import logging
import os
from contextlib import ExitStack
from unittest.mock import patch

import pytest

from plane.observability.setup import (
    _create_metric_exporter,
    _create_span_exporter,
    configure_otel,
)


_MOCK_TARGETS = (
    "plane.observability.setup._create_span_exporter",
    "plane.observability.setup._create_metric_exporter",
    "opentelemetry.trace.set_tracer_provider",
    "opentelemetry.metrics.set_meter_provider",
    "plane.observability.setup.DjangoInstrumentor",
    "plane.observability.setup.CeleryInstrumentor",
    "plane.observability.setup.PsycopgInstrumentor",
    "plane.observability.setup.RedisInstrumentor",
    "plane.observability.setup.RequestsInstrumentor",
    "plane.observability.setup.HTTPXClientInstrumentor",
)


def _full_enabled_env(monkeypatch):
    """Set the minimal env that makes configure_otel run end-to-end."""
    monkeypatch.setenv("OTEL_ENABLED", "1")
    monkeypatch.setenv("OTEL_EXPORTER_OTLP_ENDPOINT", "http://localhost:4317")


def _patched_configure_otel():
    """Run configure_otel with the full boundary mocked.

    Returns a dict of mock objects keyed by their target string so callers
    can assert on them.
    """
    stack = ExitStack()
    mocks = {target: stack.enter_context(patch(target)) for target in _MOCK_TARGETS}
    try:
        configure_otel()
    finally:
        stack.close()
    return mocks


# ---------------------------------------------------------------------------
# Gating
# ---------------------------------------------------------------------------


@pytest.mark.unit
def test_disabled_by_default_does_nothing():
    # No env set (fixture clears OTEL_* automatically).
    with patch("opentelemetry.trace.set_tracer_provider") as set_tp, patch(
        "opentelemetry.metrics.set_meter_provider"
    ) as set_mp:
        configure_otel()
    set_tp.assert_not_called()
    set_mp.assert_not_called()


@pytest.mark.unit
def test_explicit_zero_is_treated_as_disabled(monkeypatch):
    monkeypatch.setenv("OTEL_ENABLED", "0")
    monkeypatch.setenv("OTEL_EXPORTER_OTLP_ENDPOINT", "http://localhost:4317")
    with patch("opentelemetry.trace.set_tracer_provider") as set_tp:
        configure_otel()
    set_tp.assert_not_called()


@pytest.mark.unit
def test_enabled_without_endpoint_warns_and_returns(monkeypatch, caplog):
    monkeypatch.setenv("OTEL_ENABLED", "1")
    with patch("opentelemetry.trace.set_tracer_provider") as set_tp:
        with caplog.at_level(logging.WARNING, logger="plane.observability.setup"):
            configure_otel()
    set_tp.assert_not_called()
    assert any(
        "OTEL_EXPORTER_OTLP_ENDPOINT is not set" in r.message
        for r in caplog.records
    )


@pytest.mark.unit
@pytest.mark.parametrize("truthy_value", ["1", "true", "TRUE", "yes", "YES", "on", "ON", " on "])
def test_truthy_values_for_otel_enabled(truthy_value, monkeypatch):
    monkeypatch.setenv("OTEL_ENABLED", truthy_value)
    monkeypatch.setenv("OTEL_EXPORTER_OTLP_ENDPOINT", "http://localhost:4317")

    mocks = _patched_configure_otel()
    mocks["opentelemetry.trace.set_tracer_provider"].assert_called_once()


# ---------------------------------------------------------------------------
# Provider + instrumentation wiring
# ---------------------------------------------------------------------------


@pytest.mark.unit
def test_enabled_with_endpoint_sets_providers_and_instruments(monkeypatch):
    _full_enabled_env(monkeypatch)
    mocks = _patched_configure_otel()

    mocks["plane.observability.setup._create_span_exporter"].assert_called_once()
    mocks["plane.observability.setup._create_metric_exporter"].assert_called_once()
    mocks["opentelemetry.trace.set_tracer_provider"].assert_called_once()
    mocks["opentelemetry.metrics.set_meter_provider"].assert_called_once()

    for instrumentor_target in (
        "plane.observability.setup.DjangoInstrumentor",
        "plane.observability.setup.CeleryInstrumentor",
        "plane.observability.setup.PsycopgInstrumentor",
        "plane.observability.setup.RedisInstrumentor",
        "plane.observability.setup.RequestsInstrumentor",
        "plane.observability.setup.HTTPXClientInstrumentor",
    ):
        mocks[instrumentor_target].return_value.instrument.assert_called_once()


@pytest.mark.unit
def test_psycopg_instrumentor_called_with_enable_commenter_false(monkeypatch):
    _full_enabled_env(monkeypatch)
    mocks = _patched_configure_otel()
    mocks[
        "plane.observability.setup.PsycopgInstrumentor"
    ].return_value.instrument.assert_called_once_with(enable_commenter=False)


# ---------------------------------------------------------------------------
# Defaults / overrides
# ---------------------------------------------------------------------------


@pytest.mark.unit
def test_applies_defaults_for_unset_otel_vars(monkeypatch):
    _full_enabled_env(monkeypatch)
    _patched_configure_otel()

    assert os.environ.get("OTEL_SERVICE_NAME") == "plane-api"
    assert os.environ.get("OTEL_TRACES_SAMPLER") == "parentbased_traceidratio"
    assert os.environ.get("OTEL_TRACES_SAMPLER_ARG") == "0.1"
    assert os.environ.get("OTEL_EXPORTER_OTLP_PROTOCOL") == "grpc"


@pytest.mark.unit
def test_operator_overrides_are_preserved(monkeypatch):
    _full_enabled_env(monkeypatch)
    monkeypatch.setenv("OTEL_SERVICE_NAME", "custom-name")
    monkeypatch.setenv("OTEL_TRACES_SAMPLER_ARG", "0.5")
    monkeypatch.setenv("OTEL_EXPORTER_OTLP_PROTOCOL", "http/protobuf")

    _patched_configure_otel()

    assert os.environ["OTEL_SERVICE_NAME"] == "custom-name"
    assert os.environ["OTEL_TRACES_SAMPLER_ARG"] == "0.5"
    assert os.environ["OTEL_EXPORTER_OTLP_PROTOCOL"] == "http/protobuf"


# ---------------------------------------------------------------------------
# Quiet loggers
# ---------------------------------------------------------------------------


@pytest.mark.unit
def test_quiet_otel_loggers_sets_warning_level(monkeypatch):
    _full_enabled_env(monkeypatch)
    _patched_configure_otel()

    assert logging.getLogger("opentelemetry").level == logging.WARNING
    assert logging.getLogger("opentelemetry.exporter.otlp").level == logging.WARNING
    assert logging.getLogger("opentelemetry.instrumentation").level == logging.WARNING


# ---------------------------------------------------------------------------
# Idempotency
# ---------------------------------------------------------------------------


@pytest.mark.unit
def test_idempotent_when_called_twice(monkeypatch):
    _full_enabled_env(monkeypatch)

    stack = ExitStack()
    mocks = {target: stack.enter_context(patch(target)) for target in _MOCK_TARGETS}
    try:
        configure_otel()
        configure_otel()
    finally:
        stack.close()

    assert mocks["plane.observability.setup._create_span_exporter"].call_count == 1
    assert mocks["opentelemetry.trace.set_tracer_provider"].call_count == 1
    assert (
        mocks["plane.observability.setup.DjangoInstrumentor"]
        .return_value.instrument.call_count
        == 1
    )


@pytest.mark.unit
def test_idempotent_when_disabled():
    # When disabled, configure_otel returns BEFORE flipping _CONFIGURED.
    # Calling twice is still a no-op and the flag stays False.
    from plane.observability import setup as otel_setup

    configure_otel()
    configure_otel()
    assert otel_setup._CONFIGURED is False


# ---------------------------------------------------------------------------
# Protocol-aware exporter selection
# ---------------------------------------------------------------------------


@pytest.mark.unit
def test_create_span_exporter_uses_grpc_by_default():
    with patch(
        "opentelemetry.exporter.otlp.proto.grpc.trace_exporter.OTLPSpanExporter"
    ) as Grpc, patch(
        "opentelemetry.exporter.otlp.proto.http.trace_exporter.OTLPSpanExporter"
    ) as Http:
        _create_span_exporter()
    Grpc.assert_called_once()
    Http.assert_not_called()


@pytest.mark.unit
@pytest.mark.parametrize("protocol", ["http/protobuf", "http", "HTTP", "Http/Protobuf"])
def test_create_span_exporter_uses_http_when_protocol_is_http(protocol, monkeypatch):
    monkeypatch.setenv("OTEL_EXPORTER_OTLP_PROTOCOL", protocol)
    with patch(
        "opentelemetry.exporter.otlp.proto.grpc.trace_exporter.OTLPSpanExporter"
    ) as Grpc, patch(
        "opentelemetry.exporter.otlp.proto.http.trace_exporter.OTLPSpanExporter"
    ) as Http:
        _create_span_exporter()
    Http.assert_called_once()
    Grpc.assert_not_called()


@pytest.mark.unit
def test_create_metric_exporter_uses_grpc_by_default():
    with patch(
        "opentelemetry.exporter.otlp.proto.grpc.metric_exporter.OTLPMetricExporter"
    ) as Grpc, patch(
        "opentelemetry.exporter.otlp.proto.http.metric_exporter.OTLPMetricExporter"
    ) as Http:
        _create_metric_exporter()
    Grpc.assert_called_once()
    Http.assert_not_called()


@pytest.mark.unit
@pytest.mark.parametrize("protocol", ["http/protobuf", "http"])
def test_create_metric_exporter_uses_http_when_protocol_is_http(protocol, monkeypatch):
    monkeypatch.setenv("OTEL_EXPORTER_OTLP_PROTOCOL", protocol)
    with patch(
        "opentelemetry.exporter.otlp.proto.grpc.metric_exporter.OTLPMetricExporter"
    ) as Grpc, patch(
        "opentelemetry.exporter.otlp.proto.http.metric_exporter.OTLPMetricExporter"
    ) as Http:
        _create_metric_exporter()
    Http.assert_called_once()
    Grpc.assert_not_called()
