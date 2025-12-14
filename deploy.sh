#!/bin/bash
#
# FamilyFlow Deployment Script for Digital Ocean Droplet
#
# This script automates the deployment process for FamilyFlow on a Digital Ocean droplet.
# It handles dependency installation, migrations, builds, and PM2 process management.
# Note: This script deploys from the current directory. Run git pull manually before executing.
#
# Usage:
#   ./deploy.sh [environment]
#
# Arguments:
#   environment: Optional. 'production' (default) or 'development'
#
# Prerequisites:
#   - Application code in current directory (run git pull manually if needed)
#   - PM2 installed globally (npm install -g pm2)
#   - Node.js 22+, Python 3.12, pnpm installed
#   - Redis running as system service (for caching and Celery broker)
#   - .env file configured in apps/api/.env
#
# Example:
#   ./deploy.sh production
#
# For detailed deployment instructions, see:
#   - specs/001-family-management/DEPLOYMENT.md (when created)
#   - specs/001-family-management/quickstart.md
#

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT=${1:-production}
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
API_DIR="${REPO_DIR}/apps/api"
WEB_DIR="${REPO_DIR}/apps/web"

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}FamilyFlow Deployment Script${NC}"
echo -e "${GREEN}Environment: ${ENVIRONMENT}${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Ensure we're in the correct directory
cd "${REPO_DIR}"

# Step 1: Install/update dependencies
echo -e "${YELLOW}[1/5] Installing/updating dependencies...${NC}"

# Install Python dependencies
echo "  Installing Python dependencies..."
cd "${API_DIR}"
if [ -f "requirements/production.txt" ]; then
    pip install -r requirements/production.txt --quiet
elif [ -f "requirements.txt" ]; then
    pip install -r requirements.txt --quiet
else
    echo -e "${RED}Error: No requirements file found in ${API_DIR}${NC}"
    exit 1
fi
echo -e "${GREEN}  ✓ Python dependencies installed${NC}"

# Install Node.js dependencies
echo "  Installing Node.js dependencies..."
cd "${REPO_DIR}"
pnpm install --frozen-lockfile
echo -e "${GREEN}  ✓ Node.js dependencies installed${NC}"
echo ""

# Step 2: Run database migrations
echo -e "${YELLOW}[2/5] Running database migrations...${NC}"
cd "${API_DIR}"

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo -e "${RED}Error: .env file not found in ${API_DIR}${NC}"
    echo "Please create .env file from .env.example and configure it."
    exit 1
fi

# Run migrations
python manage.py migrate --noinput
echo -e "${GREEN}✓ Migrations completed${NC}"
echo ""

# Step 3: Build frontend
echo -e "${YELLOW}[3/5] Building frontend...${NC}"
cd "${WEB_DIR}"

# Check if .env file exists for frontend
if [ ! -f ".env" ]; then
    echo -e "${YELLOW}Warning: .env file not found in ${WEB_DIR}, using defaults${NC}"
fi

# Build frontend
pnpm build
echo -e "${GREEN}✓ Frontend built${NC}"
echo ""

# Step 4: Collect static files (Django)
echo -e "${YELLOW}[4/5] Collecting Django static files...${NC}"
cd "${API_DIR}"

# Set Django settings module based on environment
if [ "${ENVIRONMENT}" = "production" ]; then
    export DJANGO_SETTINGS_MODULE="plane.settings.production"
else
    export DJANGO_SETTINGS_MODULE="plane.settings.local"
fi

python manage.py collectstatic --noinput
echo -e "${GREEN}✓ Static files collected${NC}"
echo ""

# Step 5: Restart PM2 processes
echo -e "${YELLOW}[5/5] Restarting PM2 processes...${NC}"

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo -e "${RED}Error: PM2 is not installed. Install it with: npm install -g pm2${NC}"
    exit 1
fi

cd "${REPO_DIR}"

# Check if ecosystem.config.js exists
if [ ! -f "ecosystem.config.js" ]; then
    echo -e "${RED}Error: ecosystem.config.js not found in ${REPO_DIR}${NC}"
    exit 1
fi

# Stop existing processes (if running)
pm2 stop ecosystem.config.js --env "${ENVIRONMENT}" 2>/dev/null || true

# Delete existing processes (clean slate)
pm2 delete ecosystem.config.js --env "${ENVIRONMENT}" 2>/dev/null || true

# Start processes with new configuration
pm2 start ecosystem.config.js --env "${ENVIRONMENT}"

# Save PM2 configuration for auto-start on boot
pm2 save

echo -e "${GREEN}✓ PM2 processes restarted${NC}"
echo ""

# Display PM2 status
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Deployment Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "PM2 Process Status:"
pm2 status
echo ""
echo "View logs with: pm2 logs"
echo "Monitor processes with: pm2 monit"
echo ""

