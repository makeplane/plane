# Cloudflare Pages / Workers

## CLI
```bash
npm install -g wrangler
wrangler login

# Pages
wrangler pages deploy ./dist --project-name my-app

# Workers
wrangler deploy
```

## Config: wrangler.toml
```toml
name = "my-app"
compatibility_date = "2024-01-01"

# For Workers:
# main = "src/index.ts"
# [vars]
# ENVIRONMENT = "production"
```

## Detection
- `wrangler.toml`, `wrangler.json`

## Free Tier
- Workers: 100K requests/day, 10ms CPU/request
- Pages: unlimited sites, 500 builds/mo, unlimited bandwidth
- D1, R2, KV all have free tiers

## Rollback
```bash
wrangler pages deployment list --project-name my-app
wrangler rollback [deployment-id]
```

## Best For
Edge functions, static sites with global CDN, serverless at edge
