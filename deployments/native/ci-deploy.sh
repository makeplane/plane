#!/usr/bin/env bash
# Forced command of the plane-ci SSH key (installed to /opt/plane/bin/ci-deploy by
# setup-host.sh). The GitHub workflow sends only the commit sha as the SSH command;
# it reaches deploy as one argument, so no options (like --initial) can be smuggled
# in, and deploy itself only accepts commits on origin/production.
set -euo pipefail
exec sudo -n -u plane /opt/plane/bin/deploy "${SSH_ORIGINAL_COMMAND:-}"
