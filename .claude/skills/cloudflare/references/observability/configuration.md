## Configuration Patterns

### Enable Workers Logs

```jsonc
{
  "observability": {
    "enabled": true,
    "head_sampling_rate": 1  // 100% sampling (default)
  }
}
```

**Best Practice**: Use structured JSON logging for better indexing

```typescript
// Good - structured logging
console.log({ 
  user_id: 123, 
  action: "login", 
  status: "success",
  duration_ms: 45
});

// Avoid - unstructured string
console.log("user_id: 123 logged in successfully in 45ms");
```

### Enable Workers Traces

```jsonc
{
  "observability": {
    "traces": {
      "enabled": true,
      "head_sampling_rate": 0.05  // 5% sampling
    }
  }
}
```

**Note**: Default sampling is 100%. For high-traffic Workers, use lower sampling (0.01-0.1).

### Configure Analytics Engine

**Bind to Worker**:
```toml
# wrangler.toml
analytics_engine_datasets = [
  { binding = "ANALYTICS", dataset = "api_metrics" }
]
```

**Write Data Points**:
```typescript
export interface Env {
  ANALYTICS: AnalyticsEngineDataset;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Track metrics
    env.ANALYTICS.writeDataPoint({
      blobs: ['customer_123', 'POST', '/api/v1/users'],
      doubles: [1, 245.5], // request_count, response_time_ms
      indexes: ['customer_123'] // for efficient filtering
    });
    
    return new Response('OK');
  }
}
```

### Configure Tail Workers

Tail Workers receive logs/traces from other Workers for filtering, transformation, or export.

**Setup**:
```toml
# wrangler.toml
name = "log-processor"
main = "src/tail.ts"

[[tail_consumers]]
service = "my-worker" # Worker to tail
```

**Tail Worker Example**:
```typescript
export default {
  async tail(events: TraceItem[], env: Env, ctx: ExecutionContext) {
    // Filter errors only
    const errors = events.filter(event => 
      event.outcome === 'exception' || event.outcome === 'exceededCpu'
    );
    
    if (errors.length > 0) {
      // Send to external monitoring
      ctx.waitUntil(
        fetch('https://monitoring.example.com/errors', {
          method: 'POST',
          body: JSON.stringify(errors)
        })
      );
    }
  }
}
```

### Configure Logpush

Send logs to external storage (S3, R2, GCS, Azure, Datadog, etc.). Requires Business/Enterprise plan.

**Via Dashboard**:
1. Navigate to Analytics → Logs → Logpush
2. Select destination type
3. Provide credentials and bucket/endpoint
4. Choose dataset (e.g., Workers Trace Events)
5. Configure filters and fields

**Via API**:
```bash
curl -X POST "https://api.cloudflare.com/client/v4/accounts/{account_id}/logpush/jobs" \
  -H "Authorization: Bearer <API_TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "workers-logs-to-s3",
    "destination_conf": "s3://my-bucket/logs?region=us-east-1",
    "dataset": "workers_trace_events",
    "enabled": true,
    "frequency": "high",
    "filter": "{\"where\":{\"and\":[{\"key\":\"ScriptName\",\"operator\":\"eq\",\"value\":\"my-worker\"}]}}"
  }'
```

### Environment-Specific Configuration

**Development** (verbose logs, full sampling):
```jsonc
// wrangler.dev.jsonc
{
  "observability": {
    "enabled": true,
    "head_sampling_rate": 1.0,
    "traces": {
      "enabled": true
    }
  }
}
```

**Production** (reduced sampling, structured logs):
```jsonc
// wrangler.prod.jsonc
{
  "observability": {
    "enabled": true,
    "head_sampling_rate": 0.1, // 10% sampling
    "traces": {
      "enabled": true
    }
  }
}
```

Deploy with env-specific config:
```bash
wrangler deploy --config wrangler.prod.jsonc --env production
```