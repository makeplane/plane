#!/usr/bin/env bash
# Prepares a fresh Ubuntu LTS VPS: Docker, firewall, automatic security updates,
# swap, and the daily backup timer. Safe to run again. Run as root.
set -euo pipefail

[ "$(id -u)" -eq 0 ] || { echo "Run as root." >&2; exit 1; }
. /etc/os-release
[ "${ID:-}" = "ubuntu" ] || { echo "This script supports Ubuntu only." >&2; exit 1; }

install_dir="$(cd "$(dirname "$0")" && pwd)"

export DEBIAN_FRONTEND=noninteractive
apt-get update -y
apt-get install -y ca-certificates curl openssl ufw unattended-upgrades
dpkg-reconfigure -f noninteractive unattended-upgrades

if ! command -v docker >/dev/null 2>&1; then
  install -m 0755 -d /etc/apt/keyrings
  curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
  chmod a+r /etc/apt/keyrings/docker.asc
  echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu ${VERSION_CODENAME} stable" \
    >/etc/apt/sources.list.d/docker.list
  apt-get update -y
  apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin
fi
systemctl enable --now docker

# Tailscale connects outbound, so SSH is the only inbound port this host needs.
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw --force enable

# Plane's Python and Node services can spike past 8 GB during migrations and builds.
if [ ! -e /swapfile ]; then
  fallocate -l 4G /swapfile
  chmod 600 /swapfile
  mkswap /swapfile
  swapon /swapfile
  echo '/swapfile none swap sw 0 0' >>/etc/fstab
fi

cat >/etc/systemd/system/nexus-ops-backup.service <<EOF
[Unit]
Description=Nexus Operations off-server backup
Wants=network-online.target
After=network-online.target docker.service

[Service]
Type=oneshot
ExecStart=$install_dir/backup.sh
EOF

cat >/etc/systemd/system/nexus-ops-backup.timer <<EOF
[Unit]
Description=Daily Nexus Operations backup

[Timer]
OnCalendar=*-*-* 02:30:00
RandomizedDelaySec=15m
Persistent=true

[Install]
WantedBy=timers.target
EOF

systemctl daemon-reload
systemctl enable --now nexus-ops-backup.timer

echo "Bootstrap complete. Next: generate-env.sh, then set up the backup remote (README.md)."
