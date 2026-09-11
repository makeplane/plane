## Rate Limiting Patterns

Beyond the strategy-selection quick-reference in `references/patterns/rate-limiting.md`, here is implementation-level guidance for building production rate limiting into an API.

### Algorithms

| Algorithm | Behavior | Best for |
|-----------|----------|----------|
| **Token bucket** | Bucket refills at a fixed rate; each request consumes a token; allows short bursts up to bucket capacity | Most general-purpose APIs — smooths traffic while allowing legitimate bursts |
| **Sliding window** | Counts requests in a rolling time window (not fixed buckets) | Strict, precise limits where fixed-window edge bursts are unacceptable |
| **Fixed window** | Simple counter reset every N seconds | Low-stakes, easy-to-reason-about limits; accepts edge-of-window burst doubling |
| **Leaky bucket** | Requests queue and drain at a constant rate | Smoothing bursty traffic into steady downstream load |

### Scope and policy

- **Per-IP** — baseline abuse protection for anonymous traffic.
- **Per-API-key / per-user** — tiered quotas (free/pro/enterprise), independent of IP.
- **Per-endpoint** — expensive endpoints (search, export, AI calls) get tighter limits than cheap reads.
- **Global** — protect shared downstream resources (a rate-limited third-party API you call) regardless of caller.

### Distributed rate limiting

Single-instance in-memory counters don't work once an API runs on multiple nodes — a client can get N requests per node instead of N total. Use a shared store:

- **Redis** — atomic `INCR` + `EXPIRE` for fixed/sliding window counters, or a Lua script for atomic token-bucket check-and-decrement (avoids race conditions between the read and the write). This is the standard approach for distributed APIs.
- **Sliding window log in Redis** — sorted set keyed per client, score = request timestamp; trim entries outside the window on each check (`ZREMRANGEBYSCORE`), then `ZCARD` to count.
- **Sticky sessions** (not recommended) — route a client to the same node so local counters work; brittle, breaks under node failure/scaling.

### Response contract

Always tell the caller where they stand — don't just fail silently:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 42
X-RateLimit-Reset: 1730000000
Retry-After: 30          # on 429 responses
```

Return `429 Too Many Requests` (not `403`) when the limit is exceeded, with a body explaining the limit and reset time.

### Bypass and operational concerns

- Whitelist internal/health-check traffic and trusted service-to-service calls explicitly — don't let internal monitoring trip the same limits as public clients.
- Provide an emergency override path (config flag, not code deploy) for incident response when limits are misconfigured too tight.
- Monitor limit-hit rates as a signal: sustained hits from one client → likely abuse; hits across many clients right after a limit change → likely misconfiguration.
