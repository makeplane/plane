#!/bin/bash
set -e

export SKIP_ENV_VAR=0

python manage.py wait_for_db
# Wait for migrations
python manage.py wait_for_migrations

# Clear Cache before starting to remove stale values
python manage.py clear_cache

# Register instance
python manage.py setup_instance $INSTANCE_ADMIN_EMAIL

exec gunicorn -w "$GUNICORN_WORKERS" -k uvicorn.workers.UvicornWorker plane.asgi:application --bind 0.0.0.0:"${PORT:-8000}" --max-requests 1200 --max-requests-jitter 1000 --access-logfile -