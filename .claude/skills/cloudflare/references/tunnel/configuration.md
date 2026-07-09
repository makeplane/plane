# Tunnel Configuration

## Config Source

Tunnels use one of two config sources:

| Config Source | Storage | Updates | Use Case |
|---------------|---------|---------|----------|
| Local | `config.yml` file | Edit file, restart | Dev, multi-env, version control |
| Cloudflare | Dashboard/API | Instant, no restart | Production, centralized management |

**Token-based tunnels** = config source: Cloudflare
**Locally-managed tunnels** = config source: local

## Config File Location

```
~/.cloudflared/config.yml          # User config
/etc/cloudflared/config.yml        # System-wide (Linux)
```

## Basic Structure

```yaml
tunnel: <UUID>
credentials-file: /path/to/<UUID>.json

ingress:
  - hostname: app.example.com
    service: http://localhost:8000
  - service: http_status:404  # Required catch-all
```

## Ingress Rules

Rules evaluated **top to bottom**, first match wins.

```yaml
ingress:
  # Exact hostname + path regex
  - hostname: static.example.com
    path: \.(jpg|png|css|js)$
    service: https://localhost:8001
  
  # Wildcard hostname
  - hostname: "*.example.com"
    service: https://localhost:8002
  
  # Path only (all hostnames)
  - path: /api/.*
    service: http://localhost:9000
  
  # Catch-all (required)
  - service: http_status:404
```

**Validation**:
```bash
cloudflared tunnel ingress validate
cloudflared tunnel ingress rule https://foo.example.com
```

## Service Types

| Protocol | Format | Client Requirement |
|----------|--------|-------------------|
| HTTP | `http://localhost:8000` | Browser |
| HTTPS | `https://localhost:8443` | Browser |
| TCP | `tcp://localhost:2222` | `cloudflared access tcp` |
| SSH | `ssh://localhost:22` | `cloudflared access ssh` |
| RDP | `rdp://localhost:3389` | `cloudflared access rdp` |
| Unix | `unix:/path/to/socket` | Browser |
| Test | `hello_world` | Browser |

## Origin Configuration

### Connection Settings
```yaml
originRequest:
  connectTimeout: 30s
  tlsTimeout: 10s
  tcpKeepAlive: 30s
  keepAliveTimeout: 90s
  keepAliveConnections: 100
```

### TLS Settings
```yaml
originRequest:
  noTLSVerify: true                      # Disable cert verification
  originServerName: "app.internal"       # Override SNI
  caPool: /path/to/ca.pem                # Custom CA
```

### HTTP Settings
```yaml
originRequest:
  disableChunkedEncoding: true
  httpHostHeader: "app.internal"
  http2Origin: true
```

## Private Network Mode

```yaml
tunnel: <UUID>
credentials-file: /path/to/creds.json

warp-routing:
  enabled: true
```

```bash
cloudflared tunnel route ip add 10.0.0.0/8 my-tunnel
cloudflared tunnel route ip add 192.168.1.100/32 my-tunnel
```

## Config Source Comparison

### Local Config
```yaml
# config.yml
tunnel: <UUID>
credentials-file: /path/to/<UUID>.json

ingress:
  - hostname: app.example.com
    service: http://localhost:8000
  - service: http_status:404
```

```bash
cloudflared tunnel run my-tunnel
```

**Pros:** Version control, multi-environment, offline edits
**Cons:** Requires file distribution, manual restarts

### Cloudflare Config (Token-Based)
```bash
# No config file needed
cloudflared tunnel --no-autoupdate run --token <TOKEN>
```

Configure routes in dashboard: **Zero Trust** > **Networks** > **Tunnels** > [Tunnel] > **Public Hostname**

**Pros:** Centralized updates, no file management, instant route changes
**Cons:** Requires dashboard/API access, less portable

## Environment Variables

```bash
TUNNEL_TOKEN=<token>                    # Token for config source: cloudflare
TUNNEL_ORIGIN_CERT=/path/to/cert.pem   # Override cert path (local config)
NO_AUTOUPDATE=true                      # Disable auto-updates
TUNNEL_LOGLEVEL=debug                   # Log level
```
