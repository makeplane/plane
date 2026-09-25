# OpenTelemetry for Plane self-hosters

Plane's API server can emit OpenTelemetry traces, HTTP metrics, and trace-correlated logs over OTLP. Point it at any OTEL-compatible backend (Jaeger, Tempo, Datadog Agent, Honeycomb, Grafana Cloud, …) and start debugging slow endpoints.

## Quickstart

1. Run an OTEL Collector pointing at your backend of choice. See [`otel-collector.yaml`](./otel-collector.yaml) in this folder for a starting config.
2. Set two environment variables on the API container (and, for task telemetry, the worker and beat-worker containers):
   ```bash
   OTEL_ENABLED=1
   OTEL_EXPORTER_OTLP_ENDPOINT=http://otel-collector:4317
   ```
3. Restart the API/worker containers. That's it.

## What you get

- A server span per HTTP request, with `http.route`, `http.method`, `http.status_code`, `http.target`, and duration.
- A span per Celery task with `celery.action` / `celery.task_name` / `celery.state`. Traceparent is propagated through the queue, so a request that enqueues a task is linked to that task's execution span in the same trace.
- Child spans for every Postgres query, Redis op, and outbound `requests` / `httpx` call inside that request or task.
- HTTP metrics: `http.server.duration` histogram and `http.server.active_requests`. (These are the only two `DjangoInstrumentor` emits — it does not produce request/response size histograms.)
- JSON logs on stdout with `trace_id` / `span_id` / `service_name` fields **added only when OTel is active** — that is, `OTEL_ENABLED` is truthy _and_ an OTLP endpoint is set. Any other combination leaves the existing log schema untouched, so you never get the extra fields without the traces to match them. Point the collector's `filelog` receiver at your container log directory to link logs ↔ traces.

## Environment variables

| Var                           | Default                    | Purpose                                                                                                                                           |
| ----------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `OTEL_ENABLED`                | `0`                        | Plane gate. Must be `1` (or `true`/`yes`/`on`).                                                                                                   |
| `OTEL_SERVICE_NAME`           | `plane-api`                | Service identifier in your APM backend                                                                                                            |
| `OTEL_EXPORTER_OTLP_ENDPOINT` | _(required)_               | Your collector's OTLP receiver. The signal-specific `OTEL_EXPORTER_OTLP_TRACES_ENDPOINT` / `OTEL_EXPORTER_OTLP_METRICS_ENDPOINT` are honored too. |
| `OTEL_EXPORTER_OTLP_PROTOCOL` | `grpc`                     | `grpc` or `http/protobuf`                                                                                                                         |
| `OTEL_EXPORTER_OTLP_HEADERS`  | _(unset)_                  | For SaaS backends needing auth headers                                                                                                            |
| `OTEL_ENVIRONMENT`            | _(unset)_                  | Sets `deployment.environment.name` (falls back to `SENTRY_ENVIRONMENT`)                                                                           |
| `OTEL_TRACES_SAMPLER`         | `parentbased_traceidratio` | Standard OTEL sampler                                                                                                                             |
| `OTEL_TRACES_SAMPLER_ARG`     | `0.1`                      | 10 % head sampling. Set to `1.0` to capture every request.                                                                                        |
| `OTEL_RESOURCE_ATTRIBUTES`    | _(unset)_                  | Extra resource attrs: `service.version=...`                                                                                                       |

If `OTEL_ENABLED=1` but no endpoint var is set, the API logs a single WARNING at boot and continues without instrumentation — no silent local-host default, and the log schema is left unchanged.

## What's not instrumented yet

- The `live` (Node.js) collaboration server. It has no OTEL bootstrap yet and isn't covered by this Django-side setup.

## Troubleshooting

- **No spans showing up.** Confirm `OTEL_ENABLED=1` is in the API container's env, not just the host shell. Check API logs for the `OpenTelemetry configured` INFO line at boot.
- **`connection refused` floods.** These are dropped batches. The `opentelemetry.*` loggers are pinned to WARNING (and kept alive across Django's `dictConfig`, which would otherwise disable them) so the errors still reach your logs, but the underlying gRPC retries keep happening. Fix the collector reachability or unset `OTEL_ENABLED`.
- **`trace_id` is empty in logs.** Either you're outside a request/task or the sampler dropped the trace. Drop `OTEL_TRACES_SAMPLER_ARG` to `1.0` while debugging.
