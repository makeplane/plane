#!/bin/bash
set -e

python manage.py wait_for_db
# Wait for migrations
python manage.py wait_for_migrations


# Run the processes
python manage.py run_automation_consumer \
  --queue ${AUTOMATION_EVENT_STREAM_QUEUE_NAME:-plane.event_stream.automations} \
  --prefetch ${AUTOMATION_EVENT_STREAM_PREFETCH:-10}