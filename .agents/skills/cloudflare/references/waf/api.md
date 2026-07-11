# API Reference

## SDK Setup

```typescript
import Cloudflare from 'cloudflare';

const client = new Cloudflare({
  apiToken: process.env.CF_API_TOKEN,
});
```

## Core Methods

```typescript
// List rulesets
await client.rulesets.list({ zone_id: 'zone_id', phase: 'http_request_firewall_managed' });

// Get ruleset
await client.rulesets.get({ zone_id: 'zone_id', ruleset_id: 'ruleset_id' });

// Create ruleset
await client.rulesets.create({
  zone_id: 'zone_id',
  kind: 'zone',
  phase: 'http_request_firewall_custom',
  name: 'Custom WAF Rules',
  rules: [{ action: 'block', expression: 'cf.waf.score gt 40', enabled: true }],
});

// Update ruleset (include rule id to keep existing, omit id for new rules)
await client.rulesets.update({
  zone_id: 'zone_id',
  ruleset_id: 'ruleset_id',
  rules: [
    { id: 'rule_id', action: 'block', expression: 'cf.waf.score gt 40', enabled: true },
    { action: 'challenge', expression: 'http.request.uri.path contains "/admin"', enabled: true },
  ],
});

// Delete ruleset
await client.rulesets.delete({ zone_id: 'zone_id', ruleset_id: 'ruleset_id' });
```

## Actions & Phases

### Actions by Phase

| Action | Custom | Managed | Rate Limit | Description |
|--------|--------|---------|------------|-------------|
| `block` | ✅ | ❌ | ✅ | Block request with 403 |
| `challenge` | ✅ | ❌ | ✅ | Show CAPTCHA challenge |
| `js_challenge` | ✅ | ❌ | ✅ | JS-based challenge |
| `managed_challenge` | ✅ | ❌ | ✅ | Smart challenge (recommended) |
| `log` | ✅ | ❌ | ✅ | Log only, don't block |
| `skip` | ✅ | ❌ | ❌ | Skip rule evaluation |
| `execute` | ❌ | ✅ | ❌ | Deploy managed ruleset |

### Phases (Execution Order)

1. `http_request_firewall_custom` - Custom rules (first line of defense)
2. `http_request_firewall_managed` - Managed rulesets (pre-configured protection)
3. `http_ratelimit` - Rate limiting (request throttling)
4. `http_request_sbfm` - Super Bot Fight Mode (Pro+ only)

## Expression Syntax

### Fields

```typescript
// Request properties
http.request.method          // GET, POST, etc.
http.request.uri.path        // /api/users
http.host                    // example.com

// IP and Geolocation
ip.src                       // 192.0.2.1
ip.geoip.country            // US, GB, etc.
ip.geoip.continent          // NA, EU, etc.

// Attack detection
cf.waf.score                 // 0-100 attack score
cf.waf.score.sqli           // SQL injection score
cf.waf.score.xss            // XSS score

// Headers & Cookies
http.request.headers["authorization"][0]
http.request.cookies["session"][0]
lower(http.user_agent)      // Lowercase user agent
```

### Operators

```typescript
// Comparison
eq      // Equal
ne      // Not equal
lt      // Less than
le      // Less than or equal
gt      // Greater than
ge      // Greater than or equal

// String matching
contains        // Substring match
matches         // Regex match (use carefully)
starts_with     // Prefix match
ends_with       // Suffix match

// List operations
in              // Value in list
not             // Logical NOT
and             // Logical AND
or              // Logical OR
```

### Expression Examples

```typescript
'cf.waf.score gt 40' // Attack score
'http.request.uri.path eq "/api/login" and http.request.method eq "POST"' // Path + method
'ip.src in {192.0.2.0/24 203.0.113.0/24}' // IP blocking
'ip.geoip.country in {"CN" "RU" "KP"}' // Country blocking
'http.user_agent contains "bot"' // User agent
'not http.request.headers["authorization"][0]' // Header check
'(cf.waf.score.sqli gt 20 or cf.waf.score.xss gt 20) and http.request.uri.path starts_with "/api"' // Complex
```

## Rate Limiting Configuration

```typescript
{
  action: 'block',
  expression: 'http.request.uri.path starts_with "/api"',
  action_parameters: {
    ratelimit: {
      // Characteristics define uniqueness: 'ip.src', 'cf.colo.id', 
      // 'http.request.headers["key"][0]', 'http.request.cookies["session"][0]'
      characteristics: ['cf.colo.id', 'ip.src'], // Recommended: per-IP per-datacenter
      period: 60,                      // Time window in seconds
      requests_per_period: 100,        // Max requests in period
      mitigation_timeout: 600,         // Block duration in seconds
      counting_expression: 'http.request.method ne "GET"', // Optional: filter counted requests
      requests_to_origin: false,       // Count all requests (not just origin hits)
    },
  },
  enabled: true,
}
```

## Managed Ruleset Deployment

```typescript
{
  action: 'execute',
  action_parameters: {
    id: 'efb7b8c949ac4650a09736fc376e9aee', // Cloudflare Managed
    overrides: {
      // Override specific rules
      rules: [
        { id: '5de7edfa648c4d6891dc3e7f84534ffa', action: 'log', enabled: true },
      ],
      // Override categories: 'wordpress', 'sqli', 'xss', 'rce', etc.
      categories: [
        { category: 'wordpress', enabled: false },
        { category: 'sqli', action: 'log' },
      ],
    },
  },
  expression: 'true',
  enabled: true,
}
```

## Skip Rules

Skip rules bypass subsequent rule evaluation. Two skip types:

**Skip current ruleset**: Skip remaining rules in current phase only
```typescript
{
  action: 'skip',
  action_parameters: {
    ruleset: 'current', // Skip rest of current ruleset
  },
  expression: 'http.request.uri.path ends_with ".jpg" or http.request.uri.path ends_with ".css"',
  enabled: true,
}
```

**Skip entire phases**: Skip one or more phases completely
```typescript
{
  action: 'skip',
  action_parameters: {
    phases: ['http_request_firewall_managed', 'http_ratelimit'], // Skip multiple phases
  },
  expression: 'ip.src in {192.0.2.0/24 203.0.113.0/24}',
  enabled: true,
}
```

**Note**: Skip rules in custom phase can skip managed/ratelimit phases, but not vice versa (execution order).