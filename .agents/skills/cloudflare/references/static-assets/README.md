# Cloudflare Static Assets Skill Reference

Expert guidance for deploying and configuring static assets with Cloudflare Workers. This skill covers configuration patterns, routing architectures, asset binding usage, and best practices for SPAs, SSG sites, and full-stack applications.

## Quick Start

```jsonc
// wrangler.jsonc
{
  "name": "my-app",
  "main": "src/index.ts",
  "compatibility_date": "2025-01-01",
  "assets": {
    "directory": "./dist"
  }
}
```

```typescript
// src/index.ts
export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    return env.ASSETS.fetch(request);
  }
};
```

Deploy: `wrangler deploy`

## When to Use Workers Static Assets vs Pages

| Factor | Workers Static Assets | Cloudflare Pages |
|--------|----------------------|------------------|
| **Use case** | Hybrid apps (static + dynamic API) | Static sites, SSG |
| **Worker control** | Full control over routing | Limited (Functions) |
| **Configuration** | Code-first, flexible | Git-based, opinionated |
| **Dynamic routing** | Worker-first patterns | Functions (_functions/) |
| **Best for** | Full-stack apps, SPAs with APIs | Jamstack, static docs |

**Decision tree:**

- Need custom routing logic? → Workers Static Assets
- Pure static site or SSG? → Pages
- API routes + SPA? → Workers Static Assets
- Framework (Next, Nuxt, Remix)? → Pages

## Reading Order

1. **configuration.md** - Setup, wrangler.jsonc options, routing patterns
2. **api.md** - ASSETS binding API, request/response handling
3. **patterns.md** - Common patterns (SPA, API routes, auth, A/B testing)
4. **gotchas.md** - Limits, errors, performance tips

## In This Reference

- **[configuration.md](configuration.md)** - Setup, deployment, configuration
- **[api.md](api.md)** - API endpoints, methods, interfaces
- **[patterns.md](patterns.md)** - Common patterns, use cases, examples
- **[gotchas.md](gotchas.md)** - Troubleshooting, best practices, limitations

## See Also

- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Static Assets Docs](https://developers.cloudflare.com/workers/static-assets/)
- [Cloudflare Pages](https://developers.cloudflare.com/pages/)
