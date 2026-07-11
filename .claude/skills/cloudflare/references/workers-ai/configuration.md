# Workers AI Configuration

## wrangler.jsonc

```jsonc
{
  "name": "my-ai-worker",
  "main": "src/index.ts",
  "compatibility_date": "2024-01-01",
  "ai": {
    "binding": "AI"
  }
}
```

## TypeScript

```bash
npm install --save-dev @cloudflare/workers-types
```

```typescript
interface Env {
  AI: Ai;
}

export default {
  async fetch(request: Request, env: Env) {
    const response = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [{ role: 'user', content: 'Hello' }]
    });
    return Response.json(response);
  }
};
```

## Local Development

```bash
wrangler dev --remote  # Required for AI - no local inference
```

## REST API

```typescript
const response = await fetch(
  `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/ai/run/@cf/meta/llama-3.1-8b-instruct`,
  {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${API_TOKEN}` },
    body: JSON.stringify({ messages: [{ role: 'user', content: 'Hello' }] })
  }
);
```

Create API token at: dash.cloudflare.com/profile/api-tokens (Workers AI - Read permission)

## SDK Compatibility

**OpenAI SDK:**
```typescript
import OpenAI from 'openai';
const client = new OpenAI({
  apiKey: env.CLOUDFLARE_API_TOKEN,
  baseURL: `https://api.cloudflare.com/client/v4/accounts/${env.ACCOUNT_ID}/ai/v1`
});
```

## Multi-Model Setup

```typescript
const MODELS = {
  chat: '@cf/meta/llama-3.1-8b-instruct',
  embed: '@cf/baai/bge-base-en-v1.5',
  image: '@cf/stabilityai/stable-diffusion-xl-base-1.0'
};
```

## RAG Setup (with Vectorize)

```jsonc
{
  "ai": { "binding": "AI" },
  "vectorize": {
    "bindings": [{ "binding": "VECTORIZE", "index_name": "embeddings-index" }]
  }
}
```

## Troubleshooting

| Error | Fix |
|-------|-----|
| `env.AI is undefined` | Check `ai` binding in wrangler.jsonc |
| Local AI doesn't work | Use `wrangler dev --remote` |
| Type 'Ai' not found | Install `@cloudflare/workers-types` |
| @cloudflare/ai package error | Don't install - use native binding |
