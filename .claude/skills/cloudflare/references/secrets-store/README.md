# Cloudflare Secrets Store

Account-level encrypted secret management for Workers and AI Gateway.

## Overview

**Secrets Store**: Centralized, account-level secrets, reusable across Workers
**Worker Secrets**: Per-Worker secrets (`wrangler secret put`)

### Architecture

- **Store**: Container (1/account in beta)
- **Secret**: String ≤1024 bytes
- **Scopes**: Permission boundaries controlling access
  - `workers`: For Workers runtime access
  - `ai-gateway`: For AI Gateway access
  - Secrets must have correct scope for binding to work
- **Bindings**: Connect secrets via `env` object

**Regional Availability**: Global except China Network (unavailable)

### Access Control

- **Super Admin**: Full access
- **Admin**: Create/edit/delete secrets, view metadata
- **Deployer**: View metadata + bindings
- **Reporter**: View metadata only

API Token permissions: `Account Secrets Store Edit/Read`

### Limits (Beta)

- 100 secrets/account
- 1 store/account
- 1024 bytes max/secret
- Production secrets count toward limit

## When to Use

**Use Secrets Store when:**
- Multiple Workers share same credential
- Centralized management needed
- Compliance requires audit trail
- Team collaboration on secrets

**Use Worker Secrets when:**
- Secret unique to one Worker
- Simple single-Worker project
- No cross-Worker sharing needed

## In This Reference

### Reading Order by Task

| Task | Start Here | Then Read |
|------|------------|-----------|
| Quick overview | README.md | - |
| First-time setup | README.md → configuration.md | api.md |
| Add secret to Worker | configuration.md | api.md |
| Implement access pattern | api.md | patterns.md |
| Debug errors | gotchas.md | api.md |
| Secret rotation | patterns.md | configuration.md |
| Best practices | gotchas.md | patterns.md |

### Files

- [configuration.md](./configuration.md) - Wrangler commands, binding config
- [api.md](./api.md) - Binding API, get/put/delete operations
- [patterns.md](./patterns.md) - Rotation, encryption, access control
- [gotchas.md](./gotchas.md) - Security issues, limits, best practices

## See Also
- [workers](../workers/) - Worker bindings integration
- [wrangler](../wrangler/) - CLI secret management commands
