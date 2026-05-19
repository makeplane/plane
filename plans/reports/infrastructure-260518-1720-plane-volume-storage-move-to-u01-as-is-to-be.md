# Plane Volume Storage Move to `/u01` - AS-IS / TO-BE Report

Date: 2026-05-18  
Host evidence: `VN-SHWSAP#1-TEST` / `shwsap1t`  
Scope: Plane UAT deployment under `/opt/shb-deploy/plane-app`

## Executive Summary

Move Plane persistent Docker data to `/u01`.

Current root filesystem `/` is already at **74%** (`30G / 40G`) while `/u01` has **100G free** and only **1% used**. Plane currently stores deployment artifacts and Docker runtime data under root-backed paths. This creates upgrade risk because Docker image loads, release archives, Postgres WAL, MinIO uploads, RabbitMQ data, and container logs can all compete for the remaining root space.

Recommended approach: **Stage 1 first: move Docker named volumes to `/u01` using a bind mount**. This is lower risk than moving the whole Docker root immediately. If `/` still grows after one release cycle because of Docker image layers or release tarballs, proceed to **Stage 2: move full Docker data-root and optionally app deploy directory to `/u01`**.

## Source Evidence

### Deployment Path

Current Plane deployment is under:

```text
/opt/shb-deploy/plane-app
```

Observed files:

```text
archive/
deploy-audit.log
dist/
docker-compose.shb.yml
docker-compose.yaml
plane.env
plane.env.bak
plane-images.tar
proxy/
scripts/
```

Release artifacts in `dist/`:

```text
plane-admin-shb_v1.2.0.tar.gz
plane-backend-shb_v1.2.0.tar.gz
plane-frontend-shb_v1.2.0.tar.gz
plane-live-shb_v1.2.0.tar.gz
plane-proxy-shb_v1.2.0.tar.gz
plane-space-shb_v1.2.0.tar.gz
```

### Disk State

```text
Filesystem             Size  Used Avail Use% Mounted on
/dev/mapper/vg00-root   40G   30G   11G  74% /
/dev/mapper/vg00-home   40G  482M   40G   2% /home
/dev/mapper/vg01-u01   100G  746M  100G   1% /u01
```

Important correction: `/home` is not the problem. The constrained filesystem is `/`.

### Active Storage Consumers on `/`

Docker overlay paths are on root-backed Docker storage:

```text
overlay ... /var/lib/docker/rootfs/overlayfs/...
```

Plane deployment artifacts are also under root:

```text
/opt/shb-deploy/plane-app/dist
/opt/shb-deploy/plane-app/archive
/opt/shb-deploy/plane-app/plane-images.tar
```

## AS-IS Architecture

```text
/  (vg00-root, 40G, 74% used)
|-- /opt/shb-deploy/plane-app/
|   |-- dist/                  # SHB image tarballs
|   |-- archive/               # older packages / backups
|   |-- plane-images.tar       # image bundle
|   |-- docker-compose.yaml
|   |-- docker-compose.shb.yml
|   |-- plane.env
|   |-- proxy/Caddyfile
|   `-- scripts/deploy-shb.sh
|-- /var/lib/docker/           # Docker runtime data on root
|   |-- overlay/rootfs layers   # app image/container layers
|   `-- volumes/               # persistent service data
`-- /opt/certs/                # TLS certs mounted into Caddy

/u01  (vg01-u01, 100G, 1% used)
`-- mostly empty
```

## Plane Volumes in Current Compose

The compose file defines these named volumes:

| Volume             | Mounted In                          | Purpose                            | Data Criticality |
| ------------------ | ----------------------------------- | ---------------------------------- | ---------------- |
| `pgdata`           | `plane-db:/var/lib/postgresql/data` | PostgreSQL database                | Critical         |
| `uploads`          | `plane-minio:/export`               | MinIO object uploads / attachments | Critical         |
| `redisdata`        | `plane-redis:/data`                 | Redis persisted state              | Medium           |
| `rabbitmq_data`    | `plane-mq:/var/lib/rabbitmq`        | RabbitMQ queue state               | Medium           |
| `logs_api`         | `api:/code/plane/logs`              | API logs                           | Low/Medium       |
| `logs_worker`      | `worker:/code/plane/logs`           | Worker logs                        | Low/Medium       |
| `logs_beat-worker` | `beat-worker:/code/plane/logs`      | Beat logs                          | Low/Medium       |
| `logs_migrator`    | `migrator:/code/plane/logs`         | Migrator logs                      | Low              |
| `proxy_config`     | `proxy:/config`                     | Caddy config state                 | Medium           |
| `proxy_data`       | `proxy:/data`                       | Caddy runtime / cert state         | Medium           |

All named volumes normally live under Docker's volume store, usually:

```text
/var/lib/docker/volumes
```

So persistent app data is currently tied to `/` unless Docker storage was already changed.

## AS-IS Risks

| Risk                                | Why It Matters                                                                                  | Impact                                                                      |
| ----------------------------------- | ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------- |
| Root filesystem fills during deploy | `docker load`, tarballs, overlay layers, logs, DB writes all use `/`                            | Deployment failure, Docker instability                                      |
| Postgres write failure              | `pgdata` is under Docker volume store on `/`                                                    | Data corruption / app outage risk                                           |
| MinIO upload growth                 | `uploads` grows with attachments                                                                | Root pressure increases over time                                           |
| Release artifact growth             | `dist/`, `archive/`, `plane-images.tar` are under `/opt`                                        | Every release consumes more root space                                      |
| Rollback headroom insufficient      | Existing deploy loads new images before services are recreated                                  | Rollback or upgrade may fail from no free space                             |
| Unclear Docker runtime              | `df -h` shows `/var/lib/docker/rootfs/overlayfs`, which is not the usual Docker `overlay2` path | Must confirm Docker vs Podman-compatible runtime before full data-root move |

## TO-BE Target

### Stage 1 Target - Move Docker Named Volumes Only

```text
/  (vg00-root)
|-- /opt/shb-deploy/plane-app/      # unchanged
|-- /var/lib/docker/                # Docker runtime remains here
|   |-- overlay/rootfs layers       # unchanged
|   `-- volumes/                    # bind mount point
`-- /opt/certs/                     # unchanged

/u01  (vg01-u01, 100G)
`-- docker-volumes/                 # actual named volume data
    |-- pgdata/
    |-- uploads/
    |-- redisdata/
    |-- rabbitmq_data/
    |-- logs_api/
    |-- logs_worker/
    |-- logs_beat-worker/
    |-- logs_migrator/
    |-- proxy_config/
    `-- proxy_data/
```

Bind mount:

```text
/u01/docker-volumes  ->  /var/lib/docker/volumes
```

### Why Stage 1 First

Stage 1 is best first move because:

- No `docker-compose.yaml` change.
- No image retagging or app path change.
- No Docker `daemon.json` change.
- Rollback is simple: stop Docker, unmount, restore old `/var/lib/docker/volumes`.
- Directly moves the most critical growing data: Postgres, MinIO, RabbitMQ, Redis.

Limitation: Stage 1 does **not** move Docker image/container layers or `/opt/shb-deploy/plane-app/dist`. Root usage may still grow after future releases.

## Recommended Migration Procedure - Stage 1

### 1. Pre-Flight Checks

Run before downtime:

```bash
du -sh /var/lib/docker/* 2>/dev/null | sort -h
du -sh /opt/shb-deploy/plane-app/{dist,archive,plane-images.tar} 2>/dev/null
docker system df
docker info | grep -E 'Server Version|Docker Root Dir|Storage Driver'
docker volume ls
mount | grep ' /u01 '
getenforce
```

Create backup:

```bash
mkdir -p /u01/backup/$(date +%F)
cp -a /opt/shb-deploy/plane-app/{plane.env,docker-compose.yaml,docker-compose.shb.yml,proxy} /u01/backup/$(date +%F)/
docker exec plane-db pg_dumpall -U plane > /u01/backup/$(date +%F)/pg_dumpall.sql
```

If `pg_dumpall` fails, stop and investigate before moving volume storage.

### 2. Stop Plane and Docker

```bash
cd /opt/shb-deploy/plane-app
docker compose --env-file plane.env -f docker-compose.yaml -f docker-compose.shb.yml down
systemctl stop docker docker.socket
```

Do **not** run `docker compose down -v`.

### 3. Copy Volumes to `/u01`

```bash
mkdir -p /u01/docker-volumes
rsync -aHAX --info=progress2 /var/lib/docker/volumes/ /u01/docker-volumes/
mv /var/lib/docker/volumes /var/lib/docker/volumes.old
mkdir -p /var/lib/docker/volumes
```

For RHEL with SELinux enforcing:

```bash
semanage fcontext -a -e /var/lib/docker/volumes /u01/docker-volumes
restorecon -RF /u01/docker-volumes
```

### 4. Add Persistent Bind Mount

```bash
echo '/u01/docker-volumes  /var/lib/docker/volumes  none  bind,x-systemd.requires-mounts-for=/u01  0 0' >> /etc/fstab
systemctl daemon-reload
mount -a
mountpoint /var/lib/docker/volumes
ls /var/lib/docker/volumes | head
```

Expected: `/var/lib/docker/volumes` is a mountpoint and contains Plane volumes.

### 5. Start Docker and Plane

```bash
systemctl start docker
docker info | grep 'Docker Root Dir'
docker volume ls | grep -E 'pgdata|uploads|rabbitmq|redis'

cd /opt/shb-deploy/plane-app
docker compose --env-file plane.env -f docker-compose.yaml -f docker-compose.shb.yml up -d
docker compose --env-file plane.env -f docker-compose.yaml -f docker-compose.shb.yml ps
```

### 6. Validation

Technical checks:

```bash
curl -kI https://uat-jms.shinhan.com.vn/
curl -kI https://uat-jms.shinhan.com.vn/api/v1/
curl -kI https://uat-jms.shinhan.com.vn/live/
curl -kI https://uat-jms.shinhan.com.vn/space
curl -kI https://uat-jms.shinhan.com.vn/god-mode

docker compose --env-file plane.env -f docker-compose.yaml -f docker-compose.shb.yml logs --tail=100 api worker proxy plane-db plane-minio

df -h / /u01
du -sb /var/lib/docker/volumes.old /u01/docker-volumes
```

Functional checks:

- Login to Plane.
- Open workspace and project.
- Create/update one issue.
- Upload one attachment to validate MinIO and `/uploads` reverse proxy.
- Open God Mode if required for admin validation.

### 7. Cleanup After Soak

After 24-72 hours stable:

```bash
rm -rf /var/lib/docker/volumes.old
df -h / /u01
```

## Rollback - Stage 1

Use only before deleting `/var/lib/docker/volumes.old`.

```bash
cd /opt/shb-deploy/plane-app
docker compose --env-file plane.env -f docker-compose.yaml -f docker-compose.shb.yml down
systemctl stop docker docker.socket
umount /var/lib/docker/volumes
sed -i '\|/u01/docker-volumes|d' /etc/fstab
rmdir /var/lib/docker/volumes
mv /var/lib/docker/volumes.old /var/lib/docker/volumes
systemctl start docker
docker compose --env-file plane.env -f docker-compose.yaml -f docker-compose.shb.yml up -d
```

## Stage 2 - If Root Still Pressured

Trigger Stage 2 only if, after Stage 1 and one release cycle, root still goes above operational threshold such as **80%**.

Likely causes:

- Docker image/container layers still under `/var/lib/docker`.
- `/opt/shb-deploy/plane-app/dist` keeps old image tarballs.
- `/opt/shb-deploy/plane-app/archive` grows.
- `plane-images.tar` remains large.

Stage 2 target:

```text
/u01/docker                         # Docker data-root
/u01/shb-deploy/plane-app           # optional app deploy dir
/opt/shb-deploy/plane-app -> /u01/shb-deploy/plane-app  # compatibility symlink
```

Stage 2 needs more caution because it changes Docker runtime config and possibly the proxy Caddyfile bind mount path.

If app directory is moved, update this compose bind mount:

```yaml
# current
- /opt/shb-deploy/plane-app/proxy/Caddyfile:/etc/caddy/Caddyfile:ro

# target if app dir is physically moved
- /u01/shb-deploy/plane-app/proxy/Caddyfile:/etc/caddy/Caddyfile:ro
```

Keep this unchanged:

```yaml
- /opt/certs:/etc/caddy/certs:ro
```

## Recommendation

Proceed with **Stage 1: move `/var/lib/docker/volumes` to `/u01/docker-volumes` via bind mount**.

Do not start with full Docker `data-root` move unless pre-flight proves the main root consumer is image layers rather than named volumes. Stage 1 gives immediate safety for critical persistent data while keeping operational blast radius small.

After Stage 1, measure:

```bash
df -h / /u01
du -sh /var/lib/docker/* 2>/dev/null | sort -h
du -sh /opt/shb-deploy/plane-app/{dist,archive,plane-images.tar} 2>/dev/null
```

Then decide if Stage 2 is needed.

## Estimated Downtime

| Stage                        | Estimated Downtime | Notes                                         |
| ---------------------------- | ------------------ | --------------------------------------------- |
| Stage 1 volumes move         | 15-30 minutes      | Depends on actual size of Postgres + uploads  |
| Stage 2 full Docker/app move | 30-60 minutes      | Depends on image layers and app artifact size |

## Unresolved Questions

- Confirm Docker runtime: output of `docker info | grep -E 'Server Version|Docker Root Dir|Storage Driver'`.
- Confirm actual volume size: output of `du -sh /var/lib/docker/volumes /var/lib/docker/* 2>/dev/null`.
- Confirm whether `/u01` is same disk or different disk from `/`; if same disk, this solves capacity but not I/O isolation.
- Confirm if backup/cron/systemd scripts hard-code `/opt/shb-deploy/plane-app` before Stage 2.
- Confirm acceptable downtime window for UAT migration.
