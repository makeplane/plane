from opentelemetry import trace
from opentelemetry.sdk.trace import TracerProvider
from opentelemetry.sdk.trace.export import BatchSpanProcessor
from opentelemetry.exporter.otlp.proto.grpc.trace_exporter import OTLPSpanExporter
from opentelemetry.sdk.resources import Resource
from opentelemetry.instrumentation.django import DjangoInstrumentor
import os


def init_telemetry():
    """Initialize OpenTelemetry with proper shutdown handling"""

    # Check if already initialized to prevent double initialization
    if trace.get_tracer_provider().__class__.__name__ == "TracerProvider":
        return

    # Configure the tracer provider
    service_name = os.environ.get("SERVICE_NAME", "plane-ce-api")
    resource = Resource.create({"service.name": service_name})
    tracer_provider = TracerProvider(resource=resource)
    trace.set_tracer_provider(tracer_provider)

    # Configure the OTLP exporter
    otel_endpoint = os.environ.get("OTLP_ENDPOINT", "https://telemetry.plane.so")
    otlp_exporter = OTLPSpanExporter(endpoint=otel_endpoint)
    span_processor = BatchSpanProcessor(otlp_exporter)
    tracer_provider.add_span_processor(span_processor)

    # Initialize Django instrumentation
    DjangoInstrumentor().instrument()

    return tracer_provider


def shutdown_telemetry():
    """Shutdown OpenTelemetry tracers and processors"""
    provider = trace.get_tracer_provider()

    if hasattr(provider, "shutdown"):
        provider.shutdown()
