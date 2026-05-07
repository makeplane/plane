#!/usr/bin/env bash
# One-shot installer. Idempotent. Re-run after editing deploy-loop.sh
# or plane-deploy.service in this directory to refresh the host copies.
#
# Does NOT touch /root/plane.env (secrets stay manual). See plane.env.example
# for the expected schema.
set -euo pipefail

REPO_DIR=/root/plane
HERE="$(cd "$(dirname "$0")" && pwd)"

if [ "$(id -u)" -ne 0 ]; then
  echo "install.sh must run as root (writes /etc/systemd/system/)" >&2
  exit 1
fi

install -m 0755 "$HERE/deploy-loop.sh" /root/deploy-loop.sh
install -m 0644 "$HERE/plane-deploy.service" /etc/systemd/system/plane-deploy.service

systemctl daemon-reload

if [ ! -f /root/plane.env ]; then
  echo "Note: /root/plane.env not found. Copy and fill in deploy/plane.env.example before starting the service." >&2
fi

echo "Installed. Start with: systemctl enable --now plane-deploy.service"
