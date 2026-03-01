#!/bin/bash
set -e

if [ "$(id -u)" = "0" ]; then
  chown -R plane:plane /code/plane/logs
  exec su-exec plane "$0" "$@"
fi

# Collect system information
HOSTNAME=$(hostname)
MAC_ADDRESS=$(ip link show | awk '/ether/ {print $2}' | head -n 1)
CPU_INFO=$(cat /proc/cpuinfo)
MEMORY_INFO=$(free -h)
DISK_INFO=$(df -h)

# Concatenate information and compute SHA-256 hash
SIGNATURE=$(echo "$HOSTNAME$MAC_ADDRESS$CPU_INFO$MEMORY_INFO$DISK_INFO" | sha256sum | awk '{print $1}')

# Export the variables
MACHINE_SIGNATURE=${MACHINE_SIGNATURE:-$SIGNATURE}
export SKIP_ENV_VAR=1

# Run consolidated startup
python manage.py startup commercial --machine-signature "$MACHINE_SIGNATURE"

exec gunicorn -w "$GUNICORN_WORKERS" -k uvicorn.workers.UvicornWorker plane.asgi:application --bind 0.0.0.0:"${PORT:-8000}" --max-requests 1200 --max-requests-jitter 1000 --access-logfile -
