#!/bin/sh
# End-to-end: every MCP tool action through a real MCP server, against a real, migrated API
# built from this working tree. Throwaway containers only; nothing touches a deployment.
#
#   ./setup.sh                                              # once: creates apps/api/.env
#   COMPOSE_PROJECT_NAME=nexustest docker compose -f docker-compose-test.yml up -d test-db test-redis test-mq test-minio
#   apps/mcp/e2e/run.sh
#
# It reuses that stack's Postgres, Valkey, RabbitMQ and MinIO, adds a gateway, API, worker and MCP
# server, seeds a workspace and token, then runs all_tools.py. Exit status is its result.
set -eu
HERE=$(cd "$(dirname "$0")" && pwd)
REPO=$(cd "$HERE/../../.." && pwd)
NET=${COMPOSE_PROJECT_NAME:-nexustest}_test_env
DB=plane_e2e
docker rm -f e2e-gw e2e-api e2e-worker e2e-mcp >/dev/null 2>&1 || true
# docker --env-file keeps quotes literally, so write an unquoted copy.
ENVFILE=$(mktemp)
trap 'rm -f $ENVFILE' EXIT
grep -v '^#' $REPO/apps/api/.env | grep '=' | sed -E 's/^([A-Z_0-9]+)="(.*)"$/\1=\2/' > $ENVFILE
docker build -q -t nexus/plane-backend:e2e -f $REPO/apps/api/Dockerfile.api $REPO/apps/api >/dev/null
docker build -q -t nexus/plane-mcp:e2e $REPO/apps/mcp >/dev/null
docker exec ${COMPOSE_PROJECT_NAME:-nexustest}-test-db-1 psql -U plane -d postgres -qc "DROP DATABASE IF EXISTS $DB WITH (FORCE)" -c "CREATE DATABASE $DB" >/dev/null
ENV="--network $NET --env-file $ENVFILE -e DATABASE_URL=postgresql://plane:plane@test-db:5432/$DB
 -e REDIS_URL=redis://test-redis:6379/ -e REDIS_HOST=test-redis -e AMQP_URL=amqp://plane:plane@test-mq:5672/plane
 -e RABBITMQ_HOST=test-mq -e AWS_S3_ENDPOINT_URL=http://test-minio:9000 -e USE_MINIO=1 -e MINIO_ENDPOINT_SSL=0
 -e WEB_URL=http://e2e-gw -e CORS_ALLOWED_ORIGINS=http://e2e-gw -e AWS_ACCESS_KEY_ID=access-key -e AWS_SECRET_ACCESS_KEY=secret-key -e REDIS_SSL_CERT_REQS=none -e SECRET_KEY=e2e-not-secret-0123456789abcdefghijklmnop -e DEBUG=0 -e GUNICORN_WORKERS=2 -e API_KEY_RATE_LIMIT=100000/minute"
docker run --rm $ENV nexus/plane-backend:e2e python manage.py migrate --noinput >/dev/null
# Drop jobs other test runs left queued, so this run's activity tasks are not stuck behind them.
docker exec ${COMPOSE_PROJECT_NAME:-nexustest}-test-mq-1 rabbitmqctl -q -p plane purge_queue celery >/dev/null
# Gateway: /uploads to MinIO, everything else to the API, as on the VPS. The MCP server must
# reach the API through it: Plane builds upload URLs from the request host.
docker run -d --name e2e-gw --network $NET -v $HERE/Caddyfile:/etc/caddy/Caddyfile:ro caddy:2.11.8-alpine >/dev/null
docker run -d --name e2e-api $ENV nexus/plane-backend:e2e ./bin/docker-entrypoint-api.sh >/dev/null
docker run -d --name e2e-worker $ENV nexus/plane-backend:e2e ./bin/docker-entrypoint-worker.sh >/dev/null
PAT=$(docker exec e2e-api python manage.py shell -c "
from plane.db.models import User, Workspace, WorkspaceMember
from plane.db.models.api import APIToken
u=User.objects.create(email='e2e@example.com', username='e2e', first_name='E2E', is_active=True)
w=Workspace.objects.create(name='E2E', slug='e2e', owner=u)
WorkspaceMember.objects.create(workspace=w, member=u, role=20)
t=User.objects.create(email='teammate@example.com', username='teammate', first_name='Team', is_active=True)
WorkspaceMember.objects.create(workspace=w, member=t, role=15)
print(APIToken.objects.create(user=u, label='e2e').token)" | tail -1)
docker run -d --name e2e-mcp --network $NET -e PLANE_BASE_URL=http://e2e-gw -e PLANE_INTERNAL_BASE_URL=http://e2e-gw \
  -e LOG_PAYLOADS=false nexus/plane-mcp:e2e >/dev/null
for i in $(seq 60); do docker exec e2e-api python -c "import urllib.request;urllib.request.urlopen('http://localhost:8000/api/instances/')" >/dev/null 2>&1 && break; sleep 2; done
sleep 3
docker exec -i -e MCP_URL=http://localhost:8211/mcp -e PLANE_PAT=$PAT -e PLANE_WORKSPACE=e2e e2e-mcp python /dev/stdin < $HERE/all_tools.py
