## Operations & Deployments

Centralize docs for running Plane in different environments without hunting through `deployments/`.

### Deployment Targets
- `deployments/cli/community/` – Docker Compose bundle with `setup.sh`, `docker-compose.yml`, and env templates.
- `deployments/aio/community/` – All-in-one container image for simple installs.
- `deployments/kubernetes/community/` – Helm-style manifests for K8s clusters.
- `deployments/swarm/community/` – Docker Swarm stack file.

### Common Tasks
| Task | Command | Notes |
| --- | --- | --- |
| Bring up local stack | `docker compose -f docker-compose-local.yml up -d` | Includes API, worker, beat, redis, postgres, rabbitmq, minio. |
| Tail API logs | `docker compose logs -f api` | Useful after migrations. |
| Run backend migrations | `docker compose exec api python manage.py migrate` | Do **not** run without backups in prod. |
| Create superuser | `docker compose exec api python manage.py createsuperuser` | Needed for the admin panel. |

### Configuration Tips
- Copy `.env.example` from the relevant deployment folder and customize secrets before launch.
- Set `API_BASE_URL`, `WEB_URL`, and `CORS_ALLOWED_ORIGINS` consistently to avoid auth issues.
- If you disable telemetry, also update `Instance` settings via the admin interface or environment variables.

### Monitoring
- API health: `GET /api/health/`
- Worker status: check Celery logs via `docker compose logs -f worker`.
- Database: Postgres exposed on `localhost:5432` in local setups.

For anything not covered here, fall back to the specific README inside each `deployments/*/community/` directory.




