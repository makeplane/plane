# Workflow Configuration

## wrangler.jsonc Setup

```jsonc
{
  "name": "my-worker",
  "main": "src/index.ts",
  "compatibility_date": "2025-01-01",  // Minimum 2024-10-22 required for Workflows bindings
  "observability": {
    "enabled": true  // Enables Workflows dashboard + structured logs
  },
  "workflows": [
    {
      "name": "my-workflow",           // Workflow name
      "binding": "MY_WORKFLOW",        // Env binding
      "class_name": "MyWorkflow",      // TS class name
      // "script_name": "other-worker" // For cross-script calls
      // "limits": { "steps": 25000 }  // Optional: max steps per instance (check docs for default/max per plan)
    }
  ],
  "limits": {
    "cpu_ms": 300000  // Check docs for default and max CPU time per plan
  }
}
```

## Step Configuration

```typescript
// Basic step
const data = await step.do('step name', async () => ({ result: 'value' }));

// With retry config
await step.do('api call', {
  retries: {
    limit: 10,              // Accepts number or Infinity
    delay: '10 seconds',    // Accepts number (ms) or duration string
    backoff: 'exponential'  // constant | linear | exponential
  },
  timeout: '30 minutes'     // Per-attempt timeout
}, async () => {
  const res = await fetch('https://api.example.com/data');
  if (!res.ok) throw new Error('Failed');
  return res.json();
});
```

### Parallel Steps
```typescript
const [user, settings] = await Promise.all([
  step.do('fetch user', async () => this.env.KV.get(`user:${id}`)),
  step.do('fetch settings', async () => this.env.KV.get(`settings:${id}`))
]);
```

### Conditional Steps
```typescript
const config = await step.do('fetch config', async () => 
  this.env.KV.get('flags', { type: 'json' })
);

// ✅ Deterministic (based on step output)
if (config.enableEmail) {
  await step.do('send email', async () => sendEmail());
}

// ❌ Non-deterministic (Date.now outside step)
if (Date.now() > deadline) { /* BAD */ }
```

### Dynamic Steps (Loops)
```typescript
const files = await step.do('list files', async () => 
  this.env.BUCKET.list()
);

for (const file of files.objects) {
  await step.do(`process ${file.key}`, async () => {
    const obj = await this.env.BUCKET.get(file.key);
    return processData(await obj.arrayBuffer());
  });
}
```

## Multiple Workflows

```jsonc
{
  "workflows": [
    {"name": "user-onboarding", "binding": "USER_ONBOARDING", "class_name": "UserOnboarding"},
    {"name": "data-processing", "binding": "DATA_PROCESSING", "class_name": "DataProcessing"}
  ]
}
```

Each class extends `WorkflowEntrypoint` with its own `Params` type.

## Cross-Script Bindings

Worker A defines workflow. Worker B calls it by adding `script_name`:

```jsonc
// Worker B (caller)
{
  "workflows": [{
    "name": "billing-workflow",
    "binding": "BILLING",
    "script_name": "billing-worker"  // Points to Worker A
  }]
}
```

## Bindings

Workflows access Cloudflare bindings via `this.env`:

```typescript
type Env = {
  MY_WORKFLOW: Workflow;
  KV: KVNamespace;
  DB: D1Database;
  BUCKET: R2Bucket;
  AI: Ai;
  VECTORIZE: VectorizeIndex;
};

await step.do('use bindings', async () => {
  const kv = await this.env.KV.get('key');
  const db = await this.env.DB.prepare('SELECT * FROM users').first();
  const file = await this.env.BUCKET.get('file.txt');
  const ai = await this.env.AI.run('@cf/meta/llama-2-7b-chat-int8', { prompt: 'Hi' });
});
```

## Pages Functions Binding

Pages Functions can trigger Workflows via service bindings:

```typescript
// functions/_middleware.ts
export const onRequest: PagesFunction<Env> = async ({ env, request }) => {
  const instance = await env.MY_WORKFLOW.create({
    params: { url: request.url }
  });
  return new Response(`Started ${instance.id}`);
};
```

Configure in wrangler.jsonc under `service_bindings`.

See: [api.md](./api.md), [patterns.md](./patterns.md)
