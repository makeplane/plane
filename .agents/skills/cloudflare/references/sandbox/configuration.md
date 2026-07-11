# Configuration

## getSandbox Options

```typescript
const sandbox = getSandbox(env.Sandbox, 'sandbox-id', {
  normalizeId: true,         // lowercase ID (required for preview URLs)
  sleepAfter: '10m',         // sleep after inactivity: '5m', '1h', '2d' (default: '10m')
  keepAlive: false,          // false = auto-timeout, true = never sleep
  
  containerTimeouts: {
    instanceGetTimeoutMS: 30000,  // 30s for provisioning (default: 30000)
    portReadyTimeoutMS: 90000     // 90s for container startup (default: 90000)
  }
});
```

**Sleep Config**:
- `sleepAfter`: Duration string (e.g., '5m', '10m', '1h') - default: '10m'
- `keepAlive: false`: Auto-sleep (default, cost-optimized)
- `keepAlive: true`: Never sleep (higher cost, requires explicit `destroy()`)
- Sleeping sandboxes wake automatically (cold start)

## Instance Types

wrangler.jsonc `instance_type`:
- `lite`: 256MB RAM, 0.5 vCPU (default)
- `standard`: 512MB RAM, 1 vCPU
- `heavy`: 1GB RAM, 2 vCPU

## Dockerfile Patterns

**Basic**:
```dockerfile
FROM docker.io/cloudflare/sandbox:0.7.0
RUN pip3 install --no-cache-dir pandas numpy
EXPOSE 8080  # Required for wrangler dev
```

**Scientific**:
```dockerfile
FROM docker.io/cloudflare/sandbox:0.7.0
RUN pip3 install --no-cache-dir \
    jupyter-server ipykernel matplotlib \
    pandas seaborn plotly scipy scikit-learn
```

**Node.js**:
```dockerfile
FROM docker.io/cloudflare/sandbox:0.7.0
RUN npm install -g typescript ts-node
```

**CRITICAL**: `EXPOSE` required for `wrangler dev` port access. Production auto-exposes all ports.

## CLI Commands

```bash
# Dev
wrangler dev                    # Start local dev server
wrangler deploy                 # Deploy to production
wrangler tail                   # Monitor logs
wrangler containers list        # Check container status
wrangler secret put KEY         # Set secret
```

## Environment & Secrets

**wrangler.jsonc**:
```jsonc
{
  "vars": {
    "ENVIRONMENT": "production",
    "API_URL": "https://api.example.com"
  },
  "r2_buckets": [{
    "binding": "DATA_BUCKET",
    "bucket_name": "my-data-bucket"
  }]
}
```

**Usage**:
```typescript
const token = env.GITHUB_TOKEN;  // From wrangler secret
await sandbox.exec('git clone ...', {
  env: { GIT_TOKEN: token }
});
```

## Preview URL Setup

**Prerequisites**:
- Custom domain with wildcard DNS: `*.yourdomain.com → worker.yourdomain.com`
- `.workers.dev` domains NOT supported
- `normalizeId: true` in getSandbox
- `proxyToSandbox()` called first in fetch handler

## Cron Triggers (Pre-warming)

```jsonc
{
  "triggers": {
    "crons": ["*/5 * * * *"]  // Every 5 minutes
  }
}
```

```typescript
export default {
  async scheduled(event: ScheduledEvent, env: Env) {
    const sandbox = getSandbox(env.Sandbox, 'main');
    await sandbox.exec('echo "keepalive"');  // Wake sandbox
  }
};
```

## Logging Configuration

**wrangler.jsonc**:
```jsonc
{
  "vars": {
    "SANDBOX_LOG_LEVEL": "debug",  // debug | info | warn | error (default: info)
    "SANDBOX_LOG_FORMAT": "pretty" // json | pretty (default: json)
  }
}
```

**Dev**: `debug` + `pretty`. **Production**: `info`/`warn` + `json`.

## Timeout Environment Overrides

Override default timeouts via environment variables:

```jsonc
{
  "vars": {
    "SANDBOX_INSTANCE_TIMEOUT_MS": "60000",  // Override instanceGetTimeoutMS
    "SANDBOX_PORT_TIMEOUT_MS": "120000"      // Override portReadyTimeoutMS
  }
}
```
