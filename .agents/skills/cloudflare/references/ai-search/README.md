# Cloudflare AI Search Reference

Expert guidance for implementing Cloudflare AI Search (formerly AutoRAG), Cloudflare's managed semantic search and RAG service.

## Overview

**AI Search** is a managed RAG (Retrieval-Augmented Generation) pipeline that combines:
- Automatic semantic indexing of your content
- Vector similarity search
- Built-in LLM generation

**Key value propositions:**
- **Zero vector management** - No manual embedding, indexing, or storage
- **Auto-indexing** - Content automatically re-indexed every 6 hours
- **Built-in generation** - Optional AI response generation from retrieved context
- **Multi-source** - Index from R2 buckets or website crawls

**Data source options:**
- **R2 bucket** - Index files from Cloudflare R2 (supports MD, TXT, HTML, PDF, DOC, CSV, JSON)
- **Website** - Crawl and index website content (requires Cloudflare-hosted domain)

**Indexing lifecycle:**
- Automatic 6-hour refresh cycle
- Manual "Force Sync" available (30s rate limit)
- Not designed for real-time updates

## Quick Start

**1. Create AI Search instance in dashboard:**
- Go to Cloudflare Dashboard → AI Search → Create
- Choose data source (R2 or website)
- Configure instance name and settings

**2. Configure Worker:**

```jsonc
// wrangler.jsonc
{
  "ai": {
    "binding": "AI"
  }
}
```

**3. Use in Worker:**

```typescript
export default {
  async fetch(request, env) {
    const answer = await env.AI.autorag("my-search-instance").aiSearch({
      query: "How do I configure caching?",
      model: "@cf/meta/llama-3.3-70b-instruct-fp8-fast"
    });
    
    return Response.json({ answer: answer.response });
  }
};
```

## When to Use AI Search

### AI Search vs Vectorize

| Factor | AI Search | Vectorize |
|--------|-----------|-----------|
| **Management** | Fully managed | Manual embedding + indexing |
| **Use when** | Want zero-ops RAG pipeline | Need custom embeddings/control |
| **Indexing** | Automatic (6hr cycle) | Manual via API |
| **Generation** | Built-in optional | Bring your own LLM |
| **Data sources** | R2 or website | Manual insert |
| **Best for** | Docs, support, enterprise search | Custom ML pipelines, real-time |

### AI Search vs Direct Workers AI

| Factor | AI Search | Workers AI (direct) |
|--------|-----------|---------------------|
| **Context** | Automatic retrieval | Manual context building |
| **Use when** | Need RAG (search + generate) | Simple generation tasks |
| **Indexing** | Built-in | Not applicable |
| **Best for** | Knowledge bases, docs | Simple chat, transformations |

### search() vs aiSearch()

| Method | Returns | Use When |
|--------|---------|----------|
| `search()` | Search results only | Building custom UI, need raw chunks |
| `aiSearch()` | AI response + results | Need ready-to-use answer (chatbot, Q&A) |

### Real-time Updates Consideration

**AI Search is NOT ideal if:**
- Need real-time content updates (<6 hours)
- Content changes multiple times per hour
- Strict freshness requirements

**AI Search IS ideal if:**
- Content relatively stable (docs, policies, knowledge bases)
- 6-hour refresh acceptable
- Prefer zero-ops over real-time

## Platform Limits

| Limit | Value |
|-------|-------|
| Max instances per account | 10 |
| Max files per instance | 100,000 |
| Max file size | 4 MB |
| Index frequency | Every 6 hours |
| Force Sync rate limit | Once per 30 seconds |
| Filter nesting depth | 2 levels |
| Filters per compound | 10 |
| Score threshold range | 0.0 - 1.0 |

## Reading Order

Navigate these references based on your task:

| Task | Read | Est. Time |
|------|------|-----------|
| **Understand AI Search** | README only | 5 min |
| **Implement basic search** | README → api.md | 10 min |
| **Configure data source** | README → configuration.md | 10 min |
| **Production patterns** | patterns.md | 15 min |
| **Debug issues** | gotchas.md | 10 min |
| **Full implementation** | README → api.md → patterns.md | 30 min |

## In This Reference

- **[api.md](api.md)** - API endpoints, methods, TypeScript interfaces
- **[configuration.md](configuration.md)** - Setup, data sources, wrangler config
- **[patterns.md](patterns.md)** - Common patterns, decision guidance, code examples
- **[gotchas.md](gotchas.md)** - Troubleshooting, code-level gotchas, limits

## See Also

- [Cloudflare AI Search Docs](https://developers.cloudflare.com/ai-search/)
- [Workers AI Docs](https://developers.cloudflare.com/workers-ai/)
- [Vectorize Docs](https://developers.cloudflare.com/vectorize/)
