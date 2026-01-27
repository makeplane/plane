#!/bin/bash
set -e

echo "Waiting for database..."
python manage.py wait_for_db

echo "Running database migrations..."
python manage.py migrate

echo "Collecting static files..."
python manage.py collectstatic --noinput || true

# Collect system information for machine signature
HOSTNAME=$(hostname)
MAC_ADDRESS=$(ip link show 2>/dev/null | awk '/ether/ {print $2}' | head -n 1 || echo "unknown")
SIGNATURE=$(echo "$HOSTNAME$MAC_ADDRESS$(date +%s)" | sha256sum | awk '{print $1}')
export MACHINE_SIGNATURE=$SIGNATURE

echo "Registering instance..."
python manage.py register_instance "$MACHINE_SIGNATURE" || true

echo "Configuring instance..."
python manage.py configure_instance || true

echo "Creating default bucket..."
python manage.py create_bucket || true

echo "Clearing cache..."
python manage.py clear_cache || true

echo "Starting Gunicorn server..."
exec gunicorn -w 4 -k uvicorn.workers.UvicornWorker plane.asgi:application --bind 0.0.0.0:8000 --access-logfile -
