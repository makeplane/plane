# Vultr

## CLI
```bash
# Install
go install github.com/vultr/vultr-cli/v3@latest
# or download binary from GitHub releases

# Auth (uses env var)
export VULTR_API_KEY="your-api-key"
vultr-cli instance list

# Create instance (IaaS — no PaaS deploy)
vultr-cli instance create --region ewr --plan vc2-1c-1gb --os 387
```

## Detection
- N/A (raw VPS/Kubernetes, no project-level config)

## Free Tier
- None. Cheapest: $2.50/mo (VX1, 1vCPU, 0.5GB RAM)
- VKE (Kubernetes): free control plane, pay for nodes

## Best For
Raw VPS, Kubernetes (VKE), bare metal.
Pair with Coolify/Dokploy for PaaS experience.
One-click Coolify from Vultr Marketplace.
