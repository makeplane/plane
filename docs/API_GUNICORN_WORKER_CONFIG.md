# API Gunicorn Worker Configuration: ASGI (uvicorn) to WSGI (gthread)

## Context

The Plane API deployment currently uses gunicorn with uvicorn workers (ASGI):

```bash
exec gunicorn -w "$GUNICORN_WORKERS" -k uvicorn.workers.UvicornWorker plane.asgi:application \
  --bind 0.0.0.0:"${PORT:-8000}" --max-requests 1200 --max-requests-jitter 1000 --access-logfile -
```

This document proposes switching the **REST API deployment** to gunicorn with gthread workers (WSGI), while keeping the GraphQL deployment on uvicorn workers unchanged.

## Why Switch

### The REST API is entirely synchronous

The REST API layer (DRF views, permissions, middleware, decorators) is 100% synchronous Python. There are zero `async def` views in the REST API codebase. Under uvicorn workers, every sync view is wrapped in `asyncio.run_in_executor()`, adding overhead for no benefit.

The async code in the codebase lives exclusively in the **GraphQL layer** (Strawberry's `AsyncGraphQLView`, 346 async functions across 148 files), which runs on a separate deployment.

### Current overhead with uvicorn workers

When a sync DRF view runs under an ASGI uvicorn worker:

1. Request arrives on the event loop
2. Django's ASGI handler detects a sync view
3. View is dispatched to a `ThreadPoolExecutor` via `run_in_executor()`
4. Thread executes the view (DB queries, serialization, response)
5. Result is marshalled back to the event loop
6. Response is sent

Steps 2, 3, 5 are pure overhead for sync code. With WSGI + gthread, the request goes directly to a thread — no event loop, no executor wrapping.

### Response writing bottleneck (event loop funnel)

With uvicorn workers, response writing is funneled through the event loop:

```
                    ┌─────────────────────────────────────────┐
                    │           Uvicorn Worker                 │
                    │                                         │
  Request ──────────►  Event Loop (single thread)             │
                    │      │                                  │
                    │      ├──► ThreadPool Thread 1 ──► sync view ──┐
                    │      ├──► ThreadPool Thread 2 ──► sync view ──┤
                    │      ├──► ThreadPool Thread 3 ──► sync view ──┤
                    │      ...                                      │
                    │      ├──► ThreadPool Thread 40 ──► sync view ─┤
                    │      │                                        │
                    │      ◄──── all responses funnel back ─────────┘
                    │      │
                    │      ▼
                    │  Event loop writes responses to sockets
                    │  (one thread, interleaved non-blocking I/O)
                    └─────────────────────────────────────────┘
```

The sync view runs in a thread pool thread, but the ASGI `http.response.body` send — the actual response writing to the client socket — happens back on the **single event loop thread**. All threads' responses funnel through this one thread.

For small JSON responses (most DRF endpoints), this is negligible. But for endpoints returning large binary payloads (e.g., page descriptions at several MB each), this creates **head-of-line blocking**:

- 40 threads complete around the same time, each with a 5MB binary response
- The event loop must push ~200MB through sockets, interleaved but single-threaded
- While writing responses, the event loop is saturated — new incoming requests stall, connection acceptance is delayed

This is most likely to occur under burst traffic, e.g., many users opening pages simultaneously in the same workspace, where similar DB queries complete in a tight window.

With gthread (WSGI), each thread writes its own response directly to the socket:

```
  ┌───────────────────────────────────┐
  │         Gunicorn Worker           │
  │                                   │
  │  Thread 1: request → view → write response to socket ──► client
  │  Thread 2: request → view → write response to socket ──► client
  │  Thread 3: request → view → write response to socket ──► client
  │  ...
  │  Thread 8: request → view → write response to socket ──► client
  │                                   │
  └───────────────────────────────────┘
```

No funnel. Response writes are truly parallel at the OS level. A large binary response on thread 1 does not delay thread 2's response.

### Unbounded concurrency risk

The default `ThreadPoolExecutor` in Python allows ~40 concurrent threads per uvicorn worker. With `GUNICORN_WORKERS=4`, this means up to **160 concurrent requests** per pod. For endpoints that load large binary data (e.g., page descriptions from `BinaryField`), this creates OOM risk:

```
160 concurrent requests × 5MB avg binary payload = 800MB just for binary data
```

With gthread workers, concurrency is explicitly configured and bounded via `--threads`.

## Proposed Configuration

### Entrypoint Change

Make the worker class configurable via environment variable so both API and GraphQL deployments can use the same Docker image and entrypoint:

```bash
if [ "$GUNICORN_WORKER_CLASS" = "gthread" ]; then
  exec gunicorn -w "$GUNICORN_WORKERS" \
    --worker-class gthread \
    --threads "${GUNICORN_THREADS:-8}" \
    plane.wsgi:application \
    --bind 0.0.0.0:"${PORT:-8000}" \
    --max-requests 1200 \
    --max-requests-jitter 1000 \
    --access-logfile -
else
  exec gunicorn -w "$GUNICORN_WORKERS" \
    -k uvicorn.workers.UvicornWorker \
    plane.asgi:application \
    --bind 0.0.0.0:"${PORT:-8000}" \
    --max-requests 1200 \
    --max-requests-jitter 1000 \
    --access-logfile -
fi
```

### Deployment Environment Variables

| Deployment | `GUNICORN_WORKER_CLASS`         | `GUNICORN_WORKERS` | `GUNICORN_THREADS` |
| ---------- | ------------------------------- | ------------------ | ------------------ |
| REST API   | `gthread`                       | `2`                | `8`                |
| GraphQL    | _(unset — defaults to uvicorn)_ | `2`                | _(N/A)_            |

### Pod Resources (current)

```yaml
resources:
  limits:
    cpu: "1"
    memory: 2Gi
  requests:
    cpu: 500m
    memory: 1000Mi
```

## Worker and Thread Sizing

### Why 2 workers

Each gunicorn worker forks the full Python process. A Django process with all modules loaded consumes approximately **120-180MB** of base memory.

| Workers | Base memory | Remaining for requests (of 2GB limit) |
| ------- | ----------- | ------------------------------------- |
| 2       | ~300MB      | ~1.7GB                                |
| 3       | ~450MB      | ~1.55GB                               |
| 4       | ~600MB      | ~1.4GB                                |

With a 1 CPU limit, 2 workers already saturate the available CPU. Adding a third worker would not increase throughput — it would only add context-switching overhead and consume base memory. The general guideline for CPU-bound work is `2 × CPU + 1`, but for I/O-bound work (which the API is), fewer workers with more threads is more efficient since threads share memory within a process.

### Why 8 threads

The REST API is I/O-bound — views spend most of their time waiting on PostgreSQL queries and Redis lookups. Threads are cheap (shared process memory, ~8MB stack per thread) and allow concurrent I/O waiting within a single worker.

| Threads/worker | Total concurrency (2 workers) | Thread memory overhead |
| -------------- | ----------------------------- | ---------------------- |
| 4              | 8                             | ~64MB                  |
| 8              | 16                            | ~128MB                 |
| 10             | 20                            | ~160MB                 |

8 threads per worker gives **16 total concurrent requests** — a reasonable balance between concurrency and memory.

### Memory budget per request

```
Pod memory limit:                    2048MB
Base memory (2 workers):             ~300MB
Thread stack memory (16 threads):    ~128MB
Python GC / allocator overhead:      ~120MB
Remaining for request data:          ~1500MB

Per-request budget: 1500MB / 16 = ~94MB
```

94MB per request is sufficient for:

- Django request/response objects (~1-2MB)
- ORM query results and serialization (~1-5MB)
- Page description binary data (varies, typically <10MB)
- DRF serializer overhead (~1-2MB)

### Comparison with current setup

| Metric                           | Current (uvicorn)                  | Proposed (gthread)               |
| -------------------------------- | ---------------------------------- | -------------------------------- |
| Worker type                      | ASGI event loop + thread pool      | WSGI + native threads            |
| Max concurrency per pod          | ~80 (2 workers × ~40 thread pool)  | 16 (2 workers × 8 threads)       |
| Per-request overhead             | `run_in_executor` wrapping         | Direct execution                 |
| Memory predictability            | Unbounded thread pool              | Explicitly configured            |
| Worst-case memory (5MB payloads) | 80 × 10MB = 800MB for data alone   | 16 × 10MB = 160MB for data alone |
| OOM risk                         | High under load                    | Low                              |
| Backpressure                     | Weak — accepts more than it should | Strong — excess requests queue   |

## Context Variable Compatibility

The codebase uses several request-scoped state mechanisms. All are compatible with gthread workers:

| Mechanism                                      | Implementation           | gthread safe? | Reason                |
| ---------------------------------------------- | ------------------------ | ------------- | --------------------- |
| `contextvars.ContextVar` (query counter)       | Python stdlib            | Yes           | Isolated per thread   |
| `asgiref.local.Local()` (read replica routing) | Wraps ContextVar         | Yes           | Isolated per thread   |
| `crum.CurrentRequestUserMiddleware`            | `threading.local()`      | Yes           | Isolated per thread   |
| `django.utils.timezone.activate()`             | `threading.local()`      | Yes           | Isolated per thread   |
| `request.session`                              | Request object attribute | Yes           | Request is per-thread |

Note: These would **not** be safe with `gevent` or `eventlet` workers (green threads sharing one OS thread), but gthread uses real OS threads where `threading.local()` and `ContextVar` provide proper isolation.

## Scaling Guidelines

### When to increase threads

- **Symptom**: Request queue time (p99 latency) increases under normal load
- **Action**: Increase `GUNICORN_THREADS` from 8 to 10-12
- **Limit**: Monitor pod memory — each additional concurrent request adds to peak memory

### When to increase workers

- **Symptom**: CPU utilization is consistently >80% with low I/O wait
- **Action**: Increase `GUNICORN_WORKERS` to 3 (requires more pod CPU)
- **Limit**: Each worker costs ~150MB base memory

### When to scale pods instead

- **Symptom**: Memory usage approaches pod limit despite conservative thread count
- **Action**: Scale horizontally via HPA rather than increasing concurrency per pod
- **Guideline**: It's safer to run more pods with moderate concurrency than fewer pods with high concurrency

### Recommended pod resource tiers

| Traffic level | Pod resources | Workers | Threads | Concurrency | Replicas |
| ------------- | ------------- | ------- | ------- | ----------- | -------- |
| Low           | 1 CPU / 2GB   | 2       | 8       | 16          | 2        |
| Medium        | 2 CPU / 4GB   | 3       | 8       | 24          | 3-5      |
| High          | 4 CPU / 4GB   | 5       | 10      | 50          | 5+       |

## Existing Safeguards

### Worker recycling

```
--max-requests 1200 --max-requests-jitter 1000
```

Each worker is recycled after 1200 ± 1000 requests (i.e., between 200-2200 requests). This prevents memory leaks from accumulating over time. This setting is retained from the current configuration.

### Graceful degradation

When all threads are busy, new requests queue at the gunicorn level. This provides natural backpressure — clients experience higher latency rather than the pod running out of memory. This is preferable to the current behavior where uvicorn accepts more concurrent requests than the pod can safely handle.

## Rollout Plan

1. **Update entrypoint scripts** to support `GUNICORN_WORKER_CLASS` environment variable
2. **Deploy to staging** with `GUNICORN_WORKER_CLASS=gthread`, `GUNICORN_WORKERS=2`, `GUNICORN_THREADS=8`
3. **Monitor for 48 hours**:
   - Pod memory usage (should decrease under load)
   - Request latency p50/p95/p99 (should be stable or improve)
   - Error rates (should be unchanged)
   - Worker restart frequency (should be unchanged)
4. **Load test** with realistic traffic patterns, paying attention to:
   - Page description endpoints (binary payload)
   - Concurrent users on the same workspace
   - Mixed read/write workloads
5. **Roll out to production** per environment (cloud, commercial, community)
6. **Tune** threads up/down based on production metrics

## Rollback

Set `GUNICORN_WORKER_CLASS` to empty or remove the variable — the entrypoint defaults to uvicorn workers (current behavior). No code changes required.
