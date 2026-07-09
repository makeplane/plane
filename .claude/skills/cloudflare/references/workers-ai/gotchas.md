# Workers AI Gotchas

## Critical: @cloudflare/ai is DEPRECATED

```typescript
// ❌ WRONG - Don't install @cloudflare/ai
import Ai from '@cloudflare/ai';

// ✅ CORRECT - Use native binding
export default {
  async fetch(request: Request, env: Env) {
    await env.AI.run('@cf/meta/llama-3.1-8b-instruct', { messages: [...] });
  }
}
```

## Development

### "AI inference doesn't work locally"
```bash
# ❌ Local AI doesn't work
wrangler dev
# ✅ Use remote
wrangler dev --remote
```

### "env.AI is undefined"
Add binding to wrangler.jsonc:
```jsonc
{ "ai": { "binding": "AI" } }
```

## API Responses

### Embedding response shape varies
```typescript
// @cf/baai/bge-base-en-v1.5 returns: { data: [[0.1, 0.2, ...]] }
const embedding = response.data[0]; // Get first element
```

### Stream returns ReadableStream
```typescript
const stream = await env.AI.run(model, { messages: [...], stream: true });
for await (const chunk of stream) { console.log(chunk.response); }
```

## Rate Limits & Pricing

| Model Type | Neurons/Request |
|------------|-----------------|
| Small text (7B) | ~50-200 |
| Large text (70B) | ~500-2000 |
| Embeddings | ~5-20 |
| Image gen | ~10,000+ |

**Free tier**: 10,000 neurons/day

```typescript
// ❌ EXPENSIVE - 70B model
await env.AI.run('@cf/meta/llama-3.1-70b-instruct', ...);
// ✅ CHEAPER - Use smallest that works
await env.AI.run('@cf/meta/llama-3.1-8b-instruct', ...);
```

## Model-Specific

### Function calling
Only `@cf/meta/llama-3.1-*` and `mistral-7b-instruct-v0.2` support tools.

### Empty response
Check context limits (2K-8K tokens). Validate input structure.

### Inconsistent responses
Set `temperature: 0` for deterministic outputs.

### Cold start latency
First request: 1-3s. Use AI Gateway caching for frequent prompts.

## TypeScript

```typescript
interface Env {
  AI: Ai; // From @cloudflare/workers-types
}

interface TextGenerationResponse { response: string; }
interface EmbeddingResponse { data: number[][]; shape: number[]; }
```

## Common Errors

### 7502: Model not found
Check exact model name at developers.cloudflare.com/workers-ai/models/

### 7504: Input validation failed
```typescript
// Text gen requires messages array
await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
  messages: [{ role: 'user', content: 'Hello' }]  // ✅
});

// Embeddings require text
await env.AI.run('@cf/baai/bge-base-en-v1.5', { text: 'Hello' });  // ✅
```

## Vercel AI SDK Integration

```typescript
import { openai } from '@ai-sdk/openai';
const model = openai('gpt-3.5-turbo', {
  baseURL: 'https://api.cloudflare.com/client/v4/accounts/<ACCOUNT_ID>/ai/v1',
  headers: { Authorization: 'Bearer <API_TOKEN>' }
});
```
