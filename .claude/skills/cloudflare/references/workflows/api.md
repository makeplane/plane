# Workflow APIs

## Step APIs

```typescript
// step.do()
const result = await step.do('step name', async () => { /* logic */ });
const result = await step.do('step name', { retries, timeout }, async () => {});

// step.sleep()
await step.sleep('description', '1 hour');
await step.sleep('description', 5000); // ms

// step.sleepUntil()
await step.sleepUntil('description', Date.parse('2024-12-31'));

// step.waitForEvent()
const data = await step.waitForEvent<PayloadType>('wait', {type: 'webhook-type', timeout: '24h'});
try { const event = await step.waitForEvent('wait', { type: 'approval', timeout: '1h' }); } catch (e) { /* Timeout */ }
```

## WorkflowStepContext

The `WorkflowStepContext` is passed as the first argument to the `step.do()` callback. It provides runtime information about the current step execution.

```typescript
type WorkflowStepContext = {
  step: {
    name: string;   // Step name as passed to step.do()
    count: number;  // How many times step.do() called with this name in current run (1-indexed)
  };
  attempt: number;  // Current attempt number (1-indexed): 1 = first try, 2 = first retry, etc.
  config: WorkflowStepConfig; // Resolved config for this step, including runtime defaults
};
```

**Use cases:**
```typescript
// Adjust behavior based on retry attempt
await step.do('call api', { retries: { limit: 3, delay: '5 seconds', backoff: 'exponential' } }, async (ctx) => {
  if (ctx.attempt > 1) console.log(`Retry attempt ${ctx.attempt} for step "${ctx.step.name}"`);
  const res = await fetch('https://api.example.com/data');
  if (!res.ok) throw new Error(`API failed (attempt ${ctx.attempt})`);
  return res.json();
});

```

## Instance Management

```typescript
// Create single
const instance = await env.MY_WORKFLOW.create({id: crypto.randomUUID(), params: { userId: 'user123' }}); // id optional, auto-generated if omitted; throws if ID already exists within retention period

// Create with custom retention (check docs for default per plan)
const instance = await env.MY_WORKFLOW.create({
  id: crypto.randomUUID(),
  params: { userId: 'user123' },
  retention: '30 days'  // Override default retention period
});

// Batch (max 100, idempotent: skips existing IDs)
const instances = await env.MY_WORKFLOW.createBatch([{id: 'user1', params: {name: 'John'}}, {id: 'user2', params: {name: 'Jane'}}]);

// Get & Status
const instance = await env.MY_WORKFLOW.get('instance-id');
const status = await instance.status(); // {status: 'queued' | 'running' | 'paused' | 'errored' | 'terminated' | 'complete' | 'waiting' | 'waitingForPause' | 'unknown', error?, output?}

// Control
await instance.pause(); await instance.resume(); await instance.terminate(); await instance.restart();

// Send Events
await instance.sendEvent({type: 'approval', payload: { approved: true }}); // Must match waitForEvent type
```

## Triggering Workflows

```typescript
// From Worker
export default { async fetch(req, env) { const instance = await env.MY_WORKFLOW.create({id: crypto.randomUUID(), params: { userId: 'user123' }}); return Response.json({ id: instance.id }); }};

// From Queue
export default { async queue(batch, env) { for (const msg of batch.messages) { await env.MY_WORKFLOW.create({id: `job-${msg.id}`, params: msg.body}); } }};

// From Cron
export default { async scheduled(event, env) { await env.CLEANUP_WORKFLOW.create({id: `cleanup-${Date.now()}`, params: { timestamp: event.scheduledTime }}); }};

// From Another Workflow (non-blocking)
export class ParentWorkflow extends WorkflowEntrypoint<Env, Params> {
  async run(event, step) {
    const child = await step.do('start child', async () => await this.env.CHILD_WORKFLOW.create({id: `child-${event.instanceId}`, params: {}}));
  }
}
```

## Error Handling

```typescript
import { NonRetryableError } from 'cloudflare:workflows';

// NonRetryableError
await step.do('validate', async () => {
  if (!event.payload.paymentMethod) throw new NonRetryableError('Payment method required');
  const res = await fetch('https://api.example.com/charge', { method: 'POST' });
  if (res.status === 401) throw new NonRetryableError('Invalid credentials'); // Don't retry
  if (!res.ok) throw new Error('Retryable failure'); // Will retry
  return res.json();
});

// Catching Errors
try { await step.do('risky op', async () => { throw new NonRetryableError('Failed'); }); } catch (e) { await step.do('cleanup', async () => {}); }

// Idempotency
await step.do('charge', async () => {
  const sub = await fetch(`https://api/subscriptions/${id}`).then(r => r.json());
  if (sub.charged) return sub; // Already done
  return await fetch(`https://api/subscriptions/${id}`, {method: 'POST', body: JSON.stringify({ amount: 10.0 })}).then(r => r.json());
});
```

## Type Constraints

Params and step returns must be `Rpc.Serializable<T>`:

```typescript
// ✅ Valid types
type ValidParams = {
  userId: string;
  count: number;
  tags: string[];
  metadata: Record<string, unknown>;
};

// ❌ Invalid types
type InvalidParams = {
  callback: () => void;      // Functions not serializable
  symbol: symbol;            // Symbols not serializable
  circular: any;             // Circular references not allowed
};

// Step returns follow same rules
const result = await step.do('fetch', async () => {
  return { userId: '123', data: [1, 2, 3] }; // ✅ Plain object
});

// ✅ ReadableStream<Uint8Array> for large binary output (bypasses non-stream step result size limit)
const stream = await step.do('read from R2', async () => {
  const obj = await this.env.BUCKET.get('large-file.csv');
  return obj.body; // Return the ReadableStream directly
});
```

## Sleep & Scheduling

```typescript
// Relative
await step.sleep('wait 1 hour', '1 hour');
await step.sleep('wait 30 days', '30 days');
await step.sleep('wait 5s', 5000); // ms

// Absolute
await step.sleepUntil('launch date', Date.parse('24 Oct 2024 13:00:00 UTC'));
await step.sleepUntil('deadline', new Date('2024-12-31T23:59:59Z'));
```

Units: second, minute, hour, day, week, month, year.
Sleeping instances don't count toward concurrency.

## Parameters

**Pass from Worker:**
```typescript
const instance = await env.MY_WORKFLOW.create({
  id: crypto.randomUUID(),
  params: { userId: 'user123', email: 'user@example.com' }
});
```

**Access in Workflow:**
```typescript
async run(event: WorkflowEvent<Params>, step: WorkflowStep) {
  const userId = event.payload.userId;
  const instanceId = event.instanceId;
  const createdAt = event.timestamp;
}
```

**CLI Trigger:**
```bash
npx wrangler workflows trigger my-workflow '{"userId":"user123"}'
```

## Wrangler CLI

```bash
npm create cloudflare@latest my-workflow -- --template "cloudflare/workflows-starter"
npx wrangler deploy
npx wrangler workflows list
npx wrangler workflows trigger my-workflow '{"userId":"user123"}'
npx wrangler workflows instances list my-workflow
npx wrangler workflows instances describe my-workflow instance-id
npx wrangler workflows instances pause/resume/terminate my-workflow instance-id
```

## REST API

```bash
# Create
curl -X POST "https://api.cloudflare.com/client/v4/accounts/{account_id}/workflows/{workflow_name}/instances" -H "Authorization: Bearer {token}" -d '{"id":"custom-id","params":{"userId":"user123"}}'

# Status
curl "https://api.cloudflare.com/client/v4/accounts/{account_id}/workflows/{workflow_name}/instances/{instance_id}/status" -H "Authorization: Bearer {token}"

# Send Event
curl -X POST "https://api.cloudflare.com/client/v4/accounts/{account_id}/workflows/{workflow_name}/instances/{instance_id}/events" -H "Authorization: Bearer {token}" -d '{"type":"approval","payload":{"approved":true}}'
```

See: [configuration.md](./configuration.md), [patterns.md](./patterns.md)
