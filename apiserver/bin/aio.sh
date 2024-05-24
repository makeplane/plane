#!/bin/bash
set -e

source /app/venv/bin/activate
cd /app/api

if [ "$1" = 'api' ]; then
    source /app/api/bin/docker-entrypoint-api.sh
elif [ "$1" = 'worker' ]; then
    source /app/api/bin/docker-entrypoint-worker.sh
elif [ "$1" = 'beat' ]; then
    source /app/api/bin/docker-entrypoint-beat.sh
elif [ "$1" = 'migrator' ]; then
    source /app/api/bin/docker-entrypoint-migrator.sh
else
    echo "Command not found"
    exit 1
fi