#!/usr/bin/env bash
# Initialize Plane server directory structure on a fresh server.
# Run once on each target server (test, production, external VPS) before first deploy.
#
# Creates two directory trees:
#
#   1. Deploy dir (compose files, env, images):
#      /root/Documents/plane-offline-pack/plane-app/
#      ├── dist/       ← Docker image tar.gz archives
#      ├── scripts/    ← deploy scripts
#      └── archive/    ← old dist backups
#
#   2. Proxy config dir (Caddy reverse proxy):
#      /opt/shb-deploy/plane-app/proxy/
#      └── Caddyfile
#      /opt/certs/     ← TLS certificates (copy manually for internal servers)
#
# Usage: bash setup-server.sh [--domain <domain>] [--vps]
#   --domain   Caddy domain name (default: uat-jms.shinhan.com.vn)
#   --vps      External VPS mode: HTTP-only Caddyfile (no TLS cert required)

set -euo pipefail

PLANE_DIR="/root/Documents/plane-offline-pack/plane-app"
PROXY_DIR="/opt/shb-deploy/plane-app/proxy"
CERTS_DIR="/opt/certs"
DOMAIN="uat-jms.shinhan.com.vn"
VPS_MODE=false

# ── Parse args ────────────────────────────────────────────────────────────────
while [[ $# -gt 0 ]]; do
  case "$1" in
    --domain) DOMAIN="$2"; shift 2 ;;
    --vps)    VPS_MODE=true; shift ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

echo "========================================="
echo " Plane Server Setup"
echo "========================================="
echo " Deploy dir : ${PLANE_DIR}"
echo " Proxy dir  : ${PROXY_DIR}"
echo " Domain     : ${DOMAIN}"
echo " Mode       : $([ "${VPS_MODE}" = true ] && echo 'VPS (HTTP-only)' || echo 'Internal (HTTPS/TLS)')"
echo "========================================="
echo ""

# ── Create deploy directory structure ─────────────────────────────────────────
echo "[1/3] Creating deploy directory structure ..."
mkdir -p "${PLANE_DIR}/dist"
mkdir -p "${PLANE_DIR}/scripts"
mkdir -p "${PLANE_DIR}/archive"
echo "  ✓ ${PLANE_DIR}/dist/"
echo "  ✓ ${PLANE_DIR}/scripts/"
echo "  ✓ ${PLANE_DIR}/archive/"
echo ""

# ── Create proxy config directory + Caddyfile ─────────────────────────────────
echo "[2/3] Generating Caddyfile at ${PROXY_DIR}/Caddyfile ..."
mkdir -p "${PROXY_DIR}"
CADDYFILE="${PROXY_DIR}/Caddyfile"

if [ "${VPS_MODE}" = true ]; then
  # HTTP-only for external VPS (no TLS cert needed)
  cat > "${CADDYFILE}" << CADDY_EOF
${DOMAIN} {
    redir /live /live/
    redir /space /space/
    redir /god-mode /god-mode/

    reverse_proxy /api/* api:8000
    reverse_proxy /auth/* api:8000

    reverse_proxy /uploads* plane-minio:9000 {
        header_up Host {http.request.host}
    }

    reverse_proxy /live/* live:3000
    reverse_proxy /space* space:3000
    reverse_proxy /god-mode* admin:3000
    reverse_proxy * web:3000
}
CADDY_EOF
else
  # HTTPS with TLS cert — certs at /opt/certs/
  mkdir -p "${CERTS_DIR}"
  cat > "${CADDYFILE}" << CADDY_EOF
${DOMAIN} {
    tls ${CERTS_DIR}/STAR.shinhan.com.vn.chain.crt ${CERTS_DIR}/STAR.shinhan.com.vn.key

    redir /live /live/
    redir /space /space/
    redir /god-mode /god-mode/

    reverse_proxy /api/* api:8000
    reverse_proxy /auth/* api:8000

    reverse_proxy /uploads* plane-minio:9000 {
        header_up Host {http.request.host}
    }

    reverse_proxy /live/* live:3000
    reverse_proxy /space* space:3000
    reverse_proxy /god-mode* admin:3000
    reverse_proxy * web:3000
}
CADDY_EOF
  echo "  ⚠ Copy TLS certs to ${CERTS_DIR}/ before starting proxy:"
  echo "    ${CERTS_DIR}/STAR.shinhan.com.vn.chain.crt"
  echo "    ${CERTS_DIR}/STAR.shinhan.com.vn.key"
fi

echo "  ✓ ${CADDYFILE}"
echo ""

# ── Create placeholder plane.env if not exists ────────────────────────────────
echo "[3/3] Checking plane.env ..."
ENV_FILE="${PLANE_DIR}/plane.env"
if [ ! -f "${ENV_FILE}" ]; then
  cat > "${ENV_FILE}" << ENV_EOF
# Plane environment variables — fill in all values before deploying
SECRET_KEY=
DATABASE_URL=
REDIS_URL=
EMAIL_HOST=
EMAIL_HOST_USER=
EMAIL_HOST_PASSWORD=
AWS_S3_BUCKET_NAME=
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_S3_ENDPOINT_URL=
WEB_URL=https://${DOMAIN}
CORS_ALLOWED_ORIGINS=https://${DOMAIN}
ENV_EOF
  echo "  ✓ ${ENV_FILE} created (placeholder — fill in values before deploy)"
else
  echo "  ✓ ${ENV_FILE} already exists — skipped"
fi
echo ""

echo "========================================="
echo " Setup Complete"
echo "========================================="
echo ""
echo "Next steps:"
echo "  1. Edit ${ENV_FILE} with actual values"
if [ "${VPS_MODE}" = false ]; then
echo "  2. Copy TLS certs to ${CERTS_DIR}/"
fi
echo "  3. Transfer deploy package (from build machine):"
echo "     scp -r deploy/* user@server:${PLANE_DIR}/"
echo "  4. cd ${PLANE_DIR} && ./scripts/deploy-shb.sh"
echo ""
