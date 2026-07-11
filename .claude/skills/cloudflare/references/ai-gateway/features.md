# Features & Capabilities

## Caching

Dashboard: Settings → Cache Responses → Enable

```typescript
// Custom TTL (1 hour)
headers: { 'cf-aig-cache-ttl': '3600' }

// Skip cache
headers: { 'cf-aig-skip-cache': 'true' }

// Custom cache key
headers: { 'cf-aig-cache-key': 'greeting-en' }
```

**Limits:** TTL 60s - 30 days. **Does NOT work with streaming.**

## Rate Limiting

Dashboard: Settings → Rate-limiting → Enable

- **Fixed window:** Resets at intervals
- **Sliding window:** Rolling window (more accurate)
- Returns `429` when exceeded

## Guardrails

Dashboard: Settings → Guardrails → Enable

Filter prompts/responses for inappropriate content. Actions: Flag (log) or Block (reject).

## Data Loss Prevention (DLP)

Dashboard: Settings → DLP → Enable

Detect PII (emails, SSNs, credit cards). Actions: Flag, Block, or Redact.

## Billing Modes

| Mode | Description | Setup |
|------|-------------|-------|
| **Unified Billing** | Pay through Cloudflare, no provider keys | Use `cf-aig-authorization` header only |
| **BYOK** | Store provider keys in dashboard | Add keys in Provider Keys section |
| **Pass-through** | Send provider key with each request | Include provider's auth header |

## Zero Data Retention

Dashboard: Settings → Privacy → Zero Data Retention

No prompts/responses stored. Request counts and costs still tracked.

## Logging

Dashboard: Settings → Logs → Enable (up to 10M logs)

Each entry: prompt, response, provider, model, tokens, cost, duration, cache status, metadata.

```typescript
// Skip logging for request
headers: { 'cf-aig-collect-log': 'false' }
```

**Export:** Use Logpush to S3, GCS, Datadog, Splunk, etc.

## Custom Cost Tracking

For models not in Cloudflare's pricing database:

Dashboard: Gateway → Settings → Custom Costs

Or via API: set `model`, `input_cost`, `output_cost`.

## Supported Providers (22+)

| Provider | Unified API | Notes |
|----------|-------------|-------|
| OpenAI | `openai/gpt-4o` | Full support |
| Anthropic | `anthropic/claude-sonnet-4-5` | Full support |
| Google AI | `google-ai-studio/gemini-2.0-flash` | Full support |
| Workers AI | `workersai/@cf/meta/llama-3` | Native |
| Azure OpenAI | `azure-openai/*` | Deployment names |
| AWS Bedrock | Provider endpoint only | `/bedrock/*` |
| Groq | `groq/*` | Fast inference |
| Mistral, Cohere, Perplexity, xAI, DeepSeek, Cerebras | Full support | - |

## Best Practices

1. Enable caching for deterministic prompts
2. Set rate limits to prevent abuse
3. Use guardrails for user-facing AI
4. Enable DLP for sensitive data
5. Use unified billing or BYOK for simpler key management
6. Enable logging for debugging
7. Use zero data retention when privacy required
