#!/bin/bash
set -e

if [ "$(id -u)" = "0" ]; then
  exec su-exec plane "$0" "$@"
fi

echo "Starting Plane AI Celery Beat Scheduler..."

# Set default values if not provided
export CELERY_LOGLEVEL=${CELERY_LOGLEVEL:-info}
export CELERY_SCHEDULE_FILE=${CELERY_SCHEDULE_FILE:-/app/celerybeat-schedule/schedule.db}

echo "Log Level: $CELERY_LOGLEVEL"
echo "Schedule File: $CELERY_SCHEDULE_FILE"

# Ensure the schedule directory exists
mkdir -p $(dirname "$CELERY_SCHEDULE_FILE")

# Start the Celery beat scheduler
exec python -m pi.scripts.celery_runner beat --loglevel=$CELERY_LOGLEVEL --schedule=$CELERY_SCHEDULE_FILE