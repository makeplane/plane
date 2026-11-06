# Hybrid deployment: Railway + dedicated VPS

Runs Nexus Operations (a fork of Plane) with the web frontend on Railway and everything else on a VPS, behind one public domain.

```
browser ── https ──▶ Railway edge ──▶ router ──▶ web (private network)
                                        │
                                        │ Tailscale (encrypted, outbound from both sides)
                                        ▼
                                  VPS: tailscale serve ──▶ gateway ──▶ api, live, admin, space, mcp, MinIO
                                                                            │
                                                                   Postgres, Valkey, RabbitMQ
```

| Path                                                          | Runs on | Service         |
| ------------------------------------------------------------- | ------- | --------------- |
| everything else (`/`, app assets, client-side routes)         | Railway | web             |
| `/api/*`, `/auth/*`, `/static/*`                              | VPS     | Django API      |
| `/live/*`                                                     | VPS     | Live            |
| `/mcp`, `/mcp/*`                                              | VPS     | Plane MCP server |
| `/god-mode`, `/god-mode/*`                                    | VPS     | Admin           |
| `/spaces`, `/spaces/*`                                        | VPS     | Space           |
| `/uploads`, `/uploads/*`                                      | VPS     | MinIO           |

The path list exists in `railway/router/Caddyfile` and `vps/Caddyfile`. Compare both with `apps/proxy/Caddyfile.ce` on every upgrade.

## Production today

The production VPS does not run `vps/` yet. It runs a separately maintained stack, and the two differ in ways that matter:

- **Different compose project.** Production's is `nexus-plane`, so its data lives in volumes such as `nexus-plane_pgdata` and `nexus-plane_uploads`. Starting `vps/` on that server would create a second, empty set of `nexus-ops_*` volumes, and its gateway could not bind `127.0.0.1:8080`, which the live gateway already holds.
- **Different `.env`.** Production uses `NEXUS_RELEASE`, `WEB_URL`, `MINIO_ACCESS_KEY` and `MINIO_SECRET_KEY` where `vps/` uses `APP_RELEASE`, `IMAGE_REGISTRY` and the `AWS_*` names.
- **Different images.** Production builds the fork's images on the server and tags them `nexus/plane-*:<commit>`. `vps/` pulls them from `$IMAGE_REGISTRY`.

The datastores and the gateway run the same images in both, including the RabbitMQ setting in `vps/rabbitmq-nexus.conf`. Change them in both places together: Valkey and RabbitMQ cannot be downgraded over existing data, and `pg_restore` cannot read a dump from a newer Postgres major version.

Steps 2 to 4, Upgrades and Backups assume a server that runs `vps/`. Do not follow them on the production VPS. Moving production onto `vps/` means aligning these differences first, then migrating the data.

## Things worth knowing

- **The web app is a static bundle, not a Next.js server.** It is a Vite build served from a small web server container.
- **Railway pulls images and does not build them.** Railway rejects Docker cache mounts unless their ID contains a literal service ID, and Plane's Dockerfiles use them. `.github/workflows/build-hybrid.yml` builds every image under one tag, which also keeps the frontend and backend on the same release.
- **The router runs Tailscale in userspace mode.** Railway containers have no tunnel device, so `tailscaled` runs alongside Caddy and Caddy reaches the VPS through its local SOCKS5 proxy. If either process stops, the container exits so Railway restarts it.
- **The gateway sets `Host`.** Plane signs upload URLs, builds OAuth callbacks and checks origins from the request's host, and MinIO verifies signatures against it. `vps/Caddyfile` always sends the public hostname to Django and MinIO.
- **The client IP travels in its own header.** Otherwise every user would appear to come from the tailnet proxy and share one rate-limit bucket, which allows 10 sign-in attempts per minute. The router copies Railway's `X-Real-IP` to `X-Plane-Client-IP`, and the gateway turns that into `X-Forwarded-For`.
- **The MCP server is built from upstream's repository at a pinned commit,** not from this one. `vps/mcp/serve_header.py` replaces its entrypoint so it serves only the header-auth endpoint at `/mcp`. It calls Plane through `http://gateway`, so the gateway listens on port 80 inside the compose network.
- **The gateway trusts whatever reaches it,** so the tailnet policy is the access control. Step 3 limits the router to this one port, and the router's tag stops a compromised Railway container from reaching your other devices.

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

`bootstrap.sh` installs Docker, allows only SSH inbound, enables automatic security updates, adds swap and schedules the daily backup.

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
docker compose pull --ignore-buildable
docker compose build mcp
docker compose up -d
docker compose ps
```

`migrator` exits with status 0 when it finishes, and the API waits for it. The gateway listens on loopback only. Expose it to the tailnet:

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
- Run `sudo reboot` on the VPS, then repeat the smoke test.
- Run a backup and verify it, as described below.

## Upgrades

Back up first, because migrations run automatically and do not roll back.

1. Compare `apps/proxy/Caddyfile.ce` in the new release with the path lists here.
2. Check out the commit you are about to deploy and run the local test, which builds its images: `deployments/hybrid/test/run.sh`.
3. Build the images (step 1).
4. On the VPS, set `APP_RELEASE` in `.env`, then run `docker compose pull --ignore-buildable && docker compose up -d`.
5. In Railway, change the source image of `web` and `router` to the new tag.

Between steps 4 and 5 the frontend is one version behind the backend, so do them together and at a quiet time.

## Backups

`backup.sh` runs daily at about 02:30 UTC. Check on it with `systemctl status nexus-ops-backup.timer` and `journalctl -u nexus-ops-backup`.

```bash
./backup.sh                     # run one now
./restore.sh list               # show available backups
./restore.sh verify <backup>    # restore into a throwaway database; touches nothing live
./restore.sh restore <backup>   # replaces live data; asks you to type the backup name
```

The database runs Postgres 18, the same major version as production, because `pg_restore` cannot read a dump made by a newer major version. `verify` uses whatever image `plane-db` has in `docker-compose.yml`, so change it there only.

A restore does not apply the backed-up `.env`. If you are rebuilding on a new server, copy that `env` file into place as `.env` before starting the stack, or Plane cannot read its encrypted settings.

Nothing alerts you if a backup fails. Add monitoring, or run `verify` on a schedule you will notice.

## Testing locally

`test/run.sh` builds this checkout's images with the same Dockerfiles as `build-hybrid.yml` and tags them `nexus-hybrid-test/plane-*:<commit>`, adding `-dirty` if the checkout has uncommitted changes. It then starts the real topology with those images, the router and the MCP server, behind a local stand-in for the tailnet, and runs the smoke checks with `--write`.

```bash
deployments/hybrid/test/run.sh                     # build and test this checkout
APP_RELEASE=<tag> deployments/hybrid/test/run.sh   # test images build-hybrid.yml published
```

The first build takes a while and needs several GB of free memory. Later runs reuse Docker's build cache.

A plain SOCKS5 proxy stands in for the tailnet. The test cannot exercise Railway's edge or a real Tailscale connection, so those are covered in step 7.

## If Railway blocks the tailnet

Userspace Tailscale works from Railway: on 5 November 2026 the router joined the tailnet and got a TCP response from the VPS. In December 2024 a [Railway employee said](https://station.railway.com/questions/allowing-for-outgoing-requests-to-tailsc-0b83d33b) this was not possible and pointed to [railtail](https://github.com/half0wl/railtail) instead, so keep it in mind if Railway's runtime changes. If the router's backend routes fail while `tailscale up` succeeded, deploy railtail as its own Railway service with no public domain, in raw TCP mode:

```
TARGET_ADDR=$VPS_TAILNET_IP:8080
LISTEN_PORT=8080
TS_HOSTNAME=nexus-railtail
TS_AUTH_KEY=<a key tagged tag:nexus-router>
```

Then change the router so it reaches `railtail.railway.internal:8080` directly: set `ORIGIN_ADDR` to that address, remove the `network_proxy` line from its Caddyfile, and start Caddy without `tailscaled`. The router then needs no Tailscale key of its own.
