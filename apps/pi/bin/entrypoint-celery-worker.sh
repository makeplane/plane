#!/bin/bash
set -e

echo "Starting Plane AI Celery Worker..."
export CELERY_CONCURRENCY=${CELERY_CONCURRENCY:-2}
export CELERY_LOGLEVEL=${CELERY_LOGLEVEL:-info}
export CELERY_QUEUE=${CELERY_QUEUE:-${CELERY_DEFAULT_QUEUE:-plane_pi_queue}}

echo "Concurrency: $CELERY_CONCURRENCY"
echo "Log Level: $CELERY_LOGLEVEL"
echo "Queue: $CELERY_QUEUE"

python -m pi.scripts.celery_runner worker --concurrency=$CELERY_CONCURRENCY --loglevel=$CELERY_LOGLEVEL --queue=$CELERY_QUEUE