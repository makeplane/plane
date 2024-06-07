#!/bin/bash
set -e


if [ "$1" = 'api' ]; then
    source /app/venv/bin/activate
    cd /app/api
    exec ./bin/docker-entrypoint-api.sh
elif [ "$1" = 'worker' ]; then
    source /app/venv/bin/activate
    cd /app/api
    exec ./bin/docker-entrypoint-worker.sh
elif [ "$1" = 'beat' ]; then
    source /app/venv/bin/activate
    cd /app/api
    exec ./bin/docker-entrypoint-beat.sh
elif [ "$1" = 'migrator' ]; then
    source /app/venv/bin/activate
    cd /app/api
    exec ./bin/docker-entrypoint-migrator.sh
elif [ "$1" = 'web' ]; then
    node /app/web/web/server.js
elif [ "$1" = 'space' ]; then
    node /app/space/space/server.js
elif [ "$1" = 'admin' ]; then
    node /app/admin/admin/server.js
else
    echo "Command not found"
    exit 1
fi