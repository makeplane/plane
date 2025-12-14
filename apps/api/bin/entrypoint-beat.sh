#!/bin/bash
#
# Native Entrypoint Script for Celery Beat Scheduler
#
# This script starts the Celery beat scheduler for periodic task execution.
# It ensures the database is available and migrations are complete before starting.
#
# Usage:
#   ./entrypoint-beat.sh
#
# Environment Variables:
#   - DJANGO_SETTINGS_MODULE: Django settings module (default: plane.settings.production)
#   - CELERY_LOG_LEVEL: Celery log level (default: info)
#
# Prerequisites:
#   - Database connection configured in Django settings
#   - Redis available (for Celery broker and result backend)
#

set -e  # Exit on any error

# Get the script directory and project root
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
API_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Activate virtual environment if it exists
if [ -f "$API_DIR/venv/bin/activate" ]; then
    source "$API_DIR/venv/bin/activate"
fi

# Use Python from venv if available, otherwise use python3
if [ -f "$API_DIR/venv/bin/python" ]; then
    PYTHON_CMD="$API_DIR/venv/bin/python"
elif command -v python3 >/dev/null 2>&1; then
    PYTHON_CMD="python3"
elif command -v python >/dev/null 2>&1; then
    PYTHON_CMD="python"
else
    echo "Error: Python not found. Please install Python 3.12 or activate virtual environment." >&2
    exit 1
fi

# Change to API directory
cd "$API_DIR"

# Wait for database to be available
echo "Waiting for database connection..."
$PYTHON_CMD manage.py wait_for_db

# Wait for migrations to complete
echo "Waiting for database migrations..."
$PYTHON_CMD manage.py wait_for_migrations

# Set default Django settings if not provided
export DJANGO_SETTINGS_MODULE="${DJANGO_SETTINGS_MODULE:-plane.settings.production}"

# Set default Celery log level
export CELERY_LOG_LEVEL="${CELERY_LOG_LEVEL:-info}"

# Start Celery beat scheduler
echo "Starting Celery beat scheduler..."
exec celery -A plane beat -l "$CELERY_LOG_LEVEL"

