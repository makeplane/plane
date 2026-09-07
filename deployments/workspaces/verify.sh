#!/usr/bin/env bash
# Post-deploy verification for the Workspaces deployment. Run on the VPS, from the
# repository root, after `docker compose up -d --build`:
#
#   deployments/workspaces/verify.sh https://workspaces.hgsoftware.com.np
#
# It checks, in order: every container is healthy, the proxy is bound to
# loopback only, Caddy accepts its configuration, each container received the
# configuration it needs (and nothing it must not), every route answers through
# the edge, nginx forwards the scheme correctly (the check that separates "login
# works" from "login silently fails"), the upload limit is enforced, websockets
# upgrade, and the beat scheduler registered the operations reminders.
#
# Options (environment variables):
#   VERIFY_RESOLVE=<ip>   send requests for the domain to <ip> (test rigs)
#   VERIFY_INSECURE=1     accept a self-signed certificate (test rigs)
#
# Exit status is the number of failed checks.

set -uo pipefail

BASE=${1:?usage: deployments/workspaces/verify.sh https://your.domain}
BASE=${BASE%/}
HOST=${BASE#*://}
HOST=${HOST%%/*}
SCHEME=${BASE%%://*}

CURL=(curl -sS --max-time 20)
[ "${VERIFY_INSECURE:-0}" = "1" ] && CURL+=(-k)
if [ -n "${VERIFY_RESOLVE:-}" ]; then
  CURL+=(--resolve "${HOST}:443:${VERIFY_RESOLVE}" --resolve "${HOST}:80:${VERIFY_RESOLVE}")
fi

pass=0
fail=0
ok()   { pass=$((pass + 1)); printf '  \033[32m✓\033[0m %s\n' "$1"; }
bad()  { fail=$((fail + 1)); printf '  \033[31m✗\033[0m %s\n' "$1"; [ -n "${2:-}" ] && printf '      %s\n' "$2"; }
head_() { printf '\n\033[1m%s\033[0m\n' "$1"; }

code_of() { "${CURL[@]}" -o /dev/null -w '%{http_code}' "$@" 2>/dev/null || echo 000; }

# ------------------------------------------------------------------ containers
head_ "Containers"
if ! ps_out=$(docker compose ps -a --format '{{.Service}}|{{.State}}|{{.Health}}|{{.ExitCode}}' 2>&1); then
  bad "docker compose ps" "$ps_out"
else
  while IFS='|' read -r svc state health exit_code; do
    case "$svc" in
      migrator)
        if [ "$state" = "exited" ] && [ "$exit_code" = "0" ]; then ok "migrator exited 0"; else bad "migrator: $state exit=$exit_code (must run to completion before the api starts)"; fi ;;
      worker|beat-worker)
        if [ "$state" = "running" ]; then ok "$svc running"; else bad "$svc: $state"; fi ;;
      *)
        if [ "$state" = "running" ] && [ "$health" = "healthy" ]; then ok "$svc healthy"; else bad "$svc: $state ${health:-no-healthcheck}"; fi ;;
    esac
  done <<< "$ps_out"
fi

# ------------------------------------------------------------------- the edge
head_ "Edge"
ports=$(docker compose port proxy 80 2>/dev/null || true)
case "$ports" in
  127.0.0.1:*) ok "proxy published on loopback only ($ports)" ;;
  *) bad "proxy is published on '$ports'; expected 127.0.0.1:<LISTEN_HTTP_PORT> (is deployments/workspaces/compose.yml in COMPOSE_FILE?)" ;;
esac
if docker compose exec -T proxy caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile >/dev/null 2>&1; then
  ok "Caddy accepts its configuration with the live environment"
else
  bad "caddy validate failed inside the proxy container" "$(docker compose exec -T proxy caddy validate --config /etc/caddy/Caddyfile --adapter caddyfile 2>&1 | tail -1)"
fi
tp=$(docker compose exec -T proxy printenv TRUSTED_PROXIES 2>/dev/null | tr -d '\r')
if [ "$tp" = "private_ranges" ]; then ok "TRUSTED_PROXIES=private_ranges"; else bad "TRUSTED_PROXIES is '$tp'; expected private_ranges behind the host nginx"; fi

# ------------------------------------------------------ environment propagation
head_ "Environment propagation"
api_env=$(docker compose exec -T api sh -c 'printenv' 2>/dev/null | tr -d '\r')
for v in WEB_URL CORS_ALLOWED_ORIGINS POSTGRES_HOST REDIS_URL RABBITMQ_HOST AWS_S3_ENDPOINT_URL AWS_S3_BUCKET_NAME USE_MINIO FILE_SIZE_LIMIT; do
  val=$(printf '%s\n' "$api_env" | sed -n "s/^${v}=//p")
  if [ -n "$val" ]; then ok "api $v=$val"; else bad "api is missing $v"; fi
done
sk_len=$(printf '%s\n' "$api_env" | sed -n 's/^SECRET_KEY=//p' | tr -d '\n' | wc -c | tr -d ' ')
if [ "${sk_len:-0}" -ge 32 ]; then ok "api SECRET_KEY set (${sk_len} chars)"; else bad "api SECRET_KEY is unset or short; sessions will not survive a restart"; fi
cors=$(printf '%s\n' "$api_env" | sed -n 's/^CORS_ALLOWED_ORIGINS=//p')
case "$cors" in
  *http:*) bad "CORS_ALLOWED_ORIGINS contains an http: origin ('$cors'); secure cookies are off and sign-in will fail" ;;
  *) ok "CORS_ALLOWED_ORIGINS has no http: origin" ;;
esac
proxy_env=$(docker compose exec -T proxy printenv 2>/dev/null | tr -d '\r')
for v in SITE_ADDRESS FILE_SIZE_LIMIT BUCKET_NAME CERT_ACME_CA TRUSTED_PROXIES; do
  if printf '%s\n' "$proxy_env" | grep -q "^${v}=."; then ok "proxy $v set"; else bad "proxy is missing $v (Caddy cannot parse its Caddyfile without it)"; fi
done
for v in CERT_EMAIL CERT_ACME_DNS; do
  if printf '%s\n' "$proxy_env" | grep -q "^${v}="; then ok "proxy $v present"; else bad "proxy is missing $v"; fi
done
live_env=$(docker compose exec -T live printenv 2>/dev/null | tr -d '\r')
for v in API_BASE_URL LIVE_SERVER_SECRET_KEY REDIS_URL; do
  if printf '%s\n' "$live_env" | grep -q "^${v}=."; then ok "live $v set"; else bad "live is missing $v (the live server exits without it)"; fi
done
leak=$(docker compose exec -T workspaces-db printenv 2>/dev/null | grep -cE '^(AWS_|RABBITMQ_|SECRET_KEY|LIVE_SERVER|ODOO_|CERT_)' || true)
if [ "${leak:-0}" = "0" ]; then ok "workspaces-db received no unrelated secrets"; else bad "workspaces-db has $leak unrelated secret variables in its environment"; fi

# ------------------------------------------------------------------- routing
head_ "Routing through $BASE"
check_route() {
  local path=$1 want=$2 label=$3 got
  got=$(code_of "$BASE$path")
  case ",$want," in
    *,"$got",*) ok "$label ($path → $got)" ;;
    *) bad "$label ($path → $got, expected $want)" ;;
  esac
}
check_route /                       200      "web app"
check_route /some/deep/link         200      "web app deep link (SPA fallback)"
check_route /god-mode/              200      "admin app"
check_route /spaces/                200      "public spaces app"
check_route /api/instances/         200      "api"
check_route /auth/get-csrf-token/   200      "auth"
check_route /live/health            200      "live server"
check_route /uploads/               403,200  "MinIO bucket route"
if [ "$SCHEME" = "https" ]; then
  redir=$("${CURL[@]}" -o /dev/null -w '%{http_code} %{redirect_url}' "http://$HOST/" 2>/dev/null || true)
  case "$redir" in
    301\ https://*|308\ https://*) ok "http redirects to https" ;;
    *) bad "http://$HOST/ did not redirect to https ($redir)" ;;
  esac
  if "${CURL[@]}" -D - -o /dev/null "$BASE/" 2>/dev/null | grep -qi '^strict-transport-security'; then ok "HSTS header present"; else bad "no Strict-Transport-Security header from the edge"; fi
fi

# ------------------------------------------------- forwarded scheme (login)
# Django's CSRF check compares the Origin header with the scheme and host it
# believes the request has. Over https that scheme only comes from the
# X-Forwarded-Proto header the edge sets, so a CSRF failure here is the login
# problem the guide describes. Over plain http the comparison is trivially
# true, so the probe is only run for https.
head_ "Forwarded scheme (the login check)"
if [ "$SCHEME" != "https" ]; then
  printf '  - skipped: only meaningful over https\n'
else
jar=$(mktemp)
token=$("${CURL[@]}" -c "$jar" "$BASE/auth/get-csrf-token/" 2>/dev/null | sed -E 's/.*"csrf_token":"([^"]+)".*/\1/')
if [ -z "$token" ] || [ "${#token}" -lt 20 ]; then
  bad "could not obtain a CSRF token from $BASE/auth/get-csrf-token/"
else
  login=$("${CURL[@]}" -b "$jar" -o /dev/null -w '%{http_code}' \
    -H "Origin: $BASE" -H "Referer: $BASE/" -H "X-CSRFToken: $token" \
    --data-urlencode "email=verify@example.invalid" --data-urlencode "password=not-a-real-password" \
    --data-urlencode "csrfmiddlewaretoken=$token" "$BASE/auth/sign-in/" 2>/dev/null || echo 000)
  if [ "$login" = "302" ]; then
    ok "Django accepted the request's origin (X-Forwarded-Proto reaches it; sign-in can work)"
  else
    bad "sign-in probe returned $login instead of a redirect" "A CSRF failure here means the edge is not forwarding X-Forwarded-Proto, or CORS_ALLOWED_ORIGINS does not match $BASE"
  fi
fi
rm -f "$jar"
fi

# ------------------------------------------------------------- upload limit
head_ "Upload limit"
limit=$(printf '%s\n' "$api_env" | sed -n 's/^FILE_SIZE_LIMIT=//p')
limit=${limit:-5242880}
big=$(mktemp)
head -c $((limit + 1024)) /dev/zero > "$big"
got=$(code_of -X POST --data-binary "@$big" "$BASE/api/instances/")
rm -f "$big"
if [ "$got" = "413" ]; then ok "body of FILE_SIZE_LIMIT+1KB rejected with 413"; else bad "oversized body got $got, expected 413 (check client_max_body_size in nginx and FILE_SIZE_LIMIT)"; fi

# ---------------------------------------------------------------- websockets
head_ "WebSockets"
ws=$("${CURL[@]}" --http1.1 --max-time 4 -i -N -o - \
  -H "Connection: Upgrade" -H "Upgrade: websocket" -H "Sec-WebSocket-Version: 13" \
  -H "Sec-WebSocket-Key: dGhlIHNhbXBsZSBub25jZQ==" "$BASE/live/collaboration" 2>/dev/null | head -1 || true)
case "$ws" in
  *101*) ok "upgrade to websocket on /live/collaboration" ;;
  *) bad "websocket upgrade failed ($ws)" "pages will load but never sync; check the Upgrade/Connection headers in nginx.conf" ;;
esac

# ------------------------------------------------------------ beat schedule
head_ "Scheduler"
tasks=$(docker compose exec -T api python manage.py shell -c "from django_celery_beat.models import PeriodicTask; print(PeriodicTask.objects.filter(name__startswith='engineering-ops', enabled=True).count())" 2>/dev/null | tr -d '\r' | tail -1)
if [ "${tasks:-0}" -ge 4 ]; then ok "$tasks engineering-ops reminders registered and enabled"; else bad "only ${tasks:-0} engineering-ops reminders registered (beat has not synced yet, or is down)"; fi

# ------------------------------------------------------------------- summary
printf '\n\033[1m%d passed, %d failed\033[0m\n' "$pass" "$fail"
exit "$fail"
