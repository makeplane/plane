# Cron Triggers Gotchas

## Common Errors

### "Timezone Issues"

**Problem:** Cron runs at wrong time relative to local timezone  
**Cause:** All crons execute in UTC, no local timezone support  
**Solution:** Convert local time to UTC manually

**Conversion formula:** `utcHour = (localHour - utcOffset + 24) % 24`

**Examples:**
- 9am PST (UTC-8) → `(9 - (-8) + 24) % 24 = 17` → `0 17 * * *`
- 2am EST (UTC-5) → `(2 - (-5) + 24) % 24 = 7` → `0 7 * * *`
- 6pm JST (UTC+9) → `(18 - 9 + 24) % 24 = 33 % 24 = 9` → `0 9 * * *`

**Daylight Saving Time:** Adjust manually when DST changes, or schedule at times unaffected by DST (e.g., 2am-4am local time usually safe)

### "Cron Not Executing"

**Cause:** Missing `scheduled()` export, invalid syntax, propagation delay (<15min), or plan limits  
**Solution:** Verify export exists, validate at crontab.guru, wait 15+ min after deploy, check plan limits

### "Duplicate Executions"

**Cause:** At-least-once delivery  
**Solution:** Track execution IDs in KV - see idempotency pattern below

### "Execution Failures"

**Cause:** CPU exceeded, unhandled exceptions, network timeouts, binding errors  
**Solution:** Use try-catch, AbortController timeouts, `ctx.waitUntil()` for long ops, or Workflows for heavy tasks

### "Local Testing Not Working"

**Problem:** `/__scheduled` endpoint returns 404 or doesn't trigger handler  
**Cause:** Missing `scheduled()` export, wrangler not running, or incorrect endpoint format  
**Solution:**

1. Verify `scheduled()` is exported:
```typescript
export default {
  async scheduled(controller, env, ctx) {
    console.log("Cron triggered");
  },
};
```

2. Start dev server:
```bash
npx wrangler dev
```

3. Use correct endpoint format (URL-encode spaces as `+`):
```bash
# Correct
curl "http://localhost:8787/__scheduled?cron=*/5+*+*+*+*"

# Wrong (will fail)
curl "http://localhost:8787/__scheduled?cron=*/5 * * * *"
```

4. Update Wrangler if outdated:
```bash
npm install -g wrangler@latest
```

### "waitUntil() Tasks Not Completing"

**Problem:** Background tasks in `ctx.waitUntil()` fail silently or don't execute  
**Cause:** Promises rejected without error handling, or handler returns before promise settles  
**Solution:** Always await or handle errors in waitUntil promises:

```typescript
export default {
  async scheduled(controller, env, ctx) {
    // BAD: Silent failures
    ctx.waitUntil(riskyOperation());
    
    // GOOD: Explicit error handling
    ctx.waitUntil(
      riskyOperation().catch(err => {
        console.error("Background task failed:", err);
        return logError(err, env);
      })
    );
  },
};
```

### "Idempotency Issues"

**Problem:** At-least-once delivery causes duplicate side effects (double charges, duplicate emails)  
**Cause:** No deduplication mechanism  
**Solution:** Use KV to track execution IDs:

```typescript
export default {
  async scheduled(controller, env, ctx) {
    const executionId = `${controller.cron}-${controller.scheduledTime}`;
    const existing = await env.EXECUTIONS.get(executionId);
    
    if (existing) {
      console.log("Already executed, skipping");
      controller.noRetry();
      return;
    }
    
    await env.EXECUTIONS.put(executionId, "1", { expirationTtl: 86400 }); // 24h TTL
    await performIdempotentOperation(env);
  },
};
```

### "Security Concerns"

**Problem:** `__scheduled` endpoint exposed in production allows unauthorized cron triggering  
**Cause:** Testing endpoint available in deployed Workers  
**Solution:** Block `__scheduled` in production:

```typescript
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // Block __scheduled in production
    if (url.pathname === "/__scheduled" && env.ENVIRONMENT === "production") {
      return new Response("Not Found", { status: 404 });
    }
    
    return handleRequest(request, env, ctx);
  },
  
  async scheduled(controller, env, ctx) {
    // Your cron logic
  },
};
```

**Also:** Use `env.API_KEY` for secrets (never hardcode)

**Alternative:** Add middleware to verify request origin:
```typescript
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    if (url.pathname === "/__scheduled") {
      // Check Cloudflare headers to verify internal request
      const cfRay = request.headers.get("cf-ray");
      if (!cfRay && env.ENVIRONMENT === "production") {
        return new Response("Not Found", { status: 404 });
      }
    }
    
    return handleRequest(request, env, ctx);
  },
  
  async scheduled(controller, env, ctx) {
    // Your cron logic
  },
};
```

## Limits & Quotas

| Limit | Free | Paid | Notes |
|-------|------|------|-------|
| Triggers per Worker | 3 | Unlimited | Maximum cron schedules per Worker |
| CPU time | 10ms | 30s (<1hr interval), 15min (≥1hr interval) | May need `ctx.waitUntil()` or Workflows |
| Execution guarantee | At-least-once | At-least-once | Duplicates possible - use idempotency |
| Propagation delay | Up to 15 minutes | Up to 15 minutes | Time for changes to take effect globally |
| Min interval | 1 minute | 1 minute | Cannot schedule more frequently |
| Cron accuracy | ±1 minute | ±1 minute | Execution may drift slightly |

## Testing Best Practices

**Unit tests:**
- Mock `ScheduledController`, `ExecutionContext`, and bindings
- Test each cron expression separately
- Verify `noRetry()` is called when expected
- Use Vitest with `@cloudflare/vitest-pool-workers` for realistic env

**Integration tests:**
- Test via `/__scheduled` endpoint in dev environment
- Verify idempotency logic with duplicate `scheduledTime` values
- Test error handling and retry behavior

**Production:** Start with long intervals (`*/30 * * * *`), monitor Cron Events for 24h, set up alerts before reducing interval

## Resources

- [Cron Triggers Docs](https://developers.cloudflare.com/workers/configuration/cron-triggers/)
- [Scheduled Handler API](https://developers.cloudflare.com/workers/runtime-apis/handlers/scheduled/)
- [Cloudflare Workflows](https://developers.cloudflare.com/workflows/)
- [Workers Limits](https://developers.cloudflare.com/workers/platform/limits/)
- [Crontab Guru](https://crontab.guru/) - Validator
- [Vitest Pool Workers](https://github.com/cloudflare/workers-sdk/tree/main/fixtures/vitest-pool-workers-examples)
