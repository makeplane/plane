# Fly.io

## CLI
```bash
# Install (macOS/Linux)
curl -L https://fly.io/install.sh | sh
# Install (Windows)
pwsh -Command "iwr https://fly.io/install.ps1 -useb | iex"

fly auth login
fly launch       # first time — generates fly.toml
fly deploy       # deploy
```

## Config: fly.toml
```toml
app = "my-app"
primary_region = "sjc"

[build]

[http_service]
  internal_port = 3000
  force_https = true
  auto_stop_machines = "stop"
  auto_start_machines = true
  min_machines_running = 0

[[vm]]
  memory = "256mb"
  cpu_kind = "shared"
  cpus = 1
```

## Detection
- `fly.toml` in project root

## Free Tier
- No persistent free tier for new accounts
- One-time trial credit only
- Legacy Hobby: 3x shared VMs + 3GB volume

## Cost Optimize
- `auto_stop_machines = "stop"` + `min_machines_running = 0`
- Avoids idle charges for dev/staging

## Rollback
```bash
fly releases
fly deploy --image registry.fly.io/my-app:PREVIOUS_VERSION
```

## Best For
Dockerized apps, globally distributed apps, Elixir/Phoenix, managed Postgres
