#!/bin/bash
set -e

python manage.py wait_for_db
# Wait for migrations
python manage.py wait_for_migrations


# Run the processes
python manage.py outbox_poller \
  --memory-limit ${OUTBOX_POLLER_MEMORY_LIMIT_MB:-512} \
  --interval-min ${OUTBOX_POLLER_INTERVAL_MIN:-0.25} \
  --interval-max ${OUTBOX_POLLER_INTERVAL_MAX:-10} \
  --batch-size ${OUTBOX_POLLER_BATCH_SIZE:-250} \
  --memory-check-interval ${OUTBOX_POLLER_MEMORY_CHECK_INTERVAL:-30}