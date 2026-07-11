# Cloudflare Tail Workers

Specialized Workers that consume execution events from producer Workers for logging, debugging, analytics, and observability.

## When to Use This Reference

- Implementing observability/logging for Cloudflare Workers
- Processing Worker execution events, logs, exceptions
- Building custom analytics or error tracking
- Configuring real-time event streaming
- Working with tail handlers or tail consumers

## Core Concepts

### What Are Tail Workers?

Tail Workers automatically process events from producer Workers (the Workers being monitored). They receive:
- HTTP request/response info
- Console logs (`console.log/error/warn/debug`)
- Uncaught exceptions
- Execution outcomes (`ok`, `exception`, `exceededCpu`, etc.)
- Diagnostic channel events

**Key characteristics:**
- Invoked AFTER producer finishes executing
- Capture entire request lifecycle including Service Bindings and Dynamic Dispatch sub-requests
- Billed by CPU time, not request count
- Available on Workers Paid and Enterprise tiers

### Alternative: OpenTelemetry Export

**Before using Tail Workers, consider OpenTelemetry:**

For batch exports to observability tools (Sentry, Grafana, Honeycomb):
- OTEL export sends logs/traces in batches (more efficient)
- Built-in integrations with popular platforms
- Lower overhead than Tail Workers
- **Use Tail Workers only for custom real-time processing**

## Decision Tree

```
Need observability for Workers?
├─ Batch export to known tools (Sentry/Grafana/Honeycomb)?
│  └─ Use OpenTelemetry export (not Tail Workers)
├─ Custom real-time processing needed?
│  ├─ Aggregated metrics?
│  │  └─ Use Tail Worker + Analytics Engine
│  ├─ Error tracking?
│  │  └─ Use Tail Worker + external service
│  ├─ Custom logging/debugging?
│  │  └─ Use Tail Worker + KV/HTTP endpoint
│  └─ Complex event processing?
│     └─ Use Tail Worker + Durable Objects
└─ Quick debugging?
   └─ Use `wrangler tail` (different from Tail Workers)
```

## Reading Order

1. **[configuration.md](configuration.md)** - Set up Tail Workers
2. **[api.md](api.md)** - Handler signature, types, redaction
3. **[patterns.md](patterns.md)** - Common use cases and integrations
4. **[gotchas.md](gotchas.md)** - Pitfalls and debugging tips

## Quick Example

```typescript
export default {
  async tail(events, env, ctx) {
    // Process events from producer Worker
    ctx.waitUntil(
      fetch(env.LOG_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(events),
      })
    );
  }
};
```

## Related Skills

- **observability** - General Workers observability patterns, OTEL export
- **analytics-engine** - Aggregated metrics storage for tail event data
- **durable-objects** - Stateful event processing, batching tail events
- **logpush** - Alternative for batch log export (non-real-time)
- **workers-for-platforms** - Dynamic dispatch with tail consumers
