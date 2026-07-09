# Tunnel Patterns

## Docker Deployment

### Token-Based (Recommended)
```yaml
services:
  cloudflared:
    image: cloudflare/cloudflared:latest
    command: tunnel --no-autoupdate run --token ${TUNNEL_TOKEN}
    restart: unless-stopped
```

### Local Config
```yaml
services:
  cloudflared:
    image: cloudflare/cloudflared:latest
    volumes:
      - ./config.yml:/etc/cloudflared/config.yml:ro
      - ./credentials.json:/etc/cloudflared/credentials.json:ro
    command: tunnel run
```

## Kubernetes Deployment

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: cloudflared
spec:
  replicas: 2
  selector:
    matchLabels:
      app: cloudflared
  template:
    metadata:
      labels:
        app: cloudflared
    spec:
      containers:
      - name: cloudflared
        image: cloudflare/cloudflared:latest
        args:
        - tunnel
        - --no-autoupdate
        - run
        - --token
        - $(TUNNEL_TOKEN)
        env:
        - name: TUNNEL_TOKEN
          valueFrom:
            secretKeyRef:
              name: tunnel-credentials
              key: token
```

## High Availability

```yaml
# Same config on multiple servers
tunnel: <UUID>
credentials-file: /path/to/creds.json

ingress:
  - hostname: app.example.com
    service: http://localhost:8000
  - service: http_status:404
```

Run same config on multiple machines. Cloudflare automatically load balances. Long-lived connections (WebSocket, SSH) may drop during updates.

## Use Cases

### Web Application
```yaml
ingress:
  - hostname: myapp.example.com
    service: http://localhost:3000
  - service: http_status:404
```

### SSH Access
```yaml
ingress:
  - hostname: ssh.example.com
    service: ssh://localhost:22
  - service: http_status:404
```

Client: `cloudflared access ssh --hostname ssh.example.com`

### gRPC Service
```yaml
ingress:
  - hostname: grpc.example.com
    service: http://localhost:50051
    originRequest:
      http2Origin: true
  - service: http_status:404
```

## Infrastructure as Code

### Terraform

```hcl
resource "random_id" "tunnel_secret" {
  byte_length = 32
}

resource "cloudflare_tunnel" "app" {
  account_id = var.cloudflare_account_id
  name       = "app-tunnel"
  secret     = random_id.tunnel_secret.b64_std
}

resource "cloudflare_tunnel_config" "app" {
  account_id = var.cloudflare_account_id
  tunnel_id  = cloudflare_tunnel.app.id
  config {
    ingress_rule {
      hostname = "app.example.com"
      service  = "http://localhost:8000"
    }
    ingress_rule { service = "http_status:404" }
  }
}

resource "cloudflare_record" "app" {
  zone_id = var.cloudflare_zone_id
  name    = "app"
  value   = cloudflare_tunnel.app.cname
  type    = "CNAME"
  proxied = true
}

output "tunnel_token" {
  value     = cloudflare_tunnel.app.tunnel_token
  sensitive = true
}
```

### Pulumi

```typescript
import * as cloudflare from "@pulumi/cloudflare";
import * as random from "@pulumi/random";

const secret = new random.RandomId("secret", { byteLength: 32 });

const tunnel = new cloudflare.ZeroTrustTunnelCloudflared("tunnel", {
  accountId: accountId,
  name: "app-tunnel",
  secret: secret.b64Std,
});

const config = new cloudflare.ZeroTrustTunnelCloudflaredConfig("config", {
  accountId: accountId,
  tunnelId: tunnel.id,
  config: {
    ingressRules: [
      { hostname: "app.example.com", service: "http://localhost:8000" },
      { service: "http_status:404" },
    ],
  },
});

new cloudflare.Record("dns", {
  zoneId: zoneId,
  name: "app",
  value: tunnel.cname,
  type: "CNAME",
  proxied: true,
});
```

## Service Installation

### Linux systemd
```bash
cloudflared service install
systemctl start cloudflared && systemctl enable cloudflared
journalctl -u cloudflared -f  # Logs
```

### macOS launchd
```bash
sudo cloudflared service install
sudo launchctl start com.cloudflare.cloudflared
```
