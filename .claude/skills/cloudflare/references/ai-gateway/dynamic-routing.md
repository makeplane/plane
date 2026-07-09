# Dynamic Routing

Configure complex routing in dashboard without code changes. Use route names instead of model names.

## Usage

```typescript
const response = await client.chat.completions.create({
  model: 'dynamic/smart-chat', // Route name from dashboard
  messages: [{ role: 'user', content: 'Hello!' }]
});
```

## Node Types

| Node | Purpose | Use Case |
|------|---------|----------|
| **Conditional** | Branch on metadata | Paid vs free users, geo routing |
| **Percentage** | A/B split traffic | Model testing, gradual rollouts |
| **Rate Limit** | Enforce quotas | Per-user/team limits |
| **Budget Limit** | Cost quotas | Per-user spending caps |
| **Model** | Call provider | Final destination |

## Metadata

Pass via header (max 5 entries, flat only):
```typescript
headers: {
  'cf-aig-metadata': JSON.stringify({
    userId: 'user-123',
    tier: 'pro',
    region: 'us-east'
  })
}
```

## Common Patterns

**Multi-model fallback:**
```
Start → GPT-4 → On error: Claude → On error: Llama
```

**Tiered access:**
```
Conditional: tier == 'enterprise' → GPT-4 (no limit)
Conditional: tier == 'pro' → Rate Limit 1000/hr → GPT-4o
Conditional: tier == 'free' → Rate Limit 10/hr → GPT-4o-mini
```

**Gradual rollout:**
```
Percentage: 10% → New model, 90% → Old model
```

**Cost-based fallback:**
```
Budget Limit: $100/day per teamId
  < 80%: GPT-4
  >= 80%: GPT-4o-mini
  >= 100%: Error
```

## Version Management

- Save changes as new version
- Test with `model: 'dynamic/route@v2'`
- Roll back by deploying previous version

## Monitoring

Dashboard → Gateway → Dynamic Routes:
- Request count per path
- Success/error rates
- Latency/cost by path

## Limitations

- Max 5 metadata entries
- Values: string/number/boolean/null only
- No nested objects
- Route names: alphanumeric + hyphens
