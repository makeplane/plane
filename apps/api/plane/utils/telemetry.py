# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

# Python imports
import os
import atexit

# Third party imports
from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import Resource
from opentelemetry.instrumentation.django import DjangoInstrumentor

# Global variable to track initialization
_TRACER_PROVIDER = None


def init_tracer():
    """Initialize OpenTelemetry with proper shutdown handling"""
    return None


def shutdown_tracer():
    """Shutdown OpenTelemetry tracers and processors"""
    pass
