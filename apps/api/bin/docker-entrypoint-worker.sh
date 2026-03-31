#!/bin/bash
set -e

if [ "$(id -u)" = "0" ]; then
  chown -R plane:plane /code/plane/logs
  exec su-exec plane "$0" "$@"
fi

python manage.py wait_for_db
# Wait for migrations
python manage.py wait_for_migrations
# Run the processes
celery -A plane worker -l ${LOG_LEVEL:-INFO}