from opentelemetry import trace
from django.conf import settings
from functools import wraps

tracer = trace.get_tracer(__name__)


def trace_operation(operation_name, **attributes):
    def wrapper(func):
        @wraps(func)
        def traced_func(*args, **kwargs):
            if settings.TELEMETRY_ENABLED:
                with tracer.start_as_current_span(operation_name) as span:
                    for key, value in attributes.items():
                        span.set_attribute(key, value)
                    result = func(*args, **kwargs)
                    span.add_event(
                        "operation_completed", {"result": str(result)}
                    )
                    return result
            else:
                return func(*args, **kwargs)

        return traced_func

    return wrapper
