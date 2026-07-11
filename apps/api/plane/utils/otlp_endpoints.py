# Copyright (c) 2023-present Plane Software, Inc. and contributors
# SPDX-License-Identifier: AGPL-3.0-only
# See the LICENSE file for details.

"""
Shared OTLP endpoint helpers so metrics and traces use the same collector
when both are enabled. One URL (OTLP_ENDPOINT) is enough: same as traces
(e.g. https://telemetry.plane.so or https://telemetry.plane.town behind
nginx ingress with gRPC backend).
"""

import os
from urllib.parse import urlparse

# When no port in URL: https -> 443 (ingress), http -> 4317 (OTLP gRPC default)
OTLP_GRPC_DEFAULT_PORT = "4317"
HTTPS_DEFAULT_PORT = "443"

_DEFAULT_OTLP_ENDPOINT = "https://telemetry.plane.so"


def grpc_endpoint_from_url(url: str) -> str:
    """
    Derive gRPC host:port from OTLP_ENDPOINT URL.
    - https://telemetry.plane.so -> telemetry.plane.so:443 (nginx ingress)
    - https://telemetry.plane.town -> telemetry.plane.town:443 (dev)
    - telemetry.plane.so:4317 -> telemetry.plane.so:4317 (scheme-less with port)
    - telemetry.plane.so -> telemetry.plane.so:4317 (scheme-less, default gRPC port)
    - Explicit port in URL is always preserved.
    """
    # urlparse needs a scheme to correctly populate hostname/netloc.
    # Scheme-less values like "host:port" are misread as scheme="host", path="port".
    if "://" not in url:
        url = "//" + url
    parsed = urlparse(url)
    host = parsed.hostname or "telemetry.plane.so"
    if parsed.port is not None:
        port = str(parsed.port)
    elif parsed.scheme == "https":
        port = HTTPS_DEFAULT_PORT
    else:
        port = OTLP_GRPC_DEFAULT_PORT
    return f"{host}:{port}"


def get_otlp_grpc_endpoint() -> str:
    """
    Return the gRPC endpoint (host:port) for OTLP traces and metrics.
    Derived from OTLP_ENDPOINT so the same URL works for both (e.g. collector
    behind nginx ingress with gRPC backend on 443).
    """
    base = os.environ.get("OTLP_ENDPOINT", _DEFAULT_OTLP_ENDPOINT)
    return grpc_endpoint_from_url(base)


def get_otlp_http_metrics_url() -> str:
    """Return the HTTP URL for OTLP metrics (OTLP_ENDPOINT + /v1/metrics)."""
    base = os.environ.get("OTLP_ENDPOINT", _DEFAULT_OTLP_ENDPOINT)
    return f"{base.rstrip('/')}/v1/metrics"
