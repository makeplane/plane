# Cloudflare Workers AI

Expert guidance for Cloudflare Workers AI - serverless GPU-powered AI inference at the edge.

## Overview

Workers AI provides:
- 50+ pre-trained models (LLMs, embeddings, image generation, speech-to-text, translation)
- Native Workers binding (no external API calls)
- Pay-per-use pricing (neurons consumed per inference)
- OpenAI-compatible REST API
- Streaming support for text generation
- Function calling with compatible models

**Architecture**: Inference runs on Cloudflare's GPU network. Models load on first request (cold start 1-3s), subsequent requests are faster.

## Quick Start

```typescript
interface Env {
  AI: Ai;
}

export default {
  async fetch(request: Request, env: Env) {
    const response = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
      messages: [{ role: 'user', content: 'What is Cloudflare?' }]
    });
    return Response.json(response);
  }
};
```

```bash
# Setup - add binding to wrangler.jsonc
wrangler dev --remote  # Must use --remote for AI
wrangler deploy
```

## Model Selection Decision Tree

### Text Generation (Chat/Completion)

**Quality Priority**:
- **Best quality**: `@cf/meta/llama-3.1-70b-instruct` (expensive, ~2000 neurons)
- **Balanced**: `@cf/meta/llama-3.1-8b-instruct` (good quality, ~200 neurons)
- **Fastest/cheapest**: `@cf/mistral/mistral-7b-instruct-v0.1` (~50 neurons)

**Function Calling**:
- Use `@cf/meta/llama-3.1-8b-instruct` or `@cf/meta/llama-3.1-70b-instruct` (native tool support)

**Code Generation**:
- Use `@cf/deepseek-ai/deepseek-coder-6.7b-instruct` (specialized for code)

### Embeddings (Semantic Search/RAG)

**English text**:
- **Best**: `@cf/baai/bge-large-en-v1.5` (1024 dims, highest quality)
- **Balanced**: `@cf/baai/bge-base-en-v1.5` (768 dims, good quality)
- **Fast**: `@cf/baai/bge-small-en-v1.5` (384 dims, lower quality but fast)

**Multilingual**:
- Use `@hf/sentence-transformers/paraphrase-multilingual-minilm-l12-v2`

### Image Generation

- **Stable Diffusion**: `@cf/stabilityai/stable-diffusion-xl-base-1.0` (~10,000 neurons)
- **Portraits**: `@cf/lykon/dreamshaper-8-lcm` (optimized for faces)

### Other Tasks

- **Speech-to-text**: `@cf/openai/whisper`
- **Translation**: `@cf/meta/m2m100-1.2b` (100 languages)
- **Image classification**: `@cf/microsoft/resnet-50`

## SDK Approach Decision Tree

### Native Binding (Recommended)

**When**: Building Workers/Pages with TypeScript  
**Why**: Zero external dependencies, best performance, native types

```typescript
await env.AI.run(model, input);
```

### REST API

**When**: External services, non-Workers environments, testing  
**Why**: Standard HTTP, works anywhere

```bash
curl https://api.cloudflare.com/client/v4/accounts/<ACCOUNT_ID>/ai/run/@cf/meta/llama-3.1-8b-instruct \
  -H "Authorization: Bearer <API_TOKEN>" \
  -d '{"messages":[{"role":"user","content":"Hello"}]}'
```

### Vercel AI SDK Integration

**When**: Using Vercel AI SDK features (streaming UI, tool calling abstractions)  
**Why**: Unified interface across providers

```typescript
import { openai } from '@ai-sdk/openai';

const model = openai('model-name', {
  baseURL: 'https://api.cloudflare.com/client/v4/accounts/<ACCOUNT_ID>/ai/v1',
  headers: { Authorization: 'Bearer <API_TOKEN>' }
});
```

## RAG vs Direct Generation

### Use RAG (Vectorize + Workers AI) When:
- Answering questions about specific documents/data
- Need factual accuracy from known corpus
- Context exceeds model's window (>4K tokens)
- Building knowledge base chat

### Use Direct Generation When:
- Creative writing, brainstorming
- General knowledge questions
- Small context fits in prompt (<4K tokens)
- Cost optimization (RAG adds embedding + vector search costs)

## Platform Limits

| Limit | Free Tier | Paid Plans |
|-------|-----------|------------|
| Neurons/day | 10,000 | Pay per use |
| Rate limit | Varies by model | Higher (contact support) |
| Context window | Model dependent (2K-8K) | Same |
| Streaming | ✅ Supported | ✅ Supported |
| Function calling | ✅ Supported (select models) | ✅ Supported |

**Pricing**: Free 10K neurons/day, then pay per neuron consumed (varies by model)

## Common Tasks

```typescript
// Streaming text generation
const stream = await env.AI.run(model, { messages, stream: true });
for await (const chunk of stream) {
  console.log(chunk.response);
}

// Embeddings for RAG
const { data } = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
  text: ['Query text', 'Document 1', 'Document 2']
});

// Function calling
const response = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
  messages: [{ role: 'user', content: 'What is the weather?' }],
  tools: [{
    type: 'function',
    function: { name: 'getWeather', parameters: { ... } }
  }]
});
```

## Development Workflow

```bash
# Always use --remote for AI (local doesn't have models)
wrangler dev --remote

# Deploy to production
wrangler deploy

# View model catalog
# https://developers.cloudflare.com/workers-ai/models/
```

## Reading Order

**Start here**: Quick Start above → configuration.md (setup)

**Common tasks**:
- First time setup: configuration.md → Add binding + deploy
- Choose model: Model Selection Decision Tree (above) → api.md
- Build RAG: patterns.md → Vectorize integration
- Optimize costs: Model Selection + gotchas.md (rate limits)
- Debugging: gotchas.md → Common errors

## In This Reference

- [configuration.md](./configuration.md) - wrangler.jsonc setup, TypeScript types, bindings, environment variables
- [api.md](./api.md) - env.AI.run(), streaming, function calling, REST API, response types
- [patterns.md](./patterns.md) - RAG with Vectorize, prompt engineering, batching, error handling, caching
- [gotchas.md](./gotchas.md) - Deprecated @cloudflare/ai package, rate limits, pricing, common errors

## See Also

- [vectorize](../vectorize/) - Vector database for RAG patterns
- [ai-gateway](../ai-gateway/) - Caching, rate limiting, analytics for AI requests
- [workers](../workers/) - Worker runtime and fetch handler patterns
