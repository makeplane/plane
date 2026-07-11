# Tunnel Networking

## Connectivity Requirements

### Outbound Ports

Cloudflared requires outbound access on:

| Port | Protocol | Purpose | Required |
|------|----------|---------|----------|
| 7844 | TCP/UDP | Primary tunnel protocol (QUIC) | Yes |
| 443 | TCP | Fallback (HTTP/2) | Yes |

**Network path:**
```
cloudflared → edge.argotunnel.com:7844 (preferred)
cloudflared → region.argotunnel.com:443 (fallback)
```

### Firewall Rules

#### Minimal (Production)
```bash
# Outbound only
ALLOW tcp/udp 7844 to *.argotunnel.com
ALLOW tcp 443 to *.argotunnel.com
```

#### Full (Recommended)
```bash
# Tunnel connectivity
ALLOW tcp/udp 7844 to *.argotunnel.com
ALLOW tcp 443 to *.argotunnel.com

# API access (for token-based tunnels)
ALLOW tcp 443 to api.cloudflare.com

# Updates (optional)
ALLOW tcp 443 to github.com
ALLOW tcp 443 to objects.githubusercontent.com
```

### IP Ranges

Cloudflare Anycast IPs (tunnel endpoints):
```
# IPv4
198.41.192.0/24
198.41.200.0/24

# IPv6
2606:4700::/32
```

**Note:** Use DNS resolution for `*.argotunnel.com` rather than hardcoding IPs. Cloudflare may add edge locations.

## Pre-Flight Check

Test connectivity before deploying:

```bash
# Test DNS resolution
dig edge.argotunnel.com +short

# Test port 7844 (QUIC/UDP)
nc -zvu edge.argotunnel.com 7844

# Test port 443 (HTTP/2 fallback)
nc -zv edge.argotunnel.com 443

# Test with cloudflared
cloudflared tunnel --loglevel debug run my-tunnel
# Look for "Registered tunnel connection"
```

### Common Connectivity Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "no such host" | DNS blocked | Allow port 53 UDP/TCP |
| "context deadline exceeded" | Port 7844 blocked | Allow UDP/TCP 7844 |
| "TLS handshake timeout" | Port 443 blocked | Allow TCP 443, disable SSL inspection |

## Protocol Selection

Cloudflared automatically selects protocol:

| Protocol | Port | Priority | Use Case |
|----------|------|----------|----------|
| QUIC | 7844 UDP | 1st (preferred) | Low latency, best performance |
| HTTP/2 | 443 TCP | 2nd (fallback) | QUIC blocked by firewall |

**Force HTTP/2 fallback:**
```bash
cloudflared tunnel --protocol http2 run my-tunnel
```

**Verify active protocol:**
```bash
cloudflared tunnel info my-tunnel
# Shows "connections" with protocol type
```

## Private Network Routing

### WARP Client Requirements

Users accessing private IPs via WARP need:

```bash
# Outbound (WARP client)
ALLOW udp 500,4500 to 162.159.*.* (IPsec)
ALLOW udp 2408 to 162.159.*.* (WireGuard)
ALLOW tcp 443 to *.cloudflareclient.com
```

### Split Tunnel Configuration

Route only private networks through tunnel:

```yaml
# warp-routing config
warp-routing:
  enabled: true
```

```bash
# Add specific routes
cloudflared tunnel route ip add 10.0.0.0/8 my-tunnel
cloudflared tunnel route ip add 172.16.0.0/12 my-tunnel
cloudflared tunnel route ip add 192.168.0.0/16 my-tunnel
```

WARP users can access these IPs without VPN.

## Network Diagnostics

### Connection Diagnostics

```bash
# Check edge selection and connection health
cloudflared tunnel info my-tunnel --output json | jq '.connections[]'

# Enable metrics endpoint
cloudflared tunnel --metrics localhost:9090 run my-tunnel
curl localhost:9090/metrics | grep cloudflared_tunnel

# Test latency
curl -w "time_total: %{time_total}\n" -o /dev/null https://myapp.example.com
```

## Corporate Network Considerations

Cloudflared honors proxy environment variables (`HTTP_PROXY`, `HTTPS_PROXY`, `NO_PROXY`).

If corporate proxy intercepts TLS, add corporate root CA to system trust store.

## Bandwidth and Rate Limits

| Limit | Value | Notes |
|-------|-------|-------|
| Request size | 100 MB | Single HTTP request |
| Upload speed | No hard limit | Governed by network/plan |
| Concurrent connections | 1000 per tunnel | Across all replicas |
| Requests per second | No limit | Subject to DDoS detection |

**Large file transfers:**
Use R2 or Workers with chunked uploads instead of streaming through tunnel.
