#!/bin/bash
set -e

if [ "$(id -u)" = "0" ]; then
  exec su-exec plane "$0" "$@"
fi

echo "Starting Plane AI API server..."

# Set default values if not provided
export FASTAPI_APP_HOST=${FASTAPI_APP_HOST:-0.0.0.0}
export FASTAPI_APP_PORT=${FASTAPI_APP_PORT:-8000}

echo "API Host: $FASTAPI_APP_HOST"
echo "API Port: $FASTAPI_APP_PORT"

# Wait for database to be ready
python -m pi.manage wait-for-db

# Check for pending migrations (shows warning but continues)
echo "Checking for pending migrations..."
python -m pi.manage check-migrations

# Verify embedding dimension matches live OpenSearch indices
echo "Checking embedding dimension consistency..."
python -m pi.manage check-embedding-dimension

# Start the FastAPI application
exec python -m pi.manage runserver
