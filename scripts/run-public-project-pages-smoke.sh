#!/usr/bin/env bash
set -Eeuo pipefail

project_name="${PLANE_PAGES_SMOKE_PROJECT:-plane-pages-smoke}"
api_key="$(python3 -c 'import secrets; print(secrets.token_urlsafe(32))')"
export SMOKE_API_KEY="$api_key"
compose=(docker compose -p "$project_name" -f docker-compose-test.yml -f docker-compose-pages-smoke.yml)
base_url="http://api-smoke:8000"

cleanup() { "${compose[@]}" down -v --remove-orphans >/dev/null 2>&1 || true; }
trap cleanup EXIT

"${compose[@]}" up -d --build api-smoke
# A clean Plane database applies the complete migration history before the
# development server starts.  Wait for that actual server, not a guessed
# bootstrap duration.
for _ in $(seq 1 180); do
  if "${compose[@]}" run --rm smoke-curl -sS --url "${base_url}/" >/dev/null 2>&1; then break; fi
  sleep 2
done

if ! "${compose[@]}" run --rm smoke-curl -sS --url "${base_url}/" >/dev/null 2>&1; then
  "${compose[@]}" logs --tail 100 api-smoke >&2 || true
  echo "API smoke service did not become reachable" >&2
  exit 1
fi

project_id="$("${compose[@]}" exec -T api-smoke python manage.py shell --verbosity 0 -c 'from plane.db.models import Project; print(Project.objects.get(identifier="SMOKE").id)')"
endpoint="$base_url/api/v1/workspaces/smoke-pages-workspace/projects/${project_id}/pages/"
unauthorized="$("${compose[@]}" run --rm smoke-curl -sS -o /dev/null -w '%{http_code}' --url "$endpoint")"
created="$("${compose[@]}" run --rm smoke-curl -sS -o /tmp/body -w '%{http_code}' -H "X-API-Key: $api_key" -H 'Content-Type: application/json' --data '{"name":"HTTP smoke page"}' --url "$endpoint")"
listed="$("${compose[@]}" run --rm smoke-curl -sS -o /tmp/body -w '%{http_code}' -H "X-API-Key: $api_key" --url "$endpoint")"

test "$unauthorized" = 401
test "$created" = 201
test "$listed" = 200
printf 'HTTP smoke passed: unauthorized=%s create=%s list=%s\n' "$unauthorized" "$created" "$listed"
