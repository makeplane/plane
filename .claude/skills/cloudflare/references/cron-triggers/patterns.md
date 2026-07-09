# Cron Triggers Patterns

## API Data Sync

```typescript
export default {
  async scheduled(controller, env, ctx) {
    const response = await fetch("https://api.example.com/data", {headers: { "Authorization": `Bearer ${env.API_KEY}` }});
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    ctx.waitUntil(env.MY_KV.put("cached_data", JSON.stringify(await response.json()), {expirationTtl: 3600}));
  },
};
```

## Database Cleanup

```typescript
export default {
  async scheduled(controller, env, ctx) {
    const result = await env.DB.prepare(`DELETE FROM sessions WHERE expires_at < datetime('now')`).run();
    console.log(`Deleted ${result.meta.changes} expired sessions`);
    ctx.waitUntil(env.DB.prepare("VACUUM").run());
  },
};
```

## Report Generation

```typescript
export default {
  async scheduled(controller, env, ctx) {
    const startOfWeek = new Date(); startOfWeek.setDate(startOfWeek.getDate() - 7);
    const { results } = await env.DB.prepare(`SELECT date, revenue, orders FROM daily_stats WHERE date >= ? ORDER BY date`).bind(startOfWeek.toISOString()).all();
    const report = {period: "weekly", totalRevenue: results.reduce((sum, d) => sum + d.revenue, 0), totalOrders: results.reduce((sum, d) => sum + d.orders, 0), dailyBreakdown: results};
    const reportKey = `reports/weekly-${Date.now()}.json`;
    await env.REPORTS_BUCKET.put(reportKey, JSON.stringify(report));
    ctx.waitUntil(env.SEND_EMAIL.fetch("https://example.com/send", {method: "POST", body: JSON.stringify({to: "team@example.com", subject: "Weekly Report", reportUrl: `https://reports.example.com/${reportKey}`})}));
  },
};
```

## Health Checks

```typescript
export default {
  async scheduled(controller, env, ctx) {
    const services = [{name: "API", url: "https://api.example.com/health"}, {name: "CDN", url: "https://cdn.example.com/health"}];
    const checks = await Promise.all(services.map(async (service) => {
      const start = Date.now();
      try {
        const response = await fetch(service.url, { signal: AbortSignal.timeout(5000) });
        return {name: service.name, status: response.ok ? "up" : "down", responseTime: Date.now() - start};
      } catch (error) {
        return {name: service.name, status: "down", responseTime: Date.now() - start, error: error.message};
      }
    }));
    ctx.waitUntil(env.STATUS_KV.put("health_status", JSON.stringify(checks)));
    const failures = checks.filter(c => c.status === "down");
    if (failures.length > 0) ctx.waitUntil(fetch(env.ALERT_WEBHOOK, {method: "POST", body: JSON.stringify({text: `${failures.length} service(s) down: ${failures.map(f => f.name).join(", ")}`})}));
  },
};
```

## Batch Processing (Rate-Limited)

```typescript
export default {
  async scheduled(controller, env, ctx) {
    const queueData = await env.QUEUE_KV.get("pending_items", "json");
    if (!queueData || queueData.length === 0) return;
    const batch = queueData.slice(0, 100);
    const results = await Promise.allSettled(batch.map(item => fetch("https://api.example.com/process", {method: "POST", headers: {"Authorization": `Bearer ${env.API_KEY}`, "Content-Type": "application/json"}, body: JSON.stringify(item)})));
    console.log(`Processed ${results.filter(r => r.status === "fulfilled").length}/${batch.length} items`);
    ctx.waitUntil(env.QUEUE_KV.put("pending_items", JSON.stringify(queueData.slice(100))));
  },
};
```

## Queue Integration

```typescript
export default {
  async scheduled(controller, env, ctx) {
    const batch = await env.MY_QUEUE.receive({ batchSize: 100 });
    const results = await Promise.allSettled(batch.messages.map(async (msg) => {
      await processMessage(msg.body, env);
      await msg.ack();
    }));
    console.log(`Processed ${results.filter(r => r.status === "fulfilled").length}/${batch.messages.length}`);
  },
};
```

## Monitoring & Observability

```typescript
export default {
  async scheduled(controller, env, ctx) {
    const startTime = Date.now();
    const meta = { cron: controller.cron, scheduledTime: controller.scheduledTime };
    console.log("[START]", meta);
    try {
      const result = await performTask(env);
      console.log("[SUCCESS]", { ...meta, duration: Date.now() - startTime, count: result.count });
      ctx.waitUntil(env.METRICS.put(`cron:${controller.scheduledTime}`, JSON.stringify({ ...meta, status: "success" }), { expirationTtl: 2592000 }));
    } catch (error) {
      console.error("[ERROR]", { ...meta, duration: Date.now() - startTime, error: error.message });
      ctx.waitUntil(fetch(env.ALERT_WEBHOOK, { method: "POST", body: JSON.stringify({ text: `Cron failed: ${controller.cron}`, error: error.message }) }));
      throw error;
    }
  },
};
```

**View logs:** `npx wrangler tail` or Dashboard → Workers & Pages → Worker → Logs

## Durable Objects Coordination

```typescript
export default {
  async scheduled(controller, env, ctx) {
    const stub = env.COORDINATOR.get(env.COORDINATOR.idFromName("cron-lock"));
    const acquired = await stub.tryAcquireLock(controller.scheduledTime);
    if (!acquired) {
      controller.noRetry();
      return;
    }
    try {
      await performTask(env);
    } finally {
      await stub.releaseLock();
    }
  },
};
```

## Python Handler

```python
from workers import WorkerEntrypoint

class Default(WorkerEntrypoint):
    async def scheduled(self, controller, env, ctx):
        data = await env.MY_KV.get("key")
        ctx.waitUntil(env.DB.execute("DELETE FROM logs WHERE created_at < datetime('now', '-7 days')"))
```

## Testing Patterns

**Local testing with /__scheduled:**
```bash
# Start dev server
npx wrangler dev

# Test specific cron
curl "http://localhost:8787/__scheduled?cron=*/5+*+*+*+*"

# Test with specific time
curl "http://localhost:8787/__scheduled?cron=0+2+*+*+*&scheduledTime=1704067200000"
```

**Unit tests:**
```typescript
// test/scheduled.test.ts
import { describe, it, expect, vi } from "vitest";
import { env } from "cloudflare:test";
import worker from "../src/index";

describe("Scheduled Handler", () => {
  it("executes cron", async () => {
    const controller = { scheduledTime: Date.now(), cron: "*/5 * * * *", type: "scheduled" as const, noRetry: vi.fn() };
    const ctx = { waitUntil: vi.fn(), passThroughOnException: vi.fn() };
    await worker.scheduled(controller, env, ctx);
    expect(await env.MY_KV.get("last_run")).toBeDefined();
  });
  
  it("calls noRetry on duplicate", async () => {
    const controller = { scheduledTime: 1704067200000, cron: "0 2 * * *", type: "scheduled" as const, noRetry: vi.fn() };
    await env.EXECUTIONS.put("0 2 * * *-1704067200000", "1");
    await worker.scheduled(controller, env, { waitUntil: vi.fn(), passThroughOnException: vi.fn() });
    expect(controller.noRetry).toHaveBeenCalled();
  });
});
```

## See Also

- [README.md](./README.md) - Overview
- [api.md](./api.md) - Handler implementation
- [gotchas.md](./gotchas.md) - Troubleshooting
