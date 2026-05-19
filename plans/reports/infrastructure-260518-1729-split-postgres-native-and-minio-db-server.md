# Split PostgreSQL and MinIO to DB Server - AS-IS / TO-BE Report

Date: 2026-05-18  
Scope: Plane UAT deployment split from one app server into app server + database/storage server  
Current app path: `/opt/shb-deploy/plane-app`

## Executive Summary

Move PostgreSQL out of the Plane app server and install it natively on a separate database server. Run MinIO by Docker on the same database server. Plane app server will connect to both by IP.

Recommended target:

- App server keeps Plane app containers: `web`, `admin`, `space`, `live`, `api`, `worker`, `beat-worker`, `migrator`, `proxy`, `redis`, `rabbitmq`.
- DB server runs native PostgreSQL on port `5432`.
- DB server runs MinIO Docker on ports `9000` and optionally `9090`.
- App server connects to PostgreSQL using `DATABASE_URL` or `PGHOST` pointed to DB server IP.
- App server connects to MinIO using `AWS_S3_ENDPOINT_URL=http://<DB_SERVER_IP>:9000`.
- App proxy `Caddyfile` routes `/uploads*` to `<DB_SERVER_IP>:9000`, not local `plane-minio`.

This is a better long-term topology than only moving Docker volumes to `/u01`, because it separates data growth and DB operations from the app server root filesystem.

## AS-IS

Current server runs both application and data services in one Docker Compose stack.

```text
APP SERVER: shwsap1t
/opt/shb-deploy/plane-app
|-- web/admin/space/live containers
|-- api/worker/beat/migrator containers
|-- plane-db container          # PostgreSQL in Docker
|-- plane-minio container       # MinIO in Docker
|-- plane-redis container
|-- plane-mq container
`-- proxy container             # Caddy TLS + routing
```

Current compose data services:

| Service    | Current Mode     | Current Storage                   | Current Network Name |
| ---------- | ---------------- | --------------------------------- | -------------------- |
| PostgreSQL | Docker container | `pgdata:/var/lib/postgresql/data` | `plane-db:5432`      |
| MinIO      | Docker container | `uploads:/export`                 | `plane-minio:9000`   |
| Redis      | Docker container | `redisdata:/data`                 | `plane-redis:6379`   |
| RabbitMQ   | Docker container | `rabbitmq_data:/var/lib/rabbitmq` | `plane-mq:5672`      |

Current Caddy upload route:

```caddy
reverse_proxy /uploads* plane-minio:9000 {
    header_up Host {http.request.host}
}
```

Current backend defaults in compose use internal Docker DNS:

```yaml
PGHOST: ${PGHOST:-plane-db}
DATABASE_URL: ${DATABASE_URL:-postgresql://plane:plane@plane-db/plane}
AWS_S3_ENDPOINT_URL: ${AWS_S3_ENDPOINT_URL:-http://plane-minio:9000}
```

## AS-IS Problems

| Problem                                                 | Impact                                               |
| ------------------------------------------------------- | ---------------------------------------------------- |
| Database depends on app server Docker runtime           | Docker/storage issue can affect DB availability      |
| PostgreSQL data shares app server root storage pressure | DB write failure risk when `/` fills                 |
| MinIO uploads grow on app server                        | Attachment growth competes with app releases/images  |
| Backup boundary unclear                                 | App deploy and data backup mixed together            |
| Scaling app server later is harder                      | Data service tied to the same host/container network |

## TO-BE

```text
APP SERVER: shwsap1t
/opt/shb-deploy/plane-app
|-- web/admin/space/live containers
|-- api/worker/beat/migrator containers
|-- plane-redis container
|-- plane-mq container
`-- proxy container
    |-- /api -> api:8000
    |-- /live -> live:3000
    |-- /space -> space:3000
    |-- /god-mode -> admin:3000
    `-- /uploads -> http://<DB_SERVER_IP>:9000

DB SERVER: new database/storage server
|-- native PostgreSQL 15/16 on <DB_SERVER_IP>:5432
`-- MinIO Docker on <DB_SERVER_IP>:9000
    `-- data volume under /u01/minio or approved data mount
```

## Target Connection Matrix

| From          | To         | Port       | Purpose                  | Firewall Rule                                     |
| ------------- | ---------- | ---------- | ------------------------ | ------------------------------------------------- |
| App server    | DB server  | `5432/tcp` | PostgreSQL               | Allow only app server IP                          |
| App server    | DB server  | `9000/tcp` | MinIO S3 API             | Allow only app server IP, or proxy path as needed |
| Admin network | DB server  | `9090/tcp` | MinIO console            | Optional, restrict strongly                       |
| User browser  | App server | `443/tcp`  | Plane web access         | Existing                                          |
| App proxy     | DB server  | `9000/tcp` | `/uploads` reverse proxy | Required if browser uses `/uploads`               |

Do not expose PostgreSQL to user network. Do not expose MinIO console broadly.

## App Server Config Changes

### 1. Stop Using Local `plane-db`

Remove/comment `plane-db` service from the app server compose, or keep it disabled.

Remove `plane-db` from `depends_on` in:

- `api`
- `worker`
- `beat-worker`
- `migrator`

`depends_on` only works for local compose services. It cannot wait for a native DB on another server.

### 2. Stop Using Local `plane-minio`

Remove/comment `plane-minio` service from the app server compose, or keep it disabled.

Change Caddyfile route from local Docker DNS to DB server IP:

```caddy
reverse_proxy /uploads* <DB_SERVER_IP>:9000 {
    header_up Host {http.request.host}
}
```

If MinIO rejects the external `Host`, test this safer version:

```caddy
reverse_proxy /uploads* <DB_SERVER_IP>:9000 {
    header_up Host <DB_SERVER_IP>:9000
}
```

Choose based on upload/download smoke test.

### 3. Update `plane.env`

Use real IP values, not container DNS:

```env
PGHOST=<DB_SERVER_IP>
PGDATABASE=plane
POSTGRES_USER=plane
POSTGRES_PASSWORD=<strong-password>
POSTGRES_DB=plane
POSTGRES_PORT=5432
DATABASE_URL=postgresql://plane:<strong-password>@<DB_SERVER_IP>:5432/plane

USE_MINIO=1
AWS_REGION=
AWS_ACCESS_KEY_ID=<minio-access-key>
AWS_SECRET_ACCESS_KEY=<minio-secret-key>
AWS_S3_ENDPOINT_URL=http://<DB_SERVER_IP>:9000
AWS_S3_BUCKET_NAME=uploads
MINIO_EXTERNAL_ENDPOINT=https://uat-jms.shinhan.com.vn/uploads
MINIO_ENDPOINT_SSL=0
```

Notes:

- `DATABASE_URL` is the most important DB value for Django runtime.
- `PGHOST` and related variables should match for scripts/migrations.
- `AWS_S3_ENDPOINT_URL` should be reachable from backend containers on app server.
- `MINIO_EXTERNAL_ENDPOINT` should stay browser-facing through Caddy if Plane generates browser URLs.
- Do not commit `plane.env` to git.

## DB Server PostgreSQL Native Install

Example for RHEL 9 style host. Adjust package source based on SHB standard repository.

### 1. Install PostgreSQL

```bash
# package names depend on internal repo availability
sudo dnf install -y postgresql-server postgresql-contrib
sudo postgresql-setup --initdb
sudo systemctl enable --now postgresql
```

If using PostgreSQL official packages, versioned commands may differ, for example `postgresql-15-setup`.

### 2. Configure Listen Address

Edit `postgresql.conf`:

```conf
listen_addresses = '<DB_SERVER_IP>'
port = 5432
max_connections = 1000
```

### 3. Restrict Client Access

Edit `pg_hba.conf`:

```conf
host    plane    plane    <APP_SERVER_IP>/32    scram-sha-256
```

Use `md5` only if installed PostgreSQL/auth policy does not support SCRAM.

### 4. Create DB and User

```bash
sudo -u postgres psql <<'SQL'
CREATE USER plane WITH PASSWORD '<strong-password>';
CREATE DATABASE plane OWNER plane;
GRANT ALL PRIVILEGES ON DATABASE plane TO plane;
SQL
```

### 5. Restart and Validate

```bash
sudo systemctl restart postgresql
sudo ss -lntp | grep 5432
psql 'postgresql://plane:<strong-password>@<DB_SERVER_IP>:5432/plane' -c 'select 1;'
```

From app server:

```bash
psql 'postgresql://plane:<strong-password>@<DB_SERVER_IP>:5432/plane' -c 'select 1;'
```

## DB Server MinIO Docker Install

Use `/u01` or the approved data mount for object data.

```bash
mkdir -p /u01/minio/data
mkdir -p /u01/minio/config
```

Example compose on DB server:

```yaml
services:
  minio:
    image: minio/minio:latest
    container_name: plane-minio
    restart: unless-stopped
    command: server /data --console-address ':9090'
    environment:
      MINIO_ROOT_USER: <minio-access-key>
      MINIO_ROOT_PASSWORD: <minio-secret-key>
    ports:
      - "<DB_SERVER_IP>:9000:9000"
      - "<DB_SERVER_IP>:9090:9090"
    volumes:
      - /u01/minio/data:/data
      - /u01/minio/config:/root/.minio
```

Create bucket:

```bash
docker exec -it plane-minio sh -c "mc alias set local http://127.0.0.1:9000 <minio-access-key> <minio-secret-key> && mc mb -p local/uploads || true"
```

Validate from app server:

```bash
curl -I http://<DB_SERVER_IP>:9000/minio/health/live
```

## Data Migration Plan

### Phase 0 - Pre-Flight

Collect current state:

```bash
cd /opt/shb-deploy/plane-app
docker compose --env-file plane.env -f docker-compose.yaml -f docker-compose.shb.yml ps
docker exec plane-db psql -U plane -d plane -c 'select now();'
docker exec plane-minio mc --help >/dev/null 2>&1 || true
du -sh /var/lib/docker/volumes/* 2>/dev/null | sort -h
```

Create app server backup directory:

```bash
mkdir -p /u01/backup/split-db-minio-$(date +%F)
```

### Phase 1 - Stop Writes

Schedule downtime. Stop Plane app stack to prevent DB and upload writes during dump/copy.

```bash
cd /opt/shb-deploy/plane-app
docker compose --env-file plane.env -f docker-compose.yaml -f docker-compose.shb.yml down
```

Do not use `down -v`.

### Phase 2 - Migrate PostgreSQL

Start only old DB if needed for dump:

```bash
docker compose --env-file plane.env -f docker-compose.yaml -f docker-compose.shb.yml up -d plane-db
```

Dump old DB:

```bash
docker exec plane-db pg_dump -U plane -Fc plane > /u01/backup/split-db-minio-$(date +%F)/plane.dump
```

Restore to native PostgreSQL on DB server:

```bash
pg_restore --clean --if-exists --no-owner --role=plane \
  -d 'postgresql://plane:<strong-password>@<DB_SERVER_IP>:5432/plane' \
  /u01/backup/split-db-minio-$(date +%F)/plane.dump
```

Validate row visibility:

```bash
psql 'postgresql://plane:<strong-password>@<DB_SERVER_IP>:5432/plane' -c '\dt'
```

### Phase 3 - Migrate MinIO Data

Preferred: use MinIO client mirror from old MinIO to new MinIO while old container is available.

```bash
# run from a host/container that can reach both old and new MinIO
mc alias set old http://<APP_SERVER_IP>:9000 <old-access-key> <old-secret-key>
mc alias set new http://<DB_SERVER_IP>:9000 <new-access-key> <new-secret-key>
mc mb -p new/uploads || true
mc mirror --overwrite old/uploads new/uploads
```

If old MinIO was not exposed on host port, run `mc` inside a temporary container on app server compose network or copy the Docker volume offline.

Offline volume copy option:

```bash
# app server, after stack stopped
rsync -aHAX /var/lib/docker/volumes/<compose-project>_uploads/_data/ root@<DB_SERVER_IP>:/u01/minio/data/
```

Need confirm actual volume name with:

```bash
docker volume ls | grep uploads
docker volume inspect <volume-name>
```

### Phase 4 - Reconfigure App Server

Update `plane.env`, app compose, and Caddyfile as described above.

Then start app server stack without local `plane-db` and local `plane-minio`:

```bash
cd /opt/shb-deploy/plane-app
docker compose --env-file plane.env -f docker-compose.yaml -f docker-compose.shb.yml up -d
```

Run migration against native DB:

```bash
docker compose --env-file plane.env -f docker-compose.yaml -f docker-compose.shb.yml up -d migrator --force-recreate
```

Then app services:

```bash
docker compose --env-file plane.env -f docker-compose.yaml -f docker-compose.shb.yml up -d --force-recreate
```

## Validation

Connectivity from app server:

```bash
nc -vz <DB_SERVER_IP> 5432
nc -vz <DB_SERVER_IP> 9000
curl -I http://<DB_SERVER_IP>:9000/minio/health/live
psql 'postgresql://plane:<strong-password>@<DB_SERVER_IP>:5432/plane' -c 'select 1;'
```

Container logs:

```bash
cd /opt/shb-deploy/plane-app
docker compose --env-file plane.env -f docker-compose.yaml -f docker-compose.shb.yml logs --tail=100 api worker migrator proxy
```

HTTP checks:

```bash
curl -kI https://uat-jms.shinhan.com.vn/
curl -kI https://uat-jms.shinhan.com.vn/api/v1/
curl -kI https://uat-jms.shinhan.com.vn/uploads/
```

Functional checks:

- Login.
- Open workspace/project.
- Create or update issue.
- Upload attachment.
- Download attachment.
- Confirm background worker jobs still run.
- Confirm no new writes happen to old `plane-db` or old `plane-minio`.

## Rollback

Rollback is simpler if old DB and old MinIO volumes are kept and not deleted.

Steps:

1. Stop app stack.
2. Restore old `plane.env` values: `DATABASE_URL` to `plane-db`, `AWS_S3_ENDPOINT_URL` to `plane-minio`.
3. Restore Caddyfile `/uploads* plane-minio:9000`.
4. Re-enable local `plane-db` and `plane-minio` services in compose.
5. Start old stack.

```bash
cd /opt/shb-deploy/plane-app
docker compose --env-file plane.env -f docker-compose.yaml -f docker-compose.shb.yml down
# restore config files from backup
docker compose --env-file plane.env -f docker-compose.yaml -f docker-compose.shb.yml up -d
```

Important: rollback after users write data to the new native DB can lose those new writes unless reverse migration is planned. Set a rollback decision window, for example first 30-60 minutes after cutover.

## Timeline Estimate

Assumption from requester: **Stage split DB service = 2 working days**.

Recommended total timeline: **3-4 working days** including preparation, implementation, validation, and rollback buffer.

| Phase                    | Duration  | Main Work                                                                                                                | Output                                   |
| ------------------------ | --------- | ------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------- |
| Preparation              | 0.5-1 day | Confirm IPs, firewall, PostgreSQL version, storage mount, credentials, downtime window                                   | Approved runbook inputs                  |
| DB server setup          | 0.5 day   | Install native PostgreSQL, configure `postgresql.conf`, `pg_hba.conf`, service, firewall                                 | PostgreSQL reachable from app server     |
| MinIO setup              | 0.5 day   | Run MinIO Docker on DB server, create bucket, restrict ports                                                             | MinIO reachable from app server          |
| App config preparation   | 0.5 day   | Prepare `plane.env`, compose changes, Caddy `/uploads` route, backup current config                                      | Ready-to-apply app config                |
| Split DB service cutover | 2 days    | Dump/restore PostgreSQL, mirror MinIO, disable local `plane-db`/`plane-minio`, start app against DB server, run migrator | Plane runs with native DB + remote MinIO |
| Validation + monitoring  | 0.5 day   | Smoke tests, upload/download, logs, DB connection check, rollback decision window                                        | Go/no-go confirmation                    |

### Suggested Calendar

| Day                        | Plan                                                                                                      |
| -------------------------- | --------------------------------------------------------------------------------------------------------- |
| Day 1                      | Prepare DB server, firewall, PostgreSQL native install, MinIO Docker, initial connectivity test           |
| Day 2                      | Prepare app server config changes, backup current config/data, dry-run commands where possible            |
| Day 3-4                    | Split DB service implementation window: DB dump/restore, MinIO mirror, app cutover, migration, validation |
| Day 4 end or Day 5 morning | Post-cutover monitoring and cleanup decision                                                              |

### Downtime Estimate

Expected service downtime during final cutover: **2-4 hours** if data size is moderate.

Downtime can be longer if:

- `pgdata` is large.
- `uploads` has many files.
- Network transfer between app server and DB server is slow.
- Firewall/security approval is not ready before cutover.

### Timeline Risks

| Risk                                     | Effect on Timeline                      | Control                                                  |
| ---------------------------------------- | --------------------------------------- | -------------------------------------------------------- |
| Unknown DB/upload data size              | Dump/restore/mirror may exceed estimate | Measure `pgdata` and `uploads` before schedule           |
| Firewall not ready                       | Blocks connectivity test                | Request rules before implementation day                  |
| PostgreSQL package not available offline | Delays native install                   | Confirm internal repo/package before Day 1               |
| MinIO image not available on DB server   | Delays storage setup                    | Preload/mirror image before Day 1                        |
| App env mismatch                         | App starts but uploads/DB fail          | Prepare config diff and rollback copy before downtime    |
| Rollback after new writes                | Can lose post-cutover writes            | Define rollback decision window before users resume work |

## Risks and Controls

| Risk                           | Control                                                                                                 |
| ------------------------------ | ------------------------------------------------------------------------------------------------------- |
| App starts before DB ready     | Remove `depends_on` expectation, validate TCP and run migrator manually                                 |
| DB exposed too broadly         | `pg_hba.conf` only app server IP, firewall only `5432` from app server                                  |
| MinIO exposed too broadly      | Firewall `9000` only app/proxy/admin network, restrict `9090` console                                   |
| Caddy `/uploads` path mismatch | Test upload and download after changing reverse proxy                                                   |
| Presigned URL mismatch         | Keep `MINIO_EXTERNAL_ENDPOINT=https://uat-jms.shinhan.com.vn/uploads` if browser-facing URLs are needed |
| Credentials leaked             | Keep `plane.env` server-local only, do not commit to git                                                |
| Data drift during migration    | Stop app writes before DB dump and MinIO mirror final pass                                              |
| Rollback loses new writes      | Define rollback window before users resume work                                                         |

## Recommendation

Do this in two controlled cutovers:

1. Prepare DB server first: native PostgreSQL running, MinIO Docker running, firewall restricted, empty bucket created.
2. During downtime: dump/restore PostgreSQL, mirror MinIO, update app server env/compose/Caddy, run migrator, smoke test.

Keep Redis and RabbitMQ on the app server for now. Moving them is possible later, but not needed for the requested split and increases downtime/blast radius.

## Unresolved Questions

- What is `<DB_SERVER_IP>` and `<APP_SERVER_IP>`?
- Which PostgreSQL version is approved by SHB server repo: 15, 16, or OS default?
- Should MinIO console `9090` be exposed at all, or only SSH tunnel/admin subnet?
- Does SHB require TLS between app server and DB server for PostgreSQL and MinIO internal traffic?
- What is acceptable downtime window for DB dump/restore and MinIO mirror?
- What is current real size of `pgdata` and `uploads` volumes?
