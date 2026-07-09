# Cloudflare Tunnel

Secure outbound-only connections between infrastructure and Cloudflare's global network.

## Overview

Cloudflare Tunnel (formerly Argo Tunnel) enables:
- **Outbound-only connections** - No inbound ports or firewall changes
- **Public hostname routing** - Expose local services to internet
- **Private network access** - Connect internal networks via WARP
- **Zero Trust integration** - Built-in access policies

**Architecture**: Tunnel (persistent object) → Replica (`cloudflared` process) → Origin services

**Terminology:**
- **Tunnel**: Named persistent object with UUID
- **Replica**: Individual `cloudflared` process connected to tunnel
- **Config Source**: Where ingress rules stored (local file vs Cloudflare dashboard)
- **Connector**: Legacy term for replica

## Quick Start

### Local Config
```bash
# Install cloudflared
brew install cloudflared  # macOS

# Authenticate
cloudflared tunnel login

# Create tunnel
cloudflared tunnel create my-tunnel

# Route DNS
cloudflared tunnel route dns my-tunnel app.example.com

# Run tunnel
cloudflared tunnel run my-tunnel
```

### Dashboard Config (Recommended)
1. **Zero Trust** > **Networks** > **Tunnels** > **Create**
2. Name tunnel, copy token
3. Configure routes in dashboard
4. Run: `cloudflared tunnel --no-autoupdate run --token <TOKEN>`

## Decision Tree

**Choose config source:**
```
Need centralized config updates?
├─ Yes → Token-based (dashboard config)
└─ No → Local config file

Multiple environments (dev/staging/prod)?
├─ Yes → Local config (version controlled)
└─ No → Either works

Need firewall approval?
└─ See networking.md first
```

## Core Commands

```bash
# Tunnel lifecycle
cloudflared tunnel create <name>
cloudflared tunnel list
cloudflared tunnel info <name>
cloudflared tunnel delete <name>

# DNS routing
cloudflared tunnel route dns <tunnel> <hostname>
cloudflared tunnel route list

# Private network
cloudflared tunnel route ip add 10.0.0.0/8 <tunnel>

# Run tunnel
cloudflared tunnel run <name>
```

## Configuration Example

```yaml
# ~/.cloudflared/config.yml
tunnel: 6ff42ae2-765d-4adf-8112-31c55c1551ef
credentials-file: /root/.cloudflared/6ff42ae2-765d-4adf-8112-31c55c1551ef.json

ingress:
  - hostname: app.example.com
    service: http://localhost:8000
  - hostname: api.example.com
    service: https://localhost:8443
    originRequest:
      noTLSVerify: true
  - service: http_status:404
```

## Reading Order

**New to Cloudflare Tunnel:**
1. This README (overview, quick start)
2. [networking.md](./networking.md) - Firewall rules, connectivity pre-checks
3. [configuration.md](./configuration.md) - Config file options, ingress rules
4. [patterns.md](./patterns.md) - Docker, Kubernetes, production deployment
5. [gotchas.md](./gotchas.md) - Troubleshooting, best practices

**Enterprise deployment:**
1. [networking.md](./networking.md) - Corporate firewall requirements
2. [gotchas.md](./gotchas.md) - HA setup, security best practices
3. [patterns.md](./patterns.md) - Kubernetes, rolling updates

**Programmatic control:**
1. [api.md](./api.md) - REST API, TypeScript SDK

## In This Reference

- [networking.md](./networking.md) - Firewall rules, ports, connectivity pre-checks
- [configuration.md](./configuration.md) - Config file options, ingress rules, TLS settings
- [api.md](./api.md) - REST API, TypeScript SDK, token-based tunnels
- [patterns.md](./patterns.md) - Docker, Kubernetes, Terraform, HA, use cases
- [gotchas.md](./gotchas.md) - Troubleshooting, limitations, best practices

## See Also

- [workers](../workers/) - Workers with Tunnel integration
- [access](../access/) - Zero Trust access policies
- [warp](../warp/) - WARP client for private networks
