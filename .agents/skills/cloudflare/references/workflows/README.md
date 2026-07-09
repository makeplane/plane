# Cloudflare Workflows

Durable multi-step applications with automatic retries, state persistence, and long-running execution.

## What It Does

- Chain steps with automatic retry logic
- Persist state between steps (minutes → weeks)
- Handle failures without losing progress
- Wait for external events/approvals
- Sleep without consuming resources

**Available:** Free & Paid Workers plans

## Core Concepts

**Workflow**: Class extending `WorkflowEntrypoint` with `run` method
**Instance**: Single execution with unique ID & independent state
**Steps**: Independently retriable units via `step.do()` - API calls, DB queries, AI invocations
**State**: Persisted from step returns; step name = cache key

## Quick Start

```typescript
import { WorkflowEntrypoint, WorkflowStep, WorkflowEvent } from 'cloudflare:workers';

type Env = { MY_WORKFLOW: Workflow; DB: D1Database };
type Params = { userId: string };

export class MyWorkflow extends WorkflowEntrypoint<Env, Params> {
  async run(event: WorkflowEvent<Params>, step: WorkflowStep) {
    const user = await step.do('fetch user', async () => {
      return await this.env.DB.prepare('SELECT * FROM users WHERE id = ?')
        .bind(event.payload.userId).first();
    });
    
    await step.sleep('wait 7 days', '7 days');
    
    await step.do('send reminder', async () => {
      await sendEmail(user.email, 'Reminder!');
    });
  }
}
```

## Key Features

- **Durability**: Failed steps don't re-run successful ones
- **Retries**: Configurable backoff (constant/linear/exponential)
- **Events**: `waitForEvent()` for webhooks/approvals (configurable timeout)
- **Sleep**: `sleep()` / `sleepUntil()` for scheduling
- **Parallel**: `Promise.all()` for concurrent steps
- **Idempotency**: Check-then-execute patterns

## Retrieval

These reference files cover API shapes, code patterns, and debugging — things that are stable. For **limits, pricing, and other values that change**, always fetch the latest from the official docs:

- **Limits:** https://developers.cloudflare.com/workflows/reference/limits/
- **Pricing:** https://developers.cloudflare.com/workflows/reference/pricing/
- **Workers API:** https://developers.cloudflare.com/workflows/build/workers-api/

## Reading Order

**Getting Started:** configuration.md → api.md → patterns.md  
**Troubleshooting:** gotchas.md

## In This Reference
- [configuration.md](./configuration.md) - wrangler.jsonc setup, step config, bindings
- [api.md](./api.md) - Step APIs, instance management, sleep/parameters
- [patterns.md](./patterns.md) - Common workflows, testing, orchestration
- [gotchas.md](./gotchas.md) - Timeouts, limits, debugging strategies

## See Also
- [durable-objects](../durable-objects/) - Alternative stateful approach
- [queues](../queues/) - Message-driven workflows
- [workers](../workers/) - Entry point for workflow instances
