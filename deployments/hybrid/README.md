# Hybrid deployment: Railway + dedicated VPS

Runs Nexus Operations (a fork of Plane) with the web frontend on Railway and everything else on a VPS, behind one public domain.

```
browser ── https ──▶ Railway edge ──▶ router ──▶ web (private network)
                                        │
                                        │ Tailscale (encrypted, outbound from both sides)
                                        ▼
                                  VPS: tailscale serve ──▶ gateway ──▶ api, live, admin, space, mcp, MinIO, agent-bridge
                                                                            │                              │
                                                                   Postgres, Valkey, RabbitMQ        agent-runner ──▶ internet, mcp
```

| Path                                                  | Runs on | Service          |
| ----------------------------------------------------- | ------- | ---------------- |
| everything else (`/`, app assets, client-side routes) | Railway | web              |
| `/api/*`, `/auth/*`, `/static/*`                      | VPS     | Django API       |
| `/live/*`                                             | VPS     | Live             |
| `/mcp`, `/mcp/*`                                      | VPS     | Plane MCP server |
| `/agents`, `/agents/*` (WebSocket included)           | VPS     | Agent bridge     |
| `/god-mode`, `/god-mode/*`                            | VPS     | Admin            |
| `/spaces`, `/spaces/*`                                | VPS     | Space            |
| `/uploads`, `/uploads/*`                              | VPS     | MinIO            |

The path list exists in `railway/router/Caddyfile` and `vps/Caddyfile`. Compare both with `apps/proxy/Caddyfile.ce` on every upgrade. Only the root `/agents` path goes to the bridge: the chat page itself, `/<workspace-slug>/agents`, is a client-side route of web. The API reserves these root paths as workspace slugs so that no workspace can collide with them. The gateway answers `/api/internal/*` with a 404, because only the bridge calls those endpoints, and it reaches the API directly.

## Production today

The production VPS does not run `vps/` yet. It runs a separately maintained stack, and the two differ in ways that matter:

- **Different compose project.** Production's is `nexus-plane`, so its data lives in volumes such as `nexus-plane_pgdata` and `nexus-plane_uploads`. Starting `vps/` on that server would create a second, empty set of `nexus-ops_*` volumes, and its gateway could not bind `127.0.0.1:8080`, which the live gateway already holds.
- **Different `.env`.** Production uses `NEXUS_RELEASE`, `WEB_URL`, `MINIO_ACCESS_KEY` and `MINIO_SECRET_KEY` where `vps/` uses `APP_RELEASE`, `IMAGE_REGISTRY` and the `AWS_*` names.
- **Different images.** Production builds the fork's images on the server and tags them `nexus/plane-*:<commit>`. `vps/` pulls them from `$IMAGE_REGISTRY`.

The datastores and the gateway run the same images in both, including the RabbitMQ setting in `vps/rabbitmq-nexus.conf`. Change them in both places together: Valkey and RabbitMQ cannot be downgraded over existing data, and `pg_restore` cannot read a dump from a newer Postgres major version.

Steps 2 to 4, Upgrades and Backups assume a server that runs `vps/`. Do not follow them on the production VPS. Moving production onto `vps/` means aligning these differences first, then migrating the data.

## Things worth knowing

- **The web app is a static bundle, not a Next.js server.** It is a Vite build served from a small web server container.
- **Railway pulls the web image and builds only the router.** Railway rejects Docker cache mounts unless their ID contains a literal service ID, and Plane's Dockerfiles use them, so `web` runs an image from `.github/workflows/build-hybrid.yml`. That workflow builds every image under one tag, which also keeps the frontend and backend on the same release. The router's Dockerfile has no cache mounts, so Railway builds it from source with `railway up` (step 5). The workflow also publishes a `plane-hybrid-router` image, but nothing deploys it.
- **The router runs Tailscale in userspace mode.** Railway containers have no tunnel device, so `tailscaled` runs alongside Caddy and Caddy reaches the VPS through its local SOCKS5 proxy. If either process stops, the container exits so Railway restarts it.
- **The gateway sets `Host`.** Plane signs upload URLs, builds OAuth callbacks and checks origins from the request's host, and MinIO verifies signatures against it. `vps/Caddyfile` always sends the public hostname to Django and MinIO.
- **The client IP travels in its own header.** Otherwise every user would appear to come from the tailnet proxy and share one rate-limit bucket, which allows 10 sign-in attempts per minute. The router copies Railway's `X-Real-IP` to `X-Plane-Client-IP`, and the gateway turns that into `X-Forwarded-For`.
- **The MCP server is built from `apps/mcp`,** the vendored Plane MCP server, under the same tag as the other images. Its entrypoint serves only the header-auth endpoint at `/mcp`. It calls Plane through `http://gateway`, so the gateway listens on port 80 inside the compose network.
- **The gateway trusts whatever reaches it,** so the tailnet policy is the access control. Step 3 limits the router to this one port, and the router's tag stops a compromised Railway container from reaching your other devices.
- **The agent runner is the sandbox.** The in-app agent chat runs agents that execute shell commands. See [Agent chat](#agent-chat) below.

## Before you start

You need:

- A **VPS** running Ubuntu LTS with 4 vCPU, 8 GB RAM and 100 GB NVMe, plus SSH access as root, joined to your tailnet.
- **Tailscale admin access**, to edit the policy file and create an OAuth client.
- A **Railway account**, in a project created for this deployment. Environments created after 16 October 2025 resolve private hostnames over both IPv4 and IPv6.
- **Off-server backup storage** that rclone supports, such as Cloudflare R2 or Backblaze B2.
- **SMTP credentials**, for invitations and notifications.

Below, `$RELEASE` is the image tag, `$APP_DOMAIN` is `operations.nexuslinkautomated.com`, and `$VPS_TAILNET_IP` is the VPS address from `tailscale ip -4`.

## 1. Build the images

The workflow must be on the default branch before it can be dispatched.

```bash
gh workflow run build-hybrid.yml -R Nexus-Link-Automated/nexus-operations --ref preview
```

This builds the head of `preview`, this fork's code, and tags every image with the first 9 characters of that commit's SHA, which becomes `$RELEASE`. The run summary shows the tag. To build another branch, tag or commit, add `-f ref=<ref>`; to choose the tag, add `-f tag=<tag>`. The ref is resolved to one commit before anything is built, so all images match even if the branch moves during the run. Do not build an upstream Plane tag such as `v1.4.3`: that is stock Plane, not this fork.

GitHub may create the packages as private. Set each one to public in the organization's package settings, then confirm that an anonymous pull works:

```bash
docker logout ghcr.io
docker pull ghcr.io/nexus-link-automated/plane-frontend:$RELEASE
```

## 2. Prepare the VPS

```bash
git clone https://github.com/Nexus-Link-Automated/nexus-operations.git /opt/nexus-operations
cd /opt/nexus-operations/deployments/hybrid/vps
./bootstrap.sh
./generate-env.sh --domain $APP_DOMAIN --release $RELEASE
```

`bootstrap.sh` installs Docker, allows only SSH inbound, enables automatic security updates, adds swap, schedules the daily backup and installs the agent network firewall (`agents-firewall.sh`, re-applied whenever Docker starts).

Set up the backup remote. It must be an rclone **crypt** remote, because backups contain `.env`; `backup.sh` refuses anything else.

```bash
mkdir -p rclone
docker run --rm -it -v "$PWD/rclone:/config/rclone" rclone/rclone:1.75.2 config
```

Create the storage remote first, then a crypt remote named `nexus-backup-crypt` wrapping it. **Keep the crypt passwords and a copy of `rclone.conf` outside this VPS**, for example in a password manager. Without them, the backups cannot be decrypted.

## 3. Configure Tailscale

Tailscale's default policy lets every device reach every other device, and that would include the Railway container. In the [access controls](https://login.tailscale.com/admin/acls), add a tag for the router and limit it to the gateway port:

```json
{
  "tagOwners": { "tag:nexus-router": ["autogroup:admin"] },
  "hosts": { "nexus-vps": "$VPS_TAILNET_IP" },
  "grants": [
    { "src": ["autogroup:member"], "dst": ["*"], "ip": ["*"] },
    { "src": ["tag:nexus-router"], "dst": ["nexus-vps"], "ip": ["tcp:8080"] }
  ]
}
```

Merge this with your existing policy, and remove any rule whose source is `*`, since that would also match the tagged router. The `autogroup:member` rule keeps your own devices connected as they are now.

Then, under Settings → OAuth clients, create a client with the `auth_keys` write scope and `tag:nexus-router`. Its secret becomes the router's `TS_AUTHKEY`. Use this instead of a normal auth key, because those expire after at most 90 days, and the next router restart after that would fail.

## 4. Start the VPS stack

```bash
docker compose pull
docker compose up -d
docker compose ps
```

`migrator` exits with status 0 when it finishes, and the API waits for it. `agent-bridge` and `agent-runner` start with the rest; no agent is available until you register one (see [Agent chat](#agent-chat)). The gateway listens on loopback only. Expose it to the tailnet:

```bash
tailscale serve --bg --tcp=8080 tcp://localhost:8080
curl http://$VPS_TAILNET_IP:8080/__gateway/health   # from another tailnet device
```

## 5. Deploy to Railway

```bash
railway login
railway init -n nexus-operations
railway add --service web --image $IMAGE_REGISTRY/plane-frontend:$RELEASE
railway add --service router \
  --variables "PORT=8080" \
  --variables "WEB_UPSTREAM=web.railway.internal:3000" \
  --variables "ORIGIN_ADDR=$VPS_TAILNET_IP:8080" \
  --variables "BUCKET_NAME=uploads" \
  --variables "TS_TAGS=tag:nexus-router" \
  --variables "TS_HOSTNAME=nexus-railway-router"
```

`$IMAGE_REGISTRY` must match the VPS, and `web` must run the same `$RELEASE` as the backend.

Set the Tailscale secret without putting it in your shell history. The `?preauthorized=true` suffix skips device approval:

```bash
railway variable set TS_AUTHKEY --service router --stdin   # paste: <secret>?preauthorized=true
```

Build and deploy the router from this directory:

```bash
railway up deployments/hybrid/railway/router --path-as-root --service router
```

Railway can build this Dockerfile because it uses no cache mounts. If the router cannot connect through the tailnet, see "If Railway blocks the tailnet" below.

In the Railway dashboard, set the router's healthcheck path to `/__router/health`. Do not give `web` a public domain: only the router should have one.

```bash
railway domain $APP_DOMAIN --service router --port 8080
railway domain status $APP_DOMAIN --service router
```

## 6. Point the domain at Railway

In **Google Cloud DNS**, add the CNAME and any verification record shown by `railway domain status`. Nothing else in the zone needs to change.

## 7. Verify

```bash
python3 deployments/hybrid/test/smoke.py --public-url https://$APP_DOMAIN
```

Before launch, while there is no real data, add `--write`. It creates the first instance admin on a new install with a random email and password, so **use the normal setup screen at `/god-mode/` first** if you want your own admin account. It also leaves behind a test user and workspace.

Then check the things a script cannot:

- Check that the VPS's public IP has no open ports other than SSH: `nmap -Pn <public-ip>` from a machine off the tailnet.
- From the router's tag, confirm that only the gateway port is reachable, and not your other devices.
- Check `tailscale status` for the router's connection. `direct` is ideal. `relay` works but adds latency and limits throughput, so test a large attachment.
- Configure SMTP under `/god-mode/` and send a real invitation.
- Open one work item in two browsers and confirm that edits appear live in both.
- Sign in from two different networks, and confirm that the API log's `remote_addr` shows each real address.
- Send a request with a forged `X-Real-IP` header and confirm that the log shows your real address, which shows Railway's edge overwrites it.
- Run `sudo reboot` on the VPS, then repeat the smoke test, and confirm that `iptables -S DOCKER-USER` still jumps to `NEXUS-AGENTS-FWD`.
- Check the agent sandbox from inside the runner (see [Agent chat](#agent-chat)).
- Register an agent in God mode, open `/<workspace-slug>/agents`, and chat with it: ask it to list work items, which goes through Plane MCP, and approve and deny a permission prompt.
- Run a backup and verify it, as described below.

## Upgrades

Back up first, because migrations run automatically and do not roll back.

1. Compare `apps/proxy/Caddyfile.ce` in the new release with the path lists here.
2. Check out the commit you are about to deploy and run the local test, which builds its images: `deployments/hybrid/test/run.sh`.
3. Build the images (step 1).
4. On the VPS, run `git pull` and `./generate-env.sh --add-missing`, which adds any secret the new release needs and never changes an existing one. Set `APP_RELEASE` in `.env`, then run `docker compose pull && docker compose up -d`. If `bootstrap.sh` changed, run it again.
5. In Railway, change the source image of `web` to the new tag. If `railway/router/` changed, redeploy the router with `railway up` (step 5).

Between steps 4 and 5 the frontend is one version behind the backend, so do them together and at a quiet time.

## Backups

`backup.sh` runs daily at about 02:30 UTC. Each backup holds the Postgres dump, the uploads bucket, the agents' working dirs (`agent_workspaces.tar.gz`) and `.env`. Check on it with `systemctl status nexus-ops-backup.timer` and `journalctl -u nexus-ops-backup`.

```bash
./backup.sh                     # run one now
./restore.sh list               # show available backups
./restore.sh verify <backup>    # restore into a throwaway database; touches nothing live
./restore.sh restore <backup>   # replaces live data; asks you to type the backup name
```

The database runs Postgres 18, the same major version as production, because `pg_restore` cannot read a dump made by a newer major version. `verify` uses whatever image `plane-db` has in `docker-compose.yml`, so change it there only.

`restore` stops every application service, including `agent-bridge` and `agent-runner`, then replaces the database, the uploads and the `agent_workspaces` volume. The workspaces are unpacked with their numeric owners and modes, because each one belongs to its own uid; the uid map in `.runner/uids.json` comes back with them. A backup made before the agent chat has no workspaces archive, and a restore of one leaves the volume as it is.

A restore does not apply the backed-up `.env`. If you are rebuilding on a new server, copy that `env` file into place as `.env` before starting the stack, or Plane cannot read its encrypted settings.

Nothing alerts you if a backup fails. Add monitoring, or run `verify` on a schedule you will notice.

## Testing locally

`test/run.sh` builds this checkout's images with the same Dockerfiles as `build-hybrid.yml` and tags them `nexus-hybrid-test/plane-*:<commit>`, adding `-dirty` if the checkout has uncommitted changes. It then starts the real topology with those images, the router and the MCP server, behind a local stand-in for the tailnet, and runs the smoke checks with `--write`.

```bash
deployments/hybrid/test/run.sh                     # build and test this checkout
APP_RELEASE=<tag> deployments/hybrid/test/run.sh   # test images build-hybrid.yml published
```

The first build takes a while and needs several GB of free memory. Later runs reuse Docker's build cache.

Besides the smoke checks, the test:

- Registers the echo test agent. The test override enables it with `AGENT_RUNNER_ENABLE_ECHO=true`; production never does.
- Chats with that agent through the router, gateway, bridge and runner, including a permission prompt.
- Checks that, from inside `agent-runner`, `api`, `gateway`, Postgres, Valkey, RabbitMQ, MinIO and live are unreachable, both by name and by IP address, while `mcp` and the internet are reachable.
- Checks that the chat's working dir belongs to its own uid with mode 700, and that no agent process outlives the chat.

A plain SOCKS5 proxy stands in for the tailnet. The test cannot exercise Railway's edge or a real Tailscale connection, so those are covered in step 7. It also does not install `agents-firewall.sh`, which changes the host's iptables, so check that on the VPS.

## Agent chat

Workspace members chat with agents at `/<workspace-slug>/agents`. The browser speaks the Agent Client Protocol (ACP) over a WebSocket to `wss://$APP_DOMAIN/agents/acp`.

Like the rest of this file, this describes a server that runs `vps/`. The production VPS runs its own stack (see [Production today](#production-today)), so the services, network, volume, secrets, firewall and `/agents` route below have to be added there too.

```
browser ──▶ router ──▶ gateway ──▶ agent-bridge ──▶ agent-runner ──▶ plane-acp-claude | -codex | -deepseek | -gemini
                                        │                                   │
                                        └─▶ api (cookie check, token)       └─▶ mcp (Plane data, as the user)
```

### Services, networks, volume

| Service        | Networks        | What it does                                                                                                                                                                                                                                                                                                                                                             |
| -------------- | --------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `agent-bridge` | `app`, `agents` | Policy proxy. It checks the session cookie with the API and the `Origin` header, mints a short-lived token scoped to the workspace for each chat, and relays ACP to the runner. It never runs agents. It also serves `/agents/connections/*`, the ChatGPT and Google account sign-ins of Workspace settings → AI providers, which the runner performs as the user's uid. |
| `agent-runner` | `agents` only   | Runs each agent as its own unprivileged uid, with a persistent working dir in the `agent_workspaces` volume.                                                                                                                                                                                                                                                             |
| `mcp`          | `app`, `agents` | Joins `agents` so that agents reach Plane at `http://mcp:8211/mcp`, with their session token.                                                                                                                                                                                                                                                                            |

The `agents` network has outbound internet but no route to `api`, `gateway`, Postgres, Valkey, RabbitMQ or MinIO. Its bridge interface has a fixed name, `br-nexus-agents` (`AGENTS_BRIDGE_NAME` in `.env`). `agents-firewall.sh` uses that name to also block the tailnet, private and link-local addresses (cloud metadata included) and the host itself. Without it, agents could reach your other tailnet devices as this VPS.

The volume `agent_workspaces` is mounted at `/workspaces`. It holds `<workspace_id>/<user_id>/`, the agent's working dir, which persists across sessions. It also holds each agent's `HOME` under `.homes/`, where agent CLIs keep their session history and members' ChatGPT and Google sign-ins (`.codex/`, `.gemini/`), and the uid map in `.runner/uids.json`. `backup.sh` includes all of it except `.tmp/`.

### Secrets and settings

All of these are in `.env`. `generate-env.sh` writes them, and `generate-env.sh --add-missing` adds them to an existing `.env`.

| Variable                                | Used by                    | Meaning                                                                                                                                      |
| --------------------------------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `AGENT_BRIDGE_SECRET`                   | api, agent-bridge          | The bridge sends it as `X-Agent-Bridge-Secret` to the internal agent-session endpoint. If it is empty, the API disables that endpoint.       |
| `AGENT_RUNNER_SECRET`                   | agent-bridge, agent-runner | Signs the bridge's single-use spawn tickets. 32 or more characters.                                                                          |
| `AGENT_SESSION_TOKEN_TTL_MINUTES`       | api                        | Lifetime of each chat's token (default 120). When it expires, the chat closes with 4410, and the browser reconnects and reloads the session. |
| `AGENT_RUNNER_CPUS`, `_MEMORY`, `_PIDS` | agent-runner               | Container limits shared by all running agents (defaults 2, `3g`, 1024).                                                                      |

The compose file sets the rest:

- `AGENT_WORKSPACES_ROOT=/workspaces` on both the bridge and the runner. They must match, because each computes the working dir from it.
- `AGENT_RUNNER_ISOLATION=uid`.
- `AGENT_RUNNER_ENABLE_ECHO=false`.
- `PLANE_MCP_URL=http://mcp:8211/mcp`, set on the api and the bridge.
- `CORS_ALLOWED_ORIGINS=https://$APP_DOMAIN`, set on the bridge.

The web image is built with `VITE_AGENT_BRIDGE_BASE_URL` empty, meaning the page's own origin, and with `VITE_AGENT_BRIDGE_BASE_PATH=/agents`. Keep it that way: the bridge authenticates with the browser's session cookie and refuses other origins, so the chat must stay on the same site as the app.

To rotate a secret, change it in `.env` and run `docker compose up -d`, which recreates every service that reads it. Open chats are dropped, and users reopen them.

### The runner is the sandbox

Agents get a full toolbox: shell, file edits, git, compilers, web access and Plane MCP. They run inside `agent-runner`, which needs to run as root to switch uids. It is limited in several ways:

- It holds only the capabilities that switching uids takes (`CHOWN`, `DAC_OVERRIDE`, `FOWNER`, `KILL`, `SETUID`, `SETGID`), and it runs with `no-new-privileges`.
- It has CPU, memory and pids limits.
- Each workspace and user pair gets its own uid, in the range 20000–59999. Its working dir, `HOME` and `TMPDIR` are mode 0700, and its environment is built from scratch, with only the agent's own settings and its session token.
- When a chat ends, its processes are killed and its token is revoked.

Agents in the same pair share a uid, so they can see each other's files, but they cannot see anyone else's. Agents do not get the host's or the other services' credentials. They can reach the public internet, so treat whatever you give an agent, including its API key and everything in its working dir, as something it could send elsewhere.

Check the sandbox after the first deploy and after changing the firewall. These run `bash`, `curl` and `iptables` from inside the runner or on the host:

```bash
docker compose exec agent-runner bash -c '</dev/tcp/api/8000'            # fails: unknown host
docker compose exec agent-runner bash -c '</dev/tcp/mcp/8211' && echo ok  # ok
docker compose exec agent-runner curl -sI https://example.com | head -1  # HTTP/2 200
docker compose exec agent-runner curl -m 5 http://169.254.169.254/       # refused (metadata)
docker compose exec agent-runner curl -m 5 http://<another tailnet device>:<port>/  # refused
sudo iptables -S NEXUS-AGENTS-FWD                                        # the rules
```

### Registering an agent

Agents are configured for the whole instance, by an instance admin:

1. Open `/god-mode/agents` and choose to add an agent.
2. Pick the adapter: Claude, Codex, Gemini or DeepSeek. Each maps to a fixed program in the runner, so an admin cannot enter an arbitrary command.
3. Fill in the credentials: `ANTHROPIC_API_KEY` for Claude, `OPENAI_API_KEY` for Codex, `GEMINI_API_KEY` for Gemini, or `DEEPSEEK_API_KEY` for DeepSeek (members and workspace admins can override the first three in Workspace settings → AI providers). Then fill in the model, the default and maximum permission levels (ask for everything, ask for writes, or never ask), and whether to attach Plane MCP.
4. Enable it. Every member of every workspace now sees it at `/<workspace-slug>/agents`.

Credentials are encrypted in the database with `SECRET_KEY`, never shown again, and passed only to that agent's process.

### Backing up and restoring agent workspaces

`backup.sh` archives the volume from inside the running `agent-runner`. It uses GNU tar with `--numeric-owner`, because every dir belongs to its own uid. Agents may be writing while the backup runs, so a file that changes during the backup is kept as it was read, not treated as an error. `restore.sh verify <backup>` lists the archive, and `restore.sh restore <backup>` replaces the volume while the runner is stopped (see [Backups](#backups)).

To restore only the agent workspaces, after downloading and checking a backup with `restore.sh verify`:

```bash
docker compose stop agent-bridge agent-runner
docker compose run --rm -T --no-deps --entrypoint sh agent-runner -c \
  'find /workspaces -mindepth 1 -delete && tar --numeric-owner -xpzf - -C /workspaces' <agent_workspaces.tar.gz
docker compose up -d agent-bridge agent-runner
```

## If Railway blocks the tailnet

Userspace Tailscale works from Railway: on 5 November 2026 the router joined the tailnet and got a TCP response from the VPS. In December 2024 a [Railway employee said](https://station.railway.com/questions/allowing-for-outgoing-requests-to-tailsc-0b83d33b) this was not possible and pointed to [railtail](https://github.com/half0wl/railtail) instead, so keep it in mind if Railway's runtime changes. If the router's backend routes fail while `tailscale up` succeeded, deploy railtail as its own Railway service with no public domain, in raw TCP mode:

```
TARGET_ADDR=$VPS_TAILNET_IP:8080
LISTEN_PORT=8080
TS_HOSTNAME=nexus-railtail
TS_AUTH_KEY=<a key tagged tag:nexus-router>
```

Then change the router so it reaches `railtail.railway.internal:8080` directly: set `ORIGIN_ADDR` to that address, remove the `network_proxy` line from its Caddyfile, and start Caddy without `tailscaled`. The router then needs no Tailscale key of its own.
