#!/bin/bash
# Local Development Setup Script
# Sets up PostgreSQL and Redis natively via Homebrew

set -e

echo "=== Plane Local Development Setup ==="
echo "This script sets up native PostgreSQL and Redis for local development."
echo ""

# Check for Homebrew
if ! command -v brew &> /dev/null; then
    echo "Error: Homebrew is not installed. Install from https://brew.sh"
    exit 1
fi

# Install PostgreSQL if not present
if ! command -v psql &> /dev/null; then
    echo "Installing PostgreSQL..."
    brew install postgresql@15
    brew services start postgresql@15
    echo "PostgreSQL installed and started."
else
    echo "PostgreSQL already installed."
    brew services start postgresql@15 2>/dev/null || true
fi

# Install Redis if not present
if ! command -v redis-server &> /dev/null; then
    echo "Installing Redis..."
    brew install redis
    brew services start redis
    echo "Redis installed and started."
else
    echo "Redis already installed."
    brew services start redis 2>/dev/null || true
fi

# Create database and user
echo ""
echo "Setting up PostgreSQL database..."
psql postgres -c "CREATE USER plane WITH PASSWORD 'plane' CREATEDB;" 2>/dev/null || echo "User 'plane' already exists"
psql postgres -c "CREATE DATABASE plane OWNER plane;" 2>/dev/null || echo "Database 'plane' already exists"
psql postgres -c "GRANT ALL PRIVILEGES ON DATABASE plane TO plane;" 2>/dev/null || true

# Create .env file if it doesn't exist
ENV_FILE="apps/api/.env"
if [ ! -f "$ENV_FILE" ]; then
    echo ""
    echo "Creating $ENV_FILE from template..."
    cat > "$ENV_FILE" << 'EOF'
# Local development configuration

# Database (PostgreSQL)
POSTGRES_USER=plane
POSTGRES_PASSWORD=plane
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=plane

# Redis
REDIS_URL=redis://localhost:6379

# App settings
DEBUG=1
SECRET_KEY=local-dev-secret-key-change-in-production
WEB_URL=http://localhost:3000

# Storage (configure for your environment)
# AWS_S3_BUCKET_NAME=uploads
# AWS_ACCESS_KEY_ID=
# AWS_SECRET_ACCESS_KEY=
# AWS_REGION=us-east-1
EOF
    echo "Created $ENV_FILE - edit as needed"
else
    echo ""
    echo "$ENV_FILE already exists - not overwriting"
fi

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Services running:"
echo "  - PostgreSQL: localhost:5432 (user: plane, password: plane, database: plane)"
echo "  - Redis: localhost:6379"
echo ""
echo "Next steps:"
echo "  1. cd apps/api"
echo "  2. pip install -r requirements.txt"
echo "  3. python manage.py migrate"
echo "  4. python manage.py runserver"
echo ""
echo "To start Celery worker (in separate terminal):"
echo "  cd apps/api && celery -A plane worker -l info"
echo ""
echo "To start Celery beat (in separate terminal):"
echo "  cd apps/api && celery -A plane beat -l info"
