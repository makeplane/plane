#!/bin/bash
set -e

if [ "$(id -u)" = "0" ]; then
  chown -R plane:plane /code/plane/logs
  exec su-exec plane "$0" "$@"
fi

export SKIP_ENV_VAR=0

# Run consolidated startup
python manage.py startup cloud

exec gunicorn -w "$GUNICORN_WORKERS" -k uvicorn.workers.UvicornWorker plane.asgi:application --bind 0.0.0.0:"${PORT:-8000}" --max-requests 1200 --max-requests-jitter 1000 --access-logfile -
