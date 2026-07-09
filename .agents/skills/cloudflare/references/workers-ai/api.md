# Workers AI API Reference

## Core Method

```typescript
const response = await env.AI.run(model, input);
```

## Text Generation

```typescript
const result = await env.AI.run('@cf/meta/llama-3.1-8b-instruct', {
  messages: [
    { role: 'system', content: 'You are helpful' },
    { role: 'user', content: 'Hello' }
  ],
  temperature: 0.7,  // 0-1
  max_tokens: 100
});
console.log(result.response);
```

**Streaming:**
```typescript
const stream = await env.AI.run(model, { messages, stream: true });
return new Response(stream, { headers: { 'Content-Type': 'text/event-stream' } });
```

## Embeddings

```typescript
const result = await env.AI.run('@cf/baai/bge-base-en-v1.5', {
  text: ['Query', 'Doc 1', 'Doc 2'] // Batch for efficiency
});
const [queryEmbed, doc1Embed, doc2Embed] = result.data; // 768-dim vectors
```

## Function Calling

```typescript
const tools = [{
  type: 'function',
  function: {
    name: 'getWeather',
    description: 'Get weather for location',
    parameters: {
      type: 'object',
      properties: { location: { type: 'string' } },
      required: ['location']
    }
  }
}];

const response = await env.AI.run(model, { messages, tools });
if (response.tool_calls) {
  const args = JSON.parse(response.tool_calls[0].function.arguments);
  // Execute function, send result back
}
```

## Image Generation

```typescript
const image = await env.AI.run('@cf/stabilityai/stable-diffusion-xl-base-1.0', {
  prompt: 'Mountain sunset',
  num_steps: 20,   // 1-20
  guidance: 7.5    // 1-20
});
return new Response(image, { headers: { 'Content-Type': 'image/png' } });
```

## Speech Recognition

```typescript
const audioArray = Array.from(new Uint8Array(await request.arrayBuffer()));
const result = await env.AI.run('@cf/openai/whisper', { audio: audioArray });
console.log(result.text);
```

## Translation

```typescript
const result = await env.AI.run('@cf/meta/m2m100-1.2b', {
  text: 'Hello',
  source_lang: 'en',
  target_lang: 'es'
});
console.log(result.translated_text);
```

## REST API

```bash
curl https://api.cloudflare.com/client/v4/accounts/{account_id}/ai/run/@cf/meta/llama-3.1-8b-instruct \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"messages":[{"role":"user","content":"Hello"}]}'
```

## Error Codes

| Code | Meaning | Fix |
|------|---------|-----|
| 7502 | Model not found | Check spelling |
| 7504 | Validation failed | Verify input schema |
| 7505 | Rate limited | Reduce rate or upgrade |
| 7506 | Context exceeded | Reduce input size |

## Performance Tips

1. **Batch embeddings** - single request for multiple texts
2. **Stream long responses** - reduce perceived latency
3. **Accept cold starts** - first request ~1-3s, subsequent ~100-500ms
