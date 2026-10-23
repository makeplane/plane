# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""Instance metrics are only pushed to an explicitly configured OTLP collector."""

from unittest.mock import patch

import pytest
from django.utils import timezone

from plane.license.bgtasks import telemetry_metrics
from plane.license.models import Instance

pytestmark = pytest.mark.unit


@pytest.fixture
def instance(db):
    return Instance.objects.create(
        instance_name="Xplication",
        instance_id="test-instance",
        current_version="1.0.0",
        last_checked_at=timezone.now(),
        is_telemetry_enabled=True,
    )


def test_skips_push_without_otlp_endpoint(instance, monkeypatch):
    monkeypatch.delenv("OTLP_ENDPOINT", raising=False)
    with patch.object(telemetry_metrics, "_create_otlp_metric_exporter") as create_exporter:
        telemetry_metrics._collect_and_push_metrics()
    create_exporter.assert_not_called()


def test_skips_push_when_telemetry_disabled(instance, monkeypatch):
    monkeypatch.setenv("OTLP_ENDPOINT", "https://collector.example.com")
    instance.is_telemetry_enabled = False
    instance.save()
    with patch.object(telemetry_metrics, "_create_otlp_metric_exporter") as create_exporter:
        telemetry_metrics._collect_and_push_metrics()
    create_exporter.assert_not_called()


def test_pushes_to_configured_endpoint(instance, monkeypatch):
    monkeypatch.setenv("OTLP_ENDPOINT", "https://collector.example.com")
    with (
        patch.object(telemetry_metrics, "_create_otlp_metric_exporter") as create_exporter,
        patch.object(telemetry_metrics, "PeriodicExportingMetricReader"),
        patch.object(telemetry_metrics, "MeterProvider"),
    ):
        telemetry_metrics._collect_and_push_metrics()
    create_exporter.assert_called_once()
