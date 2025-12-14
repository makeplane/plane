#!/bin/bash
#
# Native Entrypoint Script for Django API Server
#
# This script starts the Django API server using Gunicorn in production mode.
# It handles database readiness checks, migrations, instance registration,
# and static file collection before starting the server.
#
# Usage:
#   ./entrypoint-api.sh
#
# Environment Variables:
#   - DJANGO_SETTINGS_MODULE: Django settings module (default: plane.settings.production)
#   - PORT: Server port (default: 8000)
#   - GUNICORN_WORKERS: Number of Gunicorn workers (default: 4)
#
# Prerequisites:
#   - Database connection configured in Django settings
#   - Redis available (for caching and Celery broker)
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

# Detect operating system for cross-platform compatibility
detect_os() {
    case "$(uname -s)" in
        Linux*)     echo "linux";;
        Darwin*)    echo "macos";;
        *)          echo "unknown";;
    esac
}

# Generate machine signature (cross-platform)
# This creates a unique signature based on host system information
generate_machine_signature() {
    local OS=$(detect_os)
    local HOSTNAME=$(hostname)
    local MAC_ADDRESS=""
    local CPU_INFO=""
    local MEMORY_INFO=""
    local DISK_INFO=""
    local HASH_CMD=""

    # Get MAC address (first network interface)
    if [ "$OS" = "linux" ]; then
        MAC_ADDRESS=$(ip link show | awk '/ether/ {print $2}' | head -n 1 || echo "")
    elif [ "$OS" = "macos" ]; then
        MAC_ADDRESS=$(ifconfig | awk '/ether/ {print $2; exit}' || echo "")
    fi

    # Get CPU information
    if [ "$OS" = "linux" ]; then
        CPU_INFO=$(cat /proc/cpuinfo 2>/dev/null | head -20 || echo "")
    elif [ "$OS" = "macos" ]; then
        CPU_INFO=$(sysctl -n machdep.cpu.brand_string 2>/dev/null || echo "")
    fi

    # Get memory information
    if [ "$OS" = "linux" ]; then
        MEMORY_INFO=$(free -h 2>/dev/null || echo "")
    elif [ "$OS" = "macos" ]; then
        MEMORY_INFO=$(sysctl hw.memsize hw.physicalcpu 2>/dev/null || echo "")
    fi

    # Get disk information
    DISK_INFO=$(df -h 2>/dev/null | head -5 || echo "")

    # Choose hash command based on OS
    if [ "$OS" = "linux" ]; then
        HASH_CMD="sha256sum"
    elif [ "$OS" = "macos" ]; then
        HASH_CMD="shasum -a 256"
    else
        # Fallback: try both
        if command -v sha256sum >/dev/null 2>&1; then
            HASH_CMD="sha256sum"
        elif command -v shasum >/dev/null 2>&1; then
            HASH_CMD="shasum -a 256"
        else
            echo "Error: No SHA-256 hashing tool found (sha256sum or shasum)" >&2
            exit 1
        fi
    fi

    # Concatenate information and compute SHA-256 hash
    local SIGNATURE=$(echo "$HOSTNAME$MAC_ADDRESS$CPU_INFO$MEMORY_INFO$DISK_INFO" | $HASH_CMD | awk '{print $1}')

    echo "$SIGNATURE"
}

# Wait for database to be available
echo "Waiting for database connection..."
$PYTHON_CMD manage.py wait_for_db

# Wait for migrations to complete
echo "Waiting for database migrations..."
$PYTHON_CMD manage.py wait_for_migrations

# Generate machine signature
echo "Generating machine signature..."
MACHINE_SIGNATURE=$(generate_machine_signature)
export MACHINE_SIGNATURE

# Register instance
echo "Registering instance..."
$PYTHON_CMD manage.py register_instance "$MACHINE_SIGNATURE"

# Load configuration variables
echo "Loading configuration..."
$PYTHON_CMD manage.py configure_instance

# Create default bucket (for storage)
echo "Creating default storage bucket..."
$PYTHON_CMD manage.py create_bucket

# Clear cache before starting
echo "Clearing cache..."
$PYTHON_CMD manage.py clear_cache

# Collect static files (production only)
if [ "${DJANGO_SETTINGS_MODULE:-}" = "plane.settings.production" ] || [ "${NODE_ENV:-}" = "production" ]; then
    echo "Collecting static files..."
    $PYTHON_CMD manage.py collectstatic --noinput
fi

# Set default Django settings if not provided
export DJANGO_SETTINGS_MODULE="${DJANGO_SETTINGS_MODULE:-plane.settings.production}"

# Set default port
export PORT="${PORT:-8000}"

# Determine if we're in development mode
USE_DEVSERVER="${USE_DEVSERVER:-0}"
if [ "${DJANGO_SETTINGS_MODULE}" = "plane.settings.local" ] || [ "${DEBUG:-0}" = "1" ] || [ "${USE_DEVSERVER}" = "1" ]; then
    # Development mode: Use Django runserver
    echo "Starting Django development server on port ${PORT}..."
    exec $PYTHON_CMD manage.py runserver "0.0.0.0:${PORT}" --settings="${DJANGO_SETTINGS_MODULE}"
else
    # Production mode: Use Gunicorn
    # Set default Gunicorn workers
    export GUNICORN_WORKERS="${GUNICORN_WORKERS:-4}"
    
    echo "Starting Gunicorn server on port ${PORT} with ${GUNICORN_WORKERS} workers..."
    exec gunicorn \
        -w "$GUNICORN_WORKERS" \
        -k uvicorn.workers.UvicornWorker \
        plane.asgi:application \
        --bind "0.0.0.0:${PORT}" \
        --max-requests 1200 \
        --max-requests-jitter 1000 \
        --access-logfile - \
        --log-level info
fi

