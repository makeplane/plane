# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Credentials in request URLs must not reach exported telemetry or the request log.

Drives real requests through the real DjangoInstrumentor (with the request_hook
configure_otel() installs) on both the WSGI and ASGI paths, then checks every
exported span attribute, every http.server.* data point and every request-log
line for the raw and decoded secret values.
"""

import logging

import pytest
from django.test import AsyncClient, Client
from opentelemetry.instrumentation.django import DjangoInstrumentor
from opentelemetry.sdk.metrics import MeterProvider
from opentelemetry.sdk.metrics.export import InMemoryMetricReader
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import SimpleSpanProcessor
from opentelemetry.sdk.trace.export.in_memory_span_exporter import InMemorySpanExporter

from plane.observability import setup as otel_setup

UID, TOKEN = "UIDSECRETb64", "TOKENSECRET-abc123"
CODE_RAW, CODE, STATE = "4%2F0CODESECRET", "4/0CODESECRET", "STATESECRET"
SECRETS = (UID, TOKEN, CODE_RAW, CODE, STATE)

URLS = (
    f"/auth/reset-password/{UID}/{TOKEN}/",
    f"/auth/reset-password/{UID}/{TOKEN}",  # slash-less: redirected before the view runs
    f"/auth/google/callback/?code={CODE_RAW}&state={STATE}",
)


@pytest.fixture
def instrumented():
    spans = InMemorySpanExporter()
    tracer_provider = TracerProvider()
    tracer_provider.add_span_processor(SimpleSpanProcessor(spans))
    metrics = InMemoryMetricReader()
    django_kwargs = next(kwargs for _, name, kwargs in otel_setup._INSTRUMENTORS if name == "DjangoInstrumentor")
    DjangoInstrumentor().instrument(
        tracer_provider=tracer_provider,
        meter_provider=MeterProvider(metric_readers=[metrics]),
        **django_kwargs,
    )
    try:
        yield spans, metrics
    finally:
        DjangoInstrumentor().uninstrument()


def _exported_values(spans, metrics):
    values = []
    for span in spans.get_finished_spans():
        values += [span.name, *map(str, span.attributes.values())]
    for resource_metrics in metrics.get_metrics_data().resource_metrics:
        for scope_metrics in resource_metrics.scope_metrics:
            for metric in scope_metrics.metrics:
                for point in metric.data.data_points:
                    values += map(str, point.attributes.values())
    return values


def _assert_no_secrets(values):
    leaked = [value for value in values for secret in SECRETS if secret in value]
    assert not leaked, leaked


@pytest.mark.unit
@pytest.mark.parametrize("url", URLS)
def test_wsgi_request_secrets_are_not_exported_or_logged(url, instrumented, caplog):
    spans, metrics = instrumented
    with caplog.at_level(logging.INFO, logger="plane.api.request"):
        Client(raise_request_exception=False).get(url)
    assert spans.get_finished_spans(), "request produced no server span"
    _assert_no_secrets(_exported_values(spans, metrics))
    # Only the request logger: Plane's LOGGING disables django.request (disable_existing_loggers).
    records = [r for r in caplog.records if r.name == "plane.api.request"]
    assert records, "request was not logged"
    _assert_no_secrets([r.getMessage() for r in records] + [r.path for r in records])


@pytest.mark.unit
@pytest.mark.parametrize("url", URLS)
def test_asgi_request_secrets_are_not_exported(url, instrumented):
    import asyncio

    spans, metrics = instrumented
    asyncio.run(AsyncClient(raise_request_exception=False).get(url))
    assert spans.get_finished_spans(), "request produced no server span"
    _assert_no_secrets(_exported_values(spans, metrics))


@pytest.mark.unit
def test_requests_without_secrets_keep_their_urls(instrumented):
    spans, _ = instrumented
    Client(raise_request_exception=False).get("/auth/google/callback/?next_path=%2Fprofile")
    (span,) = spans.get_finished_spans()
    assert "next_path=%2Fprofile" in span.attributes["http.url"]


@pytest.mark.unit
def test_redaction_failure_masks_url_attributes(instrumented, monkeypatch):
    spans, metrics = instrumented

    def boom(request):
        raise RuntimeError("resolver exploded")

    monkeypatch.setattr("plane.utils.url_redaction.request_secrets", boom)
    Client(raise_request_exception=False).get(URLS[2])
    _assert_no_secrets(_exported_values(spans, metrics))
