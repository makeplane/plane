# Digital Ocean App Platform

## CLI
```bash
brew install doctl    # macOS
snap install doctl    # Linux
winget install doctl  # Windows

doctl auth init
doctl apps create --spec spec.yaml         # new app
doctl apps update APP_ID --spec spec.yaml  # update
```

## Config: spec.yaml
```yaml
name: my-app
services:
  - name: web
    github:
      repo: user/repo
      branch: main
    build_command: npm run build
    run_command: npm start
    instance_size_slug: basic-xxs
    instance_count: 1
    http_port: 3000
```

## Detection
- `.do/app.yaml`, `spec.yaml`
- Dockerfile, buildpack detection

## Free Tier
- 3 static sites free
- Dynamic apps from $5/mo
- Droplets (VPS) from $4/mo

## Rollback
```bash
doctl apps list-deployments APP_ID
# Redeploy previous via dashboard or force-rebuild
```

## Best For
Simple full-stack deploys, managed Postgres, free static sites
