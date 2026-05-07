#!/usr/bin/env bash
# Outer loop shim. Re-execs the in-repo deploy script each iteration so that
# changes to deploy/deploy.sh on origin/main take effect on the next pass.
#
# Installed to /root/deploy-loop.sh by deploy/install.sh and executed by
# the plane-deploy.service systemd unit. Stays out-of-repo on the host so
# that a broken push to deploy.sh can't brick the bootstrap.
set -u

REPO_DIR=/root/plane

while true; do
  if [ -x "$REPO_DIR/deploy/deploy.sh" ]; then
    "$REPO_DIR/deploy/deploy.sh" || echo "[deploy-loop] iteration failed (exit $?)"
  else
    echo "[deploy-loop] $REPO_DIR/deploy/deploy.sh missing or not executable"
  fi
  sleep 60
done
