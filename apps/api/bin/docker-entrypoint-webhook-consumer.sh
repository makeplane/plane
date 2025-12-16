#!/bin/bash
set -e

python manage.py wait_for_db
# Wait for migrations
python manage.py wait_for_migrations


# Run the processes
python manage.py run_webhook_consumer \
  --queue ${WEBHOOK_QUEUE_NAME:-plane.webhook} \
  --prefetch ${WEBHOOK_PREFETCH_COUNT:-10}