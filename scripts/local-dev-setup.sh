#!/bin/bash
# Local Development Setup Script
# Sets up PostgreSQL and Redis natively via Homebrew (no Docker needed)

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
    # Start if not running
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
    # Start if not running
    brew services start redis 2>/dev/null || true
fi

# Create database and user
echo ""
echo "Setting up PostgreSQL database..."
psql postgres -c "CREATE USER plane WITH PASSWORD 'plane' CREATEDB;" 2>/dev/null || echo "User 'plane' already exists"
psql postgres -c "CREATE DATABASE plane OWNER plane;" 2>/dev/null || echo "Database 'plane' already exists"
psql postgres -c "GRANT ALL PRIVILEGES ON DATABASE plane TO plane;" 2>/dev/null || true

# Check if LocalStack is needed for S3
echo ""
read -p "Do you need S3 storage for file uploads? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "Installing LocalStack for S3 emulation..."
    if ! command -v localstack &> /dev/null; then
        brew install localstack
    fi
    # Create the init script
    mkdir -p /tmp/localstack-init
    cat > /tmp/localstack-init/init-aws.sh << 'EOF'
#!/bin/bash
awslocal s3 mb s3://uploads || true
EOF
    chmod +x /tmp/localstack-init/init-aws.sh

    echo "Starting LocalStack..."
    SERVICES=s3 localstack start -d
    sleep 5
    awslocal s3 mb s3://uploads 2>/dev/null || true
    echo "LocalStack running with S3 bucket 'uploads'"
fi

# Create .env file if it doesn't exist
ENV_FILE="apps/api/.env"
if [ ! -f "$ENV_FILE" ]; then
    echo ""
    echo "Creating $ENV_FILE from template..."
    cat > "$ENV_FILE" << 'EOF'
# Simplified local development configuration
# No RabbitMQ, no MongoDB, no Minio

# Database (PostgreSQL)
POSTGRES_USER=plane
POSTGRES_PASSWORD=plane
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
POSTGRES_DB=plane

# Redis (for live collaboration service)
REDIS_URL=redis://localhost:6379

# Storage - LocalStack S3 emulation
USE_LOCALSTACK=1
AWS_S3_ENDPOINT_URL=http://localhost:4566
AWS_S3_BUCKET_NAME=uploads
AWS_ACCESS_KEY_ID=test
AWS_SECRET_ACCESS_KEY=test
AWS_REGION=us-east-1

# App settings
DEBUG=1
SECRET_KEY=local-dev-secret-key-change-in-production
WEB_URL=http://localhost:3000

# Email (optional - use console backend for local dev)
# EMAIL_HOST=smtp.example.com
# EMAIL_HOST_USER=
# EMAIL_HOST_PASSWORD=
# EMAIL_PORT=587
# EMAIL_USE_TLS=1
# DEFAULT_FROM_EMAIL=noreply@example.com
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
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "  - LocalStack S3: localhost:4566 (bucket: uploads)"
fi
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
