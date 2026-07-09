# Cloudflare WAF Expert Skill Reference

**Expertise**: Cloudflare Web Application Firewall (WAF) configuration, custom rules, managed rulesets, rate limiting, attack detection, and API integration

## Overview

Cloudflare WAF protects web applications from attacks through managed rulesets and custom rules.

**Detection (Managed Rulesets)**
- Pre-configured rules maintained by Cloudflare
- CVE-based rules, OWASP Top 10 coverage
- Three main rulesets: Cloudflare Managed, OWASP CRS, Exposed Credentials
- Actions: log, block, challenge, js_challenge, managed_challenge

**Mitigation (Custom Rules & Rate Limiting)**
- Custom expressions using Wirefilter syntax
- Attack score-based blocking (`cf.waf.score`)
- Rate limiting with per-IP, per-user, or custom characteristics
- Actions: block, challenge, js_challenge, managed_challenge, log, skip

## Quick Start

### Deploy Cloudflare Managed Ruleset
```typescript
import Cloudflare from 'cloudflare';

const client = new Cloudflare({ apiToken: process.env.CF_API_TOKEN });

// Deploy managed ruleset to zone
await client.rulesets.create({
  zone_id: 'zone_id',
  kind: 'zone',
  phase: 'http_request_firewall_managed',
  name: 'Deploy Cloudflare Managed Ruleset',
  rules: [{
    action: 'execute',
    action_parameters: {
      id: 'efb7b8c949ac4650a09736fc376e9aee', // Cloudflare Managed Ruleset
    },
    expression: 'true',
    enabled: true,
  }],
});
```

### Create Custom Rule
```typescript
// Block requests with attack score >= 40
await client.rulesets.create({
  zone_id: 'zone_id',
  kind: 'zone',
  phase: 'http_request_firewall_custom',
  name: 'Custom WAF Rules',
  rules: [{
    action: 'block',
    expression: 'cf.waf.score gt 40',
    description: 'Block high attack scores',
    enabled: true,
  }],
});
```

### Create Rate Limit
```typescript
await client.rulesets.create({
  zone_id: 'zone_id',
  kind: 'zone',
  phase: 'http_ratelimit',
  name: 'API Rate Limits',
  rules: [{
    action: 'block',
    expression: 'http.request.uri.path eq "/api/login"',
    action_parameters: {
      ratelimit: {
        characteristics: ['cf.colo.id', 'ip.src'],
        period: 60,
        requests_per_period: 10,
        mitigation_timeout: 600,
      },
    },
    enabled: true,
  }],
});
```

## Managed Ruleset Quick Reference

| Ruleset Name | ID | Coverage |
|--------------|----|---------| 
| Cloudflare Managed | `efb7b8c949ac4650a09736fc376e9aee` | OWASP Top 10, CVEs |
| OWASP Core Ruleset | `4814384a9e5d4991b9815dcfc25d2f1f` | OWASP ModSecurity CRS |
| Exposed Credentials Check | `c2e184081120413c86c3ab7e14069605` | Credential stuffing |

## Phases

WAF rules execute in specific phases:
- `http_request_firewall_managed` - Managed rulesets
- `http_request_firewall_custom` - Custom rules
- `http_ratelimit` - Rate limiting rules
- `http_request_sbfm` - Super Bot Fight Mode (Pro+)

## Reading Order

1. **[api.md](api.md)** - SDK methods, expressions, actions, parameters
2. **[configuration.md](configuration.md)** - Setup with Wrangler, Terraform, Pulumi
3. **[patterns.md](patterns.md)** - Common patterns: deploy managed, rate limiting, skip, override
4. **[gotchas.md](gotchas.md)** - Execution order, limits, expression errors

## See Also

- [Cloudflare WAF Docs](https://developers.cloudflare.com/waf/)
- [Ruleset Engine](https://developers.cloudflare.com/ruleset-engine/)
- [Expression Reference](https://developers.cloudflare.com/ruleset-engine/rules-language/)