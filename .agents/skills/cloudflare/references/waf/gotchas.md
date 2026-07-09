# Gotchas & Troubleshooting

## Execution Order

**Problem:** Rules execute in unexpected order
**Cause:** Misunderstanding phase execution
**Solution:**

Phases execute sequentially (can't be changed):
1. `http_request_firewall_custom` - Custom rules
2. `http_request_firewall_managed` - Managed rulesets
3. `http_ratelimit` - Rate limiting

Within phase: top-to-bottom, first match wins (unless `skip`)

```typescript
// WRONG: Can't mix phase-specific actions
await client.rulesets.create({
  phase: 'http_request_firewall_custom',
  rules: [
    { action: 'block', expression: 'cf.waf.score gt 50' },
    { action: 'execute', action_parameters: { id: 'managed_id' } }, // WRONG
  ],
});

// CORRECT: Separate rulesets per phase
await client.rulesets.create({ phase: 'http_request_firewall_custom', rules: [...] });
await client.rulesets.create({ phase: 'http_request_firewall_managed', rules: [...] });
```

## Expression Errors

**Problem:** Syntax errors prevent deployment
**Cause:** Invalid field/operator/syntax
**Solution:**

```typescript
// Common mistakes
'http.request.path' → 'http.request.uri.path' // Correct field
'ip.geoip.country eq US' → 'ip.geoip.country eq "US"' // Quote strings
'http.user_agent eq "Mozilla"' → 'lower(http.user_agent) contains "mozilla"' // Case sensitivity
'matches ".*[.jpg"' → 'matches ".*\\.jpg$"' // Valid regex
```

Test expressions in Security Events before deploying.

## Skip Rule Pitfalls

**Problem:** Skip rules don't work as expected
**Cause:** Misunderstanding skip scope
**Solution:**

Skip types:
- `ruleset: 'current'` - Skip remaining rules in current ruleset only
- `phases: ['phase_name']` - Skip entire phases

```typescript
// WRONG: Trying to skip managed rules from custom phase
// In http_request_firewall_custom:
{
  action: 'skip',
  action_parameters: { ruleset: 'current' },
  expression: 'ip.src in {192.0.2.0/24}',
}
// This only skips remaining custom rules, not managed rules

// CORRECT: Skip specific phases
{
  action: 'skip',
  action_parameters: {
    phases: ['http_request_firewall_managed', 'http_ratelimit'],
  },
  expression: 'ip.src in {192.0.2.0/24}',
}
```

## Update Replaces All Rules

**Problem:** Updating ruleset deletes other rules
**Cause:** `update()` replaces entire rule list
**Solution:**

```typescript
// WRONG: This deletes all existing rules!
await client.rulesets.update({
  zone_id: 'zone_id',
  ruleset_id: 'ruleset_id',
  rules: [{ action: 'block', expression: 'cf.waf.score gt 50' }],
});

// CORRECT: Get existing rules first
const ruleset = await client.rulesets.get({ zone_id: 'zone_id', ruleset_id: 'ruleset_id' });
await client.rulesets.update({
  zone_id: 'zone_id',
  ruleset_id: 'ruleset_id',
  rules: [...ruleset.rules, { action: 'block', expression: 'cf.waf.score gt 50' }],
});
```

## Override Conflicts

**Problem:** Managed ruleset overrides don't apply
**Cause:** Rule ID doesn't exist or category name incorrect
**Solution:**

```typescript
// List managed ruleset rules to find IDs
const ruleset = await client.rulesets.get({
  zone_id: 'zone_id',
  ruleset_id: 'efb7b8c949ac4650a09736fc376e9aee',
});
console.log(ruleset.rules.map(r => ({ id: r.id, description: r.description })));

// Use correct IDs in overrides
{ action: 'execute', action_parameters: { id: 'efb7b8c949ac4650a09736fc376e9aee', 
  overrides: { rules: [{ id: '5de7edfa648c4d6891dc3e7f84534ffa', action: 'log' }] } } }
```

## False Positives

**Problem:** Legitimate traffic blocked
**Cause:** Aggressive rules/thresholds
**Solution:**

1. Start with log mode: `overrides: { action: 'log' }`
2. Review Security Events to identify false positives
3. Override specific rules: `overrides: { rules: [{ id: 'rule_id', action: 'log' }] }`

## Rate Limiting NAT Issues

**Problem:** Users behind NAT hit rate limits too quickly
**Cause:** Multiple users sharing single IP
**Solution:**

Add more characteristics: User-Agent, session cookie, or authorization header
```typescript
{
  action: 'block',
  expression: 'http.request.uri.path starts_with "/api"',
  action_parameters: {
    ratelimit: {
      characteristics: ['cf.colo.id', 'ip.src', 'http.request.cookies["session"][0]'],
      period: 60,
      requests_per_period: 100,
    },
  },
}
```

## Performance Issues

**Problem:** Increased latency
**Cause:** Complex expressions, excessive rules
**Solution:**

1. Skip static assets early: `action: 'skip'` for `\\.(jpg|css|js)$`
2. Path-based deployment: Only run managed on `/api` or `/admin`
3. Disable unused categories: `{ category: 'wordpress', enabled: false }`
4. Prefer string operators over regex: `starts_with` vs `matches`

## Limits & Quotas

| Resource | Free | Pro | Business | Enterprise |
|----------|------|-----|----------|------------|
| Custom rules | 5 | 20 | 100 | 1000 |
| Rate limiting rules | 1 | 10 | 25 | 100 |
| Rule expression length | 4096 chars | 4096 chars | 4096 chars | 4096 chars |
| Rules per ruleset | 75 | 75 | 400 | 1000 |
| Managed rulesets | Yes | Yes | Yes | Yes |
| Rate limit characteristics | 2 | 3 | 5 | 5 |

**Important Notes:**
- Rules execute in order; first match wins (except skip rules)
- Expression evaluation stops at first `false` in AND chains
- `matches` regex operator is slower than string operators
- Rate limit counting happens before mitigation

## API Errors

**Problem:** API calls fail with cryptic errors
**Cause:** Invalid parameters or permissions
**Solution:**

```typescript
// Error: "Invalid phase" → Use exact phase name
phase: 'http_request_firewall_custom'

// Error: "Ruleset already exists" → Use update() or list first
const rulesets = await client.rulesets.list({ zone_id, phase: 'http_request_firewall_custom' });
if (rulesets.result.length > 0) {
  await client.rulesets.update({ zone_id, ruleset_id: rulesets.result[0].id, rules: [...] });
}

// Error: "Action not supported" → Check phase/action compatibility
// 'execute' only in http_request_firewall_managed
// Rate limit config only in http_ratelimit phase

// Error: "Expression parse error" → Common fixes:
'ip.geoip.country eq "US"'   // Quote strings
'cf.waf.score gt 40'         // Use 'gt' not '>'
'http.request.uri.path'      // Not 'http.request.path'
```

**Tip**: Test expressions in dashboard Security Events before deploying.
