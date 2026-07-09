# Cloudflare Wrangler

Official CLI for Cloudflare Workers - develop, manage, and deploy Workers from the command line.

## What is Wrangler?

Wrangler is the Cloudflare Developer Platform CLI that allows you to:
- Create, develop, and deploy Workers
- Manage bindings (KV, D1, R2, Durable Objects, etc.)
- Configure routing and environments
- Run local development servers
- Execute migrations and manage resources
- Perform integration testing

## Installation

```bash
npm install wrangler --save-dev
# or globally
npm install -g wrangler
```

Run commands: `npx wrangler <command>` (or `pnpm`/`yarn wrangler`)

## Reading Order

| If you want to... | Start here |
|-------------------|------------|
| Create/deploy Worker quickly | Essential Commands below → [patterns.md](./patterns.md) §New Worker |
| Configure bindings (KV, D1, R2) | [configuration.md](./configuration.md) §Bindings |
| Write integration tests | [api.md](./api.md) §startWorker |
| Debug production issues | [gotchas.md](./gotchas.md) + Essential Commands §Monitoring |
| Set up multi-environment workflow | [configuration.md](./configuration.md) §Environments |

## Essential Commands

### Project & Development
```bash
wrangler init [name]              # Create new project
wrangler dev                      # Local dev server (fast, simulated)
wrangler dev --remote             # Dev with remote resources (production-like)
wrangler deploy                   # Deploy to production
wrangler deploy --env staging     # Deploy to environment
wrangler versions list            # List versions
wrangler rollback [id]            # Rollback deployment
wrangler login                    # OAuth login
wrangler whoami                   # Check auth status
```

## Resource Management

### KV
```bash
wrangler kv namespace create NAME
wrangler kv key put "key" "value" --namespace-id=<id>
wrangler kv key get "key" --namespace-id=<id>
```

### D1
```bash
wrangler d1 create NAME
wrangler d1 execute NAME --command "SQL"
wrangler d1 migrations create NAME "description"
wrangler d1 migrations apply NAME
```

### R2
```bash
wrangler r2 bucket create NAME
wrangler r2 object put BUCKET/key --file path
wrangler r2 object get BUCKET/key
```

### Other Resources
```bash
wrangler queues create NAME
wrangler vectorize create NAME --dimensions N --metric cosine
wrangler hyperdrive create NAME --connection-string "..."
wrangler workflows create NAME
wrangler constellation create NAME
wrangler pages project create NAME
wrangler pages deployment create --project NAME --branch main
```

### Secrets
```bash
wrangler secret put NAME          # Set Worker secret
wrangler secret list              # List Worker secrets
wrangler secret delete NAME       # Delete Worker secret
wrangler secret bulk FILE.json    # Bulk upload from JSON

# Secrets Store (centralized, reusable across Workers)
wrangler secrets-store secret create <store-id> --name SECRET_NAME --scopes workers --remote
wrangler secrets-store secret list <store-id> --remote
```

### Monitoring
```bash
wrangler tail                     # Real-time logs
wrangler tail --env production    # Tail specific env
wrangler tail --status error      # Filter by status
```

## In This Reference

- [configuration.md](./configuration.md) - wrangler.jsonc setup, environments, bindings
- [api.md](./api.md) - Programmatic API (`startWorker`, `getPlatformProxy`, events)
- [patterns.md](./patterns.md) - Common workflows and development patterns
- [gotchas.md](./gotchas.md) - Common pitfalls, limits, and troubleshooting

## Quick Decision Tree

```
Need to test your Worker?
├─ Testing full Worker with bindings → api.md §startWorker
├─ Testing individual functions → api.md §getPlatformProxy
└─ Testing with Vitest → patterns.md §Testing with Vitest

Need to configure something?
├─ Bindings (KV, D1, R2, etc.) → configuration.md §Bindings
├─ Multiple environments → configuration.md §Environments
├─ Static files → configuration.md §Workers Assets
└─ Routing → configuration.md §Routing

Development not working?
├─ Local differs from production → Use `wrangler dev --remote`
├─ Bindings not available → gotchas.md §Binding Not Available
└─ Auth issues → wrangler login
```

## See Also

- [workers](../workers/) - Workers runtime API reference
- [miniflare](../miniflare/) - Local testing with Miniflare
- [workerd](../workerd/) - Runtime that powers `wrangler dev`
