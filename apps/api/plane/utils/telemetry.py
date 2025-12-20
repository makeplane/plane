# Telemetry disabled for government deployment
# Original implementation sent OTEL traces to telemetry.plane.so

# Global variable to track initialization (kept for API compatibility)
_TRACER_PROVIDER = None


def init_tracer():
    """No-op: Telemetry disabled for government deployment"""
    return None


def shutdown_tracer():
    """No-op: Telemetry disabled for government deployment"""
    pass
