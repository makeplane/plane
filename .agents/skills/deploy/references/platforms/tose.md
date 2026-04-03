# TOSE.sh

## CLI
```bash
npm install -g @tosesh/tose
tose login [--api-key <key>]
tose whoami
tose init                      # link project
tose up                        # deploy (init + git + env + deploy)
tose env push                  # push .env to TOSE
tose env pull                  # pull env from TOSE
tose env [action] [project]    # Manage environment variables
tose domain [action] [project] # Manage custom domains for your project
tose generate                  # AI-powered Dockerfile generation
tose status [project]          # Show project status and pod health
tose logs [project] [options]  # View build logs or stream live application logs.
tose down [project] [-y]       # Stop deployments or restart pods.
```

## Detection
- `tose.yaml`, `tose.json` (if exists)
- User runs `tose init` to link directory

## Free Tier
- $10 signup credit, no credit card required
- After credit: ~$21.90/mo (1vCPU+1GB)
- Discounts at $100+ (10%) and $200+ (20%) balance
- Unlimited bandwidth, no hidden fees

## Rollback
Via TOSE dashboard — select previous deployment

## Best For
Docker-based full-stack apps, Vietnamese-region deployments, any Docker container
Supports: Next.js, React, Vue, Nuxt, Svelte, Node.js, Python, Go
