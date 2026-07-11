# AI Search Configuration

## Worker Setup

```jsonc
// wrangler.jsonc
{
  "ai": { "binding": "AI" }
}
```

```typescript
interface Env {
  AI: Ai;
}

const answer = await env.AI.autorag("my-instance").aiSearch({
  query: "How do I configure caching?",
  model: "@cf/meta/llama-3.3-70b-instruct-fp8-fast"
});
```

## Data Sources

### R2 Bucket

Dashboard: AI Search → Create Instance → Select R2 bucket

**Supported formats:** `.md`, `.txt`, `.html`, `.pdf`, `.doc`, `.docx`, `.csv`, `.json`

**Auto-indexed metadata:** `filename`, `folder`, `timestamp`

### Website Crawler

Requirements:
- Domain on Cloudflare
- `sitemap.xml` at root
- Bot protection must allow `CloudflareAISearch` user agent

## Path Filtering (R2)

```
docs/**/*.md          # All .md in docs/ recursively
**/*.draft.md         # Exclude (use in exclude patterns)
```

## Indexing

- **Automatic:** Every 6 hours
- **Force Sync:** Dashboard button (30s rate limit between syncs)
- **Pause:** Settings → Pause Indexing (existing index remains searchable)

## Service API Token

Dashboard: AI Search → Instance → Use AI Search → API → Create Token

Permissions:
- **Read** - search operations
- **Edit** - instance management

Store securely:
```bash
wrangler secret put AI_SEARCH_TOKEN
```

## Multi-Environment

```toml
# wrangler.toml
[env.production.vars]
AI_SEARCH_INSTANCE = "prod-docs"

[env.staging.vars]
AI_SEARCH_INSTANCE = "staging-docs"
```

```typescript
const answer = await env.AI.autorag(env.AI_SEARCH_INSTANCE).aiSearch({ query });
```

## Monitoring

```typescript
const instances = await env.AI.autorag("_").listInstances();
console.log(instances.find(i => i.name === "docs"));
```

Dashboard shows: files indexed, status, last index time, storage usage.
