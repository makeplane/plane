# Tail Workers API Reference

## Handler Signature

```typescript
export default {
  async tail(
    events: TraceItem[],
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    // Process events
  }
} satisfies ExportedHandler<Env>;
```

**Parameters:**
- `events`: Array of `TraceItem` objects (one per producer invocation)
- `env`: Bindings (KV, D1, R2, env vars, etc.)
- `ctx`: Context with `waitUntil()` for async work

**CRITICAL:** Tail handlers don't return values. Use `ctx.waitUntil()` for async operations.

## TraceItem Type

```typescript
interface TraceItem {
  scriptName: string;           // Producer Worker name
  eventTimestamp: number;        // Epoch milliseconds
  outcome: 'ok' | 'exception' | 'exceededCpu' | 'exceededMemory' 
         | 'canceled' | 'scriptNotFound' | 'responseStreamDisconnected' | 'unknown';
  
  event?: {
    request?: {
      url: string;               // Redacted by default
      method: string;
      headers: Record<string, string>;  // Sensitive headers redacted
      cf?: IncomingRequestCfProperties;
      getUnredacted(): TraceRequest;    // Bypass redaction (use carefully)
    };
    response?: {
      status: number;
    };
  };
  
  logs: Array<{
    timestamp: number;           // Epoch milliseconds
    level: 'debug' | 'info' | 'log' | 'warn' | 'error';
    message: unknown[];          // Args passed to console function
  }>;
  
  exceptions: Array<{
    timestamp: number;           // Epoch milliseconds
    name: string;                // Error type (Error, TypeError, etc.)
    message: string;             // Error description
  }>;
  
  diagnosticsChannelEvents: Array<{
    channel: string;
    message: unknown;
    timestamp: number;           // Epoch milliseconds
  }>;
}
```

**Note:** Official SDK uses `TraceItem`, not `TailItem`. Use `@cloudflare/workers-types` for accurate types.

## Timestamp Handling

All timestamps are **epoch milliseconds**, not seconds:

```typescript
// ✅ CORRECT - use directly with Date
const date = new Date(event.eventTimestamp);

// ❌ WRONG - don't multiply by 1000
const date = new Date(event.eventTimestamp * 1000);
```

## Automatic Redaction

By default, sensitive data is redacted from `TraceRequest`:

### Header Redaction

Headers containing these substrings (case-insensitive):
- `auth`, `key`, `secret`, `token`, `jwt`
- `cookie`, `set-cookie`

Redacted values show as `"REDACTED"`.

### URL Redaction

- **Hex IDs:** 32+ hex digits → `"REDACTED"`
- **Base-64 IDs:** 21+ chars with 2+ upper, 2+ lower, 2+ digits → `"REDACTED"`

## Bypassing Redaction

```typescript
export default {
  async tail(events, env, ctx) {
    for (const event of events) {
      // ⚠️ Use with extreme caution
      const unredacted = event.event?.request?.getUnredacted();
      // unredacted.url and unredacted.headers contain raw values
    }
  }
};
```

**Best practices:**
- Only call `getUnredacted()` when absolutely necessary
- Never log unredacted sensitive data
- Implement additional filtering before external transmission
- Use environment variables for API keys, never hardcode

## Type-Safe Handler

```typescript
interface Env {
  LOGS_KV: KVNamespace;
  ANALYTICS: AnalyticsEngineDataset;
  LOG_ENDPOINT: string;
  API_TOKEN: string;
}

export default {
  async tail(
    events: TraceItem[],
    env: Env,
    ctx: ExecutionContext
  ): Promise<void> {
    const payload = events.map(event => ({
      script: event.scriptName,
      timestamp: event.eventTimestamp,
      outcome: event.outcome,
      url: event.event?.request?.url,
      status: event.event?.response?.status,
    }));
    
    ctx.waitUntil(
      fetch(env.LOG_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
    );
  }
} satisfies ExportedHandler<Env>;
```

## Outcome vs HTTP Status

**IMPORTANT:** `outcome` is script execution status, NOT HTTP status.

- Worker returns 500 → `outcome='ok'` if script completed successfully
- Uncaught exception → `outcome='exception'` regardless of HTTP status
- CPU limit exceeded → `outcome='exceededCpu'`

```typescript
// ✅ Check outcome for script execution status
if (event.outcome === 'exception') {
  // Script threw uncaught exception
}

// ✅ Check HTTP status separately
if (event.event?.response?.status === 500) {
  // HTTP 500 returned (script may have handled error)
}
```

## Serialization Considerations

`log.message` is `unknown[]` and may contain non-serializable objects:

```typescript
// ❌ May fail with circular references or BigInt
JSON.stringify(events);

// ✅ Safe serialization
const safePayload = events.map(event => ({
  ...event,
  logs: event.logs.map(log => ({
    ...log,
    message: log.message.map(m => {
      try {
        return JSON.parse(JSON.stringify(m));
      } catch {
        return String(m);
      }
    })
  }))
}));
```

**Common serialization issues:**
- Circular references in logged objects
- `BigInt` values (not JSON-serializable)
- Functions or symbols in console.log arguments
- Large objects exceeding body size limits
