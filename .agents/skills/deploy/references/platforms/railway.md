# Railway

## CLI
```bash
npm i -g @railway/cli
# or: curl -fsSL https://railway.com/install.sh | sh
railway login
railway up
```

## Config: railway.toml
```toml
[build]
buildCommand = "npm run build"

[deploy]
startCommand = "npm start"
healthcheckPath = "/"
restartPolicyType = "ON_FAILURE"
```

## Detection
- `railway.toml`, `railway.json`
- Auto-detects via Railpack (language/framework)

## Free Tier
- No free tier (removed 2024)
- $5 one-time trial credit (expires 30 days)
- Hobby plan: $5/mo + usage

## Rollback
```bash
railway service rollback
# Or via dashboard: Deployments → select previous
```

## Best For
Full-stack apps, databases, background workers, private networking
