# Cron Triggers API

## Basic Handler

```typescript
export default {
  async scheduled(controller: ScheduledController, env: Env, ctx: ExecutionContext): Promise<void> {
    console.log("Cron executed:", new Date(controller.scheduledTime));
  },
};
```

**JavaScript:** Same signature without types  
**Python:** `class Default(WorkerEntrypoint): async def scheduled(self, controller, env, ctx)`

## ScheduledController

```typescript
interface ScheduledController {
  scheduledTime: number;  // Unix ms when scheduled to run
  cron: string;           // Expression that triggered (e.g., "*/5 * * * *")
  type: string;           // Always "scheduled"
  noRetry(): void;        // Prevent automatic retry on failure
}
```

**Prevent retry on failure:**
```typescript
export default {
  async scheduled(controller, env, ctx) {
    try {
      await riskyOperation(env);
    } catch (error) {
      // Don't retry - failure is expected/acceptable
      controller.noRetry();
      console.error("Operation failed, not retrying:", error);
    }
  },
};
```

**When to use noRetry():**
- External API failures outside your control (avoid hammering failed services)
- Rate limit errors (retry would fail again immediately)
- Duplicate execution detected (idempotency check failed)
- Non-critical operations where skip is acceptable (analytics, caching)
- Validation errors that won't resolve on retry

## Handler Parameters

**`controller: ScheduledController`**
- Access cron expression and scheduled time

**`env: Env`**
- All bindings: KV, R2, D1, secrets, service bindings

**`ctx: ExecutionContext`**
- `ctx.waitUntil(promise)` - Extend execution for async tasks (logging, cleanup, external APIs)
- First `waitUntil` failure recorded in Cron Events

## Multiple Schedules

```typescript
export default {
  async scheduled(controller, env, ctx) {
    switch (controller.cron) {
      case "*/3 * * * *": ctx.waitUntil(updateRecentData(env)); break;
      case "0 * * * *": ctx.waitUntil(processHourlyAggregation(env)); break;
      case "0 2 * * *": ctx.waitUntil(performDailyMaintenance(env)); break;
      default: console.warn(`Unhandled: ${controller.cron}`);
    }
  },
};
```

## ctx.waitUntil Usage

```typescript
export default {
  async scheduled(controller, env, ctx) {
    const data = await fetchCriticalData(); // Critical path
    
    // Non-blocking background tasks
    ctx.waitUntil(Promise.all([
      logToAnalytics(data),
      cleanupOldRecords(env.DB),
      notifyWebhook(env.WEBHOOK_URL, data),
    ]));
  },
};
```

## Workflow Integration

```typescript
import { WorkflowEntrypoint } from "cloudflare:workers";

export class DataProcessingWorkflow extends WorkflowEntrypoint {
  async run(event, step) {
    const data = await step.do("fetch-data", () => fetchLargeDataset());
    const processed = await step.do("process-data", () => processDataset(data));
    await step.do("store-results", () => storeResults(processed));
  }
}

export default {
  async scheduled(controller, env, ctx) {
    const instance = await env.MY_WORKFLOW.create({
      params: { scheduledTime: controller.scheduledTime, cron: controller.cron },
    });
    console.log(`Started workflow: ${instance.id}`);
  },
};
```

## Testing Handler

**Local development (/__scheduled endpoint):**
```bash
# Start dev server
npx wrangler dev

# Trigger any cron
curl "http://localhost:8787/__scheduled?cron=*/5+*+*+*+*"

# Trigger specific cron with custom time
curl "http://localhost:8787/__scheduled?cron=0+2+*+*+*&scheduledTime=1704067200000"
```

**Query parameters:**
- `cron` - Required. URL-encoded cron expression (use `+` for spaces)
- `scheduledTime` - Optional. Unix timestamp in milliseconds (defaults to current time)

**Production security:** The `/__scheduled` endpoint is available in production and can be triggered by anyone. Block it or implement authentication - see [gotchas.md](./gotchas.md#security-concerns)

**Unit testing (Vitest):**
```typescript
// test/scheduled.test.ts
import { describe, it, expect } from "vitest";
import { env } from "cloudflare:test";
import worker from "../src/index";

describe("Scheduled Handler", () => {
  it("processes scheduled event", async () => {
    const controller = { scheduledTime: Date.now(), cron: "*/5 * * * *", type: "scheduled" as const, noRetry: () => {} };
    const ctx = { waitUntil: (p: Promise<any>) => p, passThroughOnException: () => {} };
    await worker.scheduled(controller, env, ctx);
    expect(await env.MY_KV.get("last_run")).toBeDefined();
  });
  
  it("handles multiple crons", async () => {
    const ctx = { waitUntil: () => {}, passThroughOnException: () => {} };
    await worker.scheduled({ scheduledTime: Date.now(), cron: "*/5 * * * *", type: "scheduled", noRetry: () => {} }, env, ctx);
    expect(await env.MY_KV.get("last_type")).toBe("frequent");
  });
});
```

## Error Handling

**Automatic retries:**
- Failed cron executions are retried automatically unless `noRetry()` is called
- Retry happens after a delay (typically minutes)
- Only first `waitUntil()` failure is recorded in Cron Events

**Best practices:**
```typescript
export default {
  async scheduled(controller, env, ctx) {
    try {
      await criticalOperation(env);
    } catch (error) {
      // Log error details
      console.error("Cron failed:", {
        cron: controller.cron,
        scheduledTime: controller.scheduledTime,
        error: error.message,
        stack: error.stack,
      });
      
      // Decide: retry or skip
      if (error.message.includes("rate limit")) {
        controller.noRetry(); // Skip retry for rate limits
      }
      // Otherwise allow automatic retry
      throw error;
    }
  },
};
```

## See Also

- [README.md](./README.md) - Overview
- [patterns.md](./patterns.md) - Use cases, examples
- [gotchas.md](./gotchas.md) - Common errors, testing issues
