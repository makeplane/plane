#!/bin/bash
#
# Native Entrypoint Script for Database Migrator
#
# This script runs database migrations. It can be executed as a one-time operation
# or as part of the deployment process.
#
# Usage:
#   ./entrypoint-migrator.sh [--settings=plane.settings.production]
#
# Arguments:
#   --settings: Optional Django settings module (passed to migrate command)
#
# Environment Variables:
#   - DJANGO_SETTINGS_MODULE: Django settings module (default: plane.settings.production)
#
# Prerequisites:
#   - Database connection configured in Django settings
#

set -e  # Exit on any error

# Parse command line arguments
SETTINGS_ARG=""
if [ $# -gt 0 ]; then
    SETTINGS_ARG="$1"
fi

# Wait for database to be available
echo "Waiting for database connection..."
if [ -n "$SETTINGS_ARG" ]; then
    python manage.py wait_for_db "$SETTINGS_ARG"
else
    python manage.py wait_for_db
fi

# Set default Django settings if not provided
export DJANGO_SETTINGS_MODULE="${DJANGO_SETTINGS_MODULE:-plane.settings.production}"

# Run migrations
echo "Running database migrations..."
if [ -n "$SETTINGS_ARG" ]; then
    python manage.py migrate "$SETTINGS_ARG"
else
    python manage.py migrate
fi

echo "Migrations completed successfully!"

