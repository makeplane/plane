#!/bin/bash
set -e

if [ "$1" = 'api' ]; then
    cd /app/api
    exec ./bin/docker-entrypoint-api.sh
elif [ "$1" = 'worker' ]; then
    cd /app/api
    exec ./bin/docker-entrypoint-worker.sh
elif [ "$1" = 'beat' ]; then
    cd /app/api
    exec ./bin/docker-entrypoint-beat.sh
elif [ "$1" = 'migrator' ]; then
    cd /app/api
    exec ./bin/docker-entrypoint-migrator.sh
else
    echo "Command not found"
    exit 1
fi