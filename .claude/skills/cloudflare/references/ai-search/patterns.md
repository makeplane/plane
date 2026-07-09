# AI Search Patterns

## search() vs aiSearch()

| Use | Method | Returns |
|-----|--------|---------|
| Custom UI, analytics | `search()` | Raw chunks only (~100-300ms) |
| Chatbots, Q&A | `aiSearch()` | AI response + chunks (~500-2000ms) |

## rewrite_query

| Setting | Use When |
|---------|----------|
| `true` | User input (typos, vague queries) |
| `false` | LLM-generated queries (already optimized) |

## Multitenancy (Folder-Based)

```typescript
const answer = await env.AI.autorag("saas-docs").aiSearch({
  query: "refund policy",
  model: "@cf/meta/llama-3.3-70b-instruct-fp8-fast",
  filters: {
    column: "folder",
    operator: "gte",  // "starts with" pattern
    value: `tenants/${tenantId}/`
  }
});
```

## Streaming

```typescript
const stream = await env.AI.autorag("docs").aiSearch({
  query, model: "@cf/meta/llama-3.3-70b-instruct-fp8-fast", stream: true
});
return new Response(stream, { headers: { "Content-Type": "text/event-stream" } });
```

## Score Threshold

| Threshold | Use |
|-----------|-----|
| 0.3 (default) | Broad recall, exploratory |
| 0.5 | Balanced, production default |
| 0.7 | High precision, critical accuracy |

## System Prompt Template

```typescript
const systemPrompt = `You are a documentation assistant.
- Answer ONLY based on provided context
- If context doesn't contain answer, say "I don't have information"
- Include code examples from context`;
```

## Compound Filters

```typescript
// OR: Multiple folders
filters: {
  operator: "or",
  filters: [
    { column: "folder", operator: "gte", value: "docs/api/" },
    { column: "folder", operator: "gte", value: "docs/auth/" }
  ]
}

// AND: Folder + date
filters: {
  operator: "and",
  filters: [
    { column: "folder", operator: "gte", value: "docs/" },
    { column: "timestamp", operator: "gte", value: oneWeekAgoSeconds }
  ]
}
```

## Reranking

Enable for high-stakes use cases (adds ~300ms latency):

```typescript
reranking: { enabled: true, model: "@cf/baai/bge-reranker-base" }
```
