# Migrate Plane Deployment from `/` to `/u01`

> Host: `VN-SHWSAP#1-TEST` (`shwsap1t`) — UAT, **RHEL 9**
> Target: relocate Plane stack + Docker data off the near-full root volume onto the underused `/u01` LV.

## Blast Radius (verified)

- **Named volumes ride along with `data-root`.** `pgdata`, `uploads` (MinIO), `redisdata`, `rabbitmq_data`, `proxy_config`, `proxy_data`, `logs_*` all live under `/var/lib/docker/volumes/` → move with the `data-root` rsync. No per-volume work.
- **Only ONE host-path bind mount references the moved tree:** `proxy.volumes` in `docker-compose.yaml`:
  - `/opt/shb-deploy/plane-app/proxy/Caddyfile:/etc/caddy/Caddyfile:ro` — symlink resolves transparently; update the path in Step 3.
- **`/opt/certs:/etc/caddy/certs:ro` is NOT moving** — stays on `/`. No edit.
- **Caddyfile contains zero host paths** — only container DNS (`api:8000`, `plane-minio:9000`). Reverse-proxy routing is unaffected.
- **`pgadmin` binds host port `5678`** (no Caddy route). SELinux may block — see Step 0.

## Disk Reality Check

> Note: user said "/home almost full" — actual constrained FS is `/` (vg00-root). `/home` is 2% used.

| Mount   | LV        | Size  | Used  | Free  | Use%            |
| ------- | --------- | ----- | ----- | ----- | --------------- |
| `/`     | vg00-root | 40 G  | 30 G  | 11 G  | **73%** ← hot   |
| `/home` | vg00-home | 40 G  | 482 M | 40 G  | 2%              |
| `/u01`  | vg01-u01  | 100 G | 746 M | 100 G | **1%** ← target |
| `/boot` | sda2      | 960 M | 356 M | 605 M | 38%             |

Pain on `/`: `/opt/shb-deploy/plane-app` (images tar ~ multi-GB, dist tarballs, archive) + `/var/lib/docker` (overlayfs layers, container volumes — bind-mount data, postgres, minio).

## AS-IS

```
/  (vg00-root, 40G, 73% used)
├── /opt/shb-deploy/plane-app/
│   ├── dist/                  # 6 image tarballs v1.2.0
│   ├── plane-images.tar       # bundled images
│   ├── archive/               # old releases
│   ├── docker-compose.yaml
│   ├── docker-compose.shb.yml
│   ├── plane.env
│   ├── proxy/Caddyfile
│   └── scripts/
├── /var/lib/docker/           # default Docker root (overlayfs + volumes)
│   ├── overlay2/              # image/layer storage
│   └── volumes/               # named volumes: pgdata, minio, redis, rabbitmq…
└── /opt/certs/                # TLS chain + key

/u01  (vg01-u01, 100G, 1% used)  ← empty, target
```

Containers (per `docker-compose.shb.yml` + Caddyfile): `web`, `space`, `admin`, `live`, `api` (Django/DRF on :8000), `worker`, `beat`, `plane-minio`, `plane-db` (Postgres), `plane-redis`, `plane-mq` (RabbitMQ), `proxy` (Caddy). Caddy terminates TLS at `uat-jms.shinhan.com.vn` using `/etc/caddy/certs/STAR.shinhan.com.vn.*`.

Risks if left as-is:

- `/` will hit 100% at next release (more dist tarballs + image layers) → Docker daemon, journald, Postgres WAL may fail to write.
- No headroom for `docker pull` / `docker load` during upgrade.

## TO-BE — Staged

**Stage 1 (NOW): volumes-only bind-mount.** Keep Docker installed at `/var/lib/docker`. Move only `/var/lib/docker/volumes` to `/u01`. Lowest blast radius, no `daemon.json` change, no app path edits. Buys headroom for persistent data (Postgres, MinIO, RabbitMQ, Redis).

**Stage 2 (LATER, only if `/` still pressured): full move.** Move `data-root` and app dir to `/u01`. Required if `overlay2` (image layers) or release tarballs continue eating `/`.

```
Stage 1 layout
/var/lib/docker/             ← stays on / (overlay2, containers, image meta)
└── volumes/   ← bind-mounted FROM /u01/docker-volumes

/u01/
└── docker-volumes/   ← actual volume data lives here
    ├── pgdata/
    ├── uploads/
    ├── redisdata/
    ├── rabbitmq_data/
    ├── proxy_config/  proxy_data/
    └── logs_*/

/opt/shb-deploy/plane-app    ← stays on /, no changes
/opt/certs/                  ← stays on /
```

Result Stage 1: persistent volume growth absorbed by `/u01`. `/` pressure on `overlay2` and `dist/` unchanged — re-measure after a release cycle to decide if Stage 2 is needed.

---

## Stage 1 — Volumes-Only Bind-Mount (CURRENT)

Move only `/var/lib/docker/volumes` to `/u01`. Docker stays installed at `/var/lib/docker`. No `daemon.json` edit. No `docker-compose.yaml` edit. No app dir move.

### 1.0 Pre-flight (no downtime)

```bash
# audit + verify Docker runtime
du -sh /var/lib/docker/{overlay2,volumes,containers,image} 2>/dev/null | sort -h
du -sh /opt/shb-deploy/plane-app/{dist,archive,plane-images.tar} 2>/dev/null
docker system df
docker info | grep -E 'Server Version|Docker Root Dir|Storage Driver'
docker volume ls

# RHEL 9: SELinux + tooling
getenforce                                  # expect Enforcing
rpm -q policycoreutils-python-utils || dnf install -y policycoreutils-python-utils

# snapshot config + Postgres logical backup
mkdir -p /u01/backup/$(date +%F)
cp -a /opt/shb-deploy/plane-app/{plane.env,docker-compose.yaml,docker-compose.shb.yml,proxy} \
      /u01/backup/$(date +%F)/
docker exec plane-db pg_dumpall -U plane > /u01/backup/$(date +%F)/pg_dumpall.sql \
  || docker exec plane-db pg_dump -U plane plane > /u01/backup/$(date +%F)/plane.sql
```

### 1.1 Stop the stack + daemon

```bash
cd /opt/shb-deploy/plane-app
docker compose -f docker-compose.yaml -f docker-compose.shb.yml down   # NOT down -v
systemctl stop docker docker.socket
```

### 1.2 Move volume data to `/u01`

```bash
mkdir -p /u01/docker-volumes
rsync -aHAX --info=progress2 /var/lib/docker/volumes/ /u01/docker-volumes/
mv /var/lib/docker/volumes /var/lib/docker/volumes.old
mkdir -p /var/lib/docker/volumes        # recreate empty mount point

# RHEL 9: durable SELinux label equivalence (survives autorelabel)
semanage fcontext -a -e /var/lib/docker/volumes /u01/docker-volumes
restorecon -RF /u01/docker-volumes
```

### 1.3 Persistent bind mount via fstab

```bash
echo '/u01/docker-volumes  /var/lib/docker/volumes  none  bind,x-systemd.requires-mounts-for=/u01  0 0' \
  >> /etc/fstab
systemctl daemon-reload
mount -a
mountpoint /var/lib/docker/volumes      # expect: is a mountpoint
ls /var/lib/docker/volumes | head       # expect pgdata, uploads, redisdata, rabbitmq_data, …
```

### 1.4 Start daemon + stack

```bash
systemctl start docker
docker info | grep 'Docker Root Dir'         # expect /var/lib/docker (unchanged)
docker volume ls | grep -E 'pgdata|uploads|rabbitmq'

cd /opt/shb-deploy/plane-app
docker compose -f docker-compose.yaml -f docker-compose.shb.yml up -d
docker compose ps
docker compose logs --tail=100 api web proxy plane-db plane-minio
```

### 1.5 Smoke test

```bash
curl -kI https://uat-jms.shinhan.com.vn/
curl -kI https://uat-jms.shinhan.com.vn/api/v1/
curl -kI https://uat-jms.shinhan.com.vn/live/
curl -kI https://uat-jms.shinhan.com.vn/space
curl -kI https://uat-jms.shinhan.com.vn/god-mode

ss -lntp | grep -E ':80|:443|:5678'
du -sb /var/lib/docker/volumes.old /u01/docker-volumes   # byte counts match

# pgadmin port hint (only if it fails to bind)
semanage port -a -t http_port_t -p tcp 5678 2>/dev/null || true
firewall-cmd --list-all
```

Functional smoke: log in → open a project → **upload an attachment** (validates MinIO + Postgres + Caddy `/uploads` end-to-end).

### 1.6 Cleanup (after 24–72 h soak)

```bash
rm -rf /var/lib/docker/volumes.old
df -h / /u01
```

### 1.7 Rollback (within window)

```bash
cd /opt/shb-deploy/plane-app
docker compose -f docker-compose.yaml -f docker-compose.shb.yml down
systemctl stop docker docker.socket
umount /var/lib/docker/volumes
sed -i '\|/u01/docker-volumes|d' /etc/fstab
rmdir /var/lib/docker/volumes
mv /var/lib/docker/volumes.old /var/lib/docker/volumes
systemctl start docker
docker compose -f docker-compose.yaml -f docker-compose.shb.yml up -d
```

### Estimated downtime — Stage 1

App stop → rsync (mostly Postgres + MinIO; ~5–15 min depending on size) → mount + start → smoke = **15–30 minutes**.

---

## Stage 2 — Full Data-Root + App-Dir Move (DEFERRED)

Trigger criteria: after one release cycle, if `du -sh /var/lib/docker/overlay2 /opt/shb-deploy/plane-app/dist` shows `/` climbing back above 80%.

### 2.0 Pre-flight additions over Stage 1

```bash
semanage fcontext -a -e /var/lib/docker /u01/docker
semanage fcontext -a -e /var/lib/docker /u01/shb-deploy/plane-app   # harmless
```

### 2.1 Undo Stage 1 first (or skip if Stage 1 not done)

```bash
docker compose -f docker-compose.yaml -f docker-compose.shb.yml down
systemctl stop docker docker.socket
umount /var/lib/docker/volumes 2>/dev/null
sed -i '\|/u01/docker-volumes|d' /etc/fstab
rmdir /var/lib/docker/volumes 2>/dev/null
```

### 2.2 Move full `/var/lib/docker` → `/u01/docker`

```bash
mkdir -p /u01/docker
# if Stage 1 ran, fold the relocated volumes back in first:
[ -d /u01/docker-volumes ] && mv /u01/docker-volumes /u01/docker/volumes
rsync -aHAX --info=progress2 /var/lib/docker/ /u01/docker/
mv /var/lib/docker /var/lib/docker.old
restorecon -RF /u01/docker
```

`/etc/docker/daemon.json`:

```json
{
  "data-root": "/u01/docker",
  "log-driver": "json-file",
  "log-opts": { "max-size": "50m", "max-file": "5" }
}
```

```bash
systemctl start docker
docker info | grep -E 'Docker Root Dir|Storage Driver'   # expect /u01/docker
docker images | grep artifacts.plane.so
docker volume ls | grep -E 'pgdata|uploads|rabbitmq'
```

### 2.3 Move app dir `/opt/shb-deploy/plane-app` → `/u01/shb-deploy/plane-app`

```bash
mkdir -p /u01/shb-deploy
rsync -aHAX /opt/shb-deploy/plane-app/ /u01/shb-deploy/plane-app/
mv /opt/shb-deploy/plane-app /opt/shb-deploy/plane-app.old
ln -s /u01/shb-deploy/plane-app /opt/shb-deploy/plane-app
restorecon -RF /u01/shb-deploy
```

**Update the ONE bind mount** in `/u01/shb-deploy/plane-app/docker-compose.yaml` (proxy service):

```yaml
# before
- /opt/shb-deploy/plane-app/proxy/Caddyfile:/etc/caddy/Caddyfile:ro
# after
- /u01/shb-deploy/plane-app/proxy/Caddyfile:/etc/caddy/Caddyfile:ro
```

`/opt/certs:/etc/caddy/certs:ro` stays unchanged.

### 2.4 Bring stack up + smoke

```bash
cd /u01/shb-deploy/plane-app
docker compose -f docker-compose.yaml -f docker-compose.shb.yml up -d
# (same smoke test block as 1.5)
```

### 2.5 Cleanup after soak

```bash
rm -rf /var/lib/docker.old /opt/shb-deploy/plane-app.old
docker system prune -af          # volumes excluded by default — do NOT add --volumes
```

### 2.6 Rollback Stage 2

```bash
systemctl stop docker
mv /etc/docker/daemon.json /etc/docker/daemon.json.failed
mv /var/lib/docker.old /var/lib/docker
rm /opt/shb-deploy/plane-app
mv /opt/shb-deploy/plane-app.old /opt/shb-deploy/plane-app
# revert the proxy Caddyfile bind-mount edit in docker-compose.yaml back to /opt/...
systemctl start docker
cd /opt/shb-deploy/plane-app && docker compose -f docker-compose.yaml -f docker-compose.shb.yml up -d
```

### Estimated downtime — Stage 2

**20–40 minutes** depending on `overlay2` + app dir size.

## Bind-mount (Stage 1) vs daemon `data-root` (Stage 2)

| Aspect        | Stage 1 (volumes bind)                          | Stage 2 (data-root)                              |
| ------------- | ----------------------------------------------- | ------------------------------------------------ |
| Scope         | `/var/lib/docker/volumes` only                  | entire `/var/lib/docker`                         |
| Frees on `/`  | volume data (Postgres, MinIO, Redis, RabbitMQ)  | volumes + `overlay2` (image layers) + containers |
| Docker config | none (fstab only)                               | `daemon.json` edit                               |
| App-dir edit  | none                                            | `docker-compose.yaml` proxy bind path            |
| Reboot safety | fstab `x-systemd.requires-mounts-for=/u01`      | daemon reads `data-root` at start                |
| SELinux       | `semanage fcontext -e` on `/u01/docker-volumes` | `semanage fcontext -e` on `/u01/docker`          |
| Reversible    | trivial (umount + restore)                      | requires daemon restart + revert compose edit    |

Bind-mount is the safer first step. Move to `data-root` only when image-layer growth proves it's needed.

## Open Questions

- Is `/u01` on the same physical disk as `/`? If yes, no I/O isolation win — still solves the space problem.
- Any cron/backup script hard-coding `/opt/shb-deploy/plane-app`? Grep host crontabs + `/etc/systemd/system/*.service` before removing the symlink: `grep -rl /opt/shb-deploy /etc/cron* /etc/systemd /var/spool/cron 2>/dev/null`.
- LVM extend NOT viable: RHEL 9 default filesystem is **XFS**, which **cannot shrink** — so freeing space from `/home` is not an option. The only extend path is free PEs in `vg00` (`vgs vg00`), and `/u01` lives in `vg01`, so the migration is the right call regardless.
- Is the runtime Docker CE or Podman-in-docker-compat? The `/var/lib/docker/rootfs/overlayfs/...` paths seen in `df -h` are non-standard — confirm with `docker info | grep -E 'Server Version|Storage Driver'` before Step 2. If Podman, `daemon.json` does not apply; use `~/.config/containers/storage.conf` or `/etc/containers/storage.conf` instead.
