# GCP: two-VM Plane deployment (custom fields)

Deploy Plane from **this repository** on two Compute Engine VMs. Do not use the community installer or `makeplane/*` images from `artifacts.plane.so` — those builds do not include custom fields.

| VM             | Compose file                                               | Services                                     |
| -------------- | ---------------------------------------------------------- | -------------------------------------------- |
| **plane-data** | [`docker-compose.data.yml`](../../docker-compose.data.yml) | Postgres, Valkey, RabbitMQ, MinIO            |
| **plane-app**  | [`docker-compose.app.yml`](../../docker-compose.app.yml)   | API, workers, web, admin, space, live, proxy |

Single-machine local/production: keep using [`docker-compose.yml`](../../docker-compose.yml) and [`setup.sh`](../../setup.sh).

## Prerequisites

- GCP project with Compute Engine enabled
- Two VMs in the same VPC with **static internal IPs** (example: data `10.128.0.10`, app `10.128.0.20`)
- Firewall: app VM → data VM on TCP `5432`, `6379`, `5672`, `9000` only; internet → app VM on `80`, `443`
- One **reserved external static IP** on the app VM; DNS `A` record to that IP
- Docker + Docker Compose plugin on both VMs
- Git clone of this repo on both hosts (or deploy app repo only on app VM if you sync compose files)

## VM1 — Data tier

```bash
cd /opt/plane   # or your clone path
git clone <your-repo-url> .
git checkout <your-branch>

cp .env.data.example .env
# Edit: POSTGRES_PASSWORD, RABBITMQ_PASSWORD, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
# Optional: PLANE_BIND_ADDRESS=10.128.0.10  (data VM internal IP)

docker compose -f docker-compose.data.yml up -d
docker compose -f docker-compose.data.yml ps
```

Volumes: `pgdata`, `redisdata`, `rabbitmq_data`, `uploads`.

### Daily Postgres backup (optional)

On the data VM, after Cloud Storage bucket and service account are configured:

```bash
docker exec plane-db pg_dump -U plane -d plane | gzip > /tmp/plane-$(date +%Y-%m-%d).sql.gz
gsutil cp /tmp/plane-*.sql.gz gs://YOUR_BUCKET/daily/
```

Automate with cron on the data VM.

## VM2 — App tier

Ensure data tier is up. From the app VM, verify connectivity:

```bash
nc -zv 10.128.0.10 5432 6379 5672 9000
```

### Environment files

```bash
cp .env.app.example .env
# Edit VITE_* and SITE_ADDRESS / CERT_EMAIL for your public HTTPS URL

cp apps/api/.env.example apps/api/.env
cp apps/live/.env.example apps/live/.env
```

Set **`PLANE_DATA_HOST`** to the data VM internal IP in `apps/api/.env` and `apps/live/.env`:

| Variable                                          | Value                   |
| ------------------------------------------------- | ----------------------- |
| `POSTGRES_HOST`                                   | data VM IP              |
| `REDIS_HOST`                                      | data VM IP              |
| `RABBITMQ_HOST`                                   | data VM IP              |
| `AWS_S3_ENDPOINT_URL`                             | `http://<data-ip>:9000` |
| `POSTGRES_PASSWORD`, `RABBITMQ_PASSWORD`, `AWS_*` | Same as data VM `.env`  |
| `WEB_URL`, `CORS_ALLOWED_ORIGINS`                 | `https://your-domain`   |
| `USE_MINIO`                                       | `1`                     |

Generate `SECRET_KEY` and `LIVE_SERVER_SECRET_KEY` (shared between api and live).

### Build and start

```bash
docker compose -f docker-compose.app.yml build
docker compose -f docker-compose.app.yml run --rm migrator
docker compose -f docker-compose.app.yml up -d
docker compose -f docker-compose.app.yml ps
```

Startup order: **data VM** → **migrator** (exit 0) → **all app services**.

### Verify

- `https://your-domain` loads
- Project settings → **Custom fields** appears (confirms custom-fields build)
- `docker compose -f docker-compose.app.yml logs migrator api proxy`

## Upgrades

1. `git pull` on app VM (and data VM if compose changed)
2. `docker compose -f docker-compose.app.yml build`
3. `docker compose -f docker-compose.app.yml run --rm migrator`
4. `docker compose -f docker-compose.app.yml up -d`

Data VM images (Postgres, etc.) rarely need changes.

## Local smoke test (single machine)

```bash
cp .env.data.example .env
docker compose -f docker-compose.data.yml up -d

# apps/api/.env: POSTGRES_HOST=127.0.0.1, REDIS_HOST=127.0.0.1, etc.
docker compose -f docker-compose.app.yml build
docker compose -f docker-compose.app.yml run --rm migrator
docker compose -f docker-compose.app.yml up -d
```

## IP addressing (GCP)

| IP                              | Reserve?    | Cost                    |
| ------------------------------- | ----------- | ----------------------- |
| External static on **app VM**   | Yes         | ~$3.65/mo when attached |
| Internal static on **both VMs** | Recommended | Free                    |
| External on **data VM**         | No          | —                       |

See [VPC pricing](https://cloud.google.com/vpc/pricing#ipaddress).
