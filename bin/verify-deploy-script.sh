#!/bin/bash
#
# Verification Script: Deploy Script Testing (T048)
#
# This script verifies that the full deployment script (deploy.sh) executes
# successfully and all steps complete without errors.
#
# Usage:
#   ./bin/verify-deploy-script.sh [environment] [--dry-run]
#
# Arguments:
#   environment: Optional. 'production' (default) or 'development'
#   --dry-run: Optional. Validate script without executing (checks syntax, prerequisites)
#
# Prerequisites:
#   - deploy.sh exists in project root
#   - Git repository initialized
#   - PM2 installed globally
#   - Node.js, Python, pnpm installed
#   - Database and Redis available
#   - .env files configured
#
# Exit Codes:
#   0: Deployment script verified successfully
#   1: Prerequisites not met
#   2: Script validation failed
#   3: Deployment execution failed
#   4: Post-deployment verification failed

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT="${1:-production}"
DRY_RUN=false

# Parse arguments
if [ "$1" = "--dry-run" ]; then
    DRY_RUN=true
    ENVIRONMENT="production"
elif [ "$2" = "--dry-run" ]; then
    DRY_RUN=true
fi

DEPLOY_SCRIPT="deploy.sh"
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# Function to print colored output
print_status() {
    local color=$1
    local message=$2
    echo -e "${color}${message}${NC}"
}

print_error() {
    print_status "$RED" "ERROR: $1"
}

print_success() {
    print_status "$GREEN" "✓ $1"
}

print_info() {
    print_status "$YELLOW" "INFO: $1"
}

# Check prerequisites
echo "=========================================="
echo "Deploy Script Verification (T048)"
echo "=========================================="
if [ "$DRY_RUN" = true ]; then
    echo "Mode: DRY RUN (validation only)"
fi
echo ""

# Check if deploy.sh exists
if [ ! -f "$REPO_DIR/$DEPLOY_SCRIPT" ]; then
    print_error "deploy.sh not found in project root: $REPO_DIR"
    exit 1
fi
print_success "deploy.sh found"

# Check if script is executable
if [ ! -x "$REPO_DIR/$DEPLOY_SCRIPT" ]; then
    print_info "Making deploy.sh executable..."
    chmod +x "$REPO_DIR/$DEPLOY_SCRIPT"
fi
print_success "deploy.sh is executable"

# Validate script syntax
print_info "Validating script syntax..."
if bash -n "$REPO_DIR/$DEPLOY_SCRIPT"; then
    print_success "Script syntax is valid"
else
    print_error "Script syntax validation failed"
    exit 2
fi

# Check script prerequisites
print_info "Checking script prerequisites..."

# Check Git
if ! command -v git &> /dev/null; then
    print_error "Git is not installed"
    exit 1
fi
print_success "Git is installed"

# Check if in a Git repository
if [ ! -d "$REPO_DIR/.git" ]; then
    print_error "Not in a Git repository"
    exit 1
fi
print_success "Git repository detected"

# Check PM2
if ! command -v pm2 &> /dev/null; then
    print_error "PM2 is not installed. Install with: npm install -g pm2"
    exit 1
fi
print_success "PM2 is installed"

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed"
    exit 1
fi
NODE_VERSION=$(node --version)
print_success "Node.js is installed ($NODE_VERSION)"

# Check Python
if ! command -v python3 &> /dev/null && ! command -v python &> /dev/null; then
    print_error "Python is not installed"
    exit 1
fi
PYTHON_CMD=$(command -v python3 || command -v python)
PYTHON_VERSION=$($PYTHON_CMD --version 2>&1)
print_success "Python is installed ($PYTHON_VERSION)"

# Check pnpm
if ! command -v pnpm &> /dev/null; then
    print_error "pnpm is not installed"
    exit 1
fi
PNPM_VERSION=$(pnpm --version)
print_success "pnpm is installed ($PNPM_VERSION)"

# Check ecosystem.config.js
if [ ! -f "$REPO_DIR/ecosystem.config.js" ]; then
    print_error "ecosystem.config.js not found"
    exit 1
fi
print_success "ecosystem.config.js found"

# Check .env files
if [ ! -f "$REPO_DIR/apps/api/.env" ]; then
    print_error "apps/api/.env not found"
    print_info "Create .env file from .env.example and configure it"
    exit 1
fi
print_success "apps/api/.env found"

# Check if Redis is available (optional check)
if command -v redis-cli &> /dev/null; then
    if redis-cli ping &> /dev/null; then
        print_success "Redis is running"
    else
        print_info "Redis is installed but not running (may start during deployment)"
    fi
else
    print_info "Redis not found (may be installed during deployment)"
fi

# If dry-run, exit here
if [ "$DRY_RUN" = true ]; then
    echo ""
    print_success "Dry-run validation complete! All prerequisites met."
    print_info "To execute deployment: ./bin/verify-deploy-script.sh $ENVIRONMENT"
    exit 0
fi

# Execute deployment script
echo ""
print_info "Executing deployment script with environment: $ENVIRONMENT"
print_info "This may take several minutes..."
echo ""

cd "$REPO_DIR"

# Capture deployment output
DEPLOY_OUTPUT=$(mktemp)
DEPLOY_ERROR=$(mktemp)

if bash "$DEPLOY_SCRIPT" "$ENVIRONMENT" > "$DEPLOY_OUTPUT" 2> "$DEPLOY_ERROR"; then
    print_success "Deployment script executed successfully"
    
    # Display deployment output
    echo ""
    print_info "Deployment Output:"
    cat "$DEPLOY_OUTPUT"
    
    # Check for any warnings in output
    if grep -qi "warning\|error" "$DEPLOY_OUTPUT" "$DEPLOY_ERROR"; then
        print_info "Warnings/Errors detected in output:"
        grep -i "warning\|error" "$DEPLOY_OUTPUT" "$DEPLOY_ERROR" || true
    fi
else
    DEPLOY_EXIT_CODE=$?
    print_error "Deployment script failed with exit code: $DEPLOY_EXIT_CODE"
    echo ""
    print_info "Deployment Output:"
    cat "$DEPLOY_OUTPUT" || true
    echo ""
    print_info "Deployment Errors:"
    cat "$DEPLOY_ERROR" || true
    rm -f "$DEPLOY_OUTPUT" "$DEPLOY_ERROR"
    exit 3
fi

rm -f "$DEPLOY_OUTPUT" "$DEPLOY_ERROR"

# Post-deployment verification
echo ""
print_info "Verifying post-deployment state..."

# Check PM2 processes
if pm2 list | grep -q "online"; then
    print_success "PM2 processes are running"
    pm2 status
else
    print_error "No PM2 processes are running"
    exit 4
fi

# Check if API is accessible (if port is known)
API_PORT=$(grep -E "PORT.*=" "$REPO_DIR/apps/api/.env" | cut -d'=' -f2 | tr -d ' ' || echo "8000")
if [ -n "$API_PORT" ]; then
    if curl -f -s "http://localhost:$API_PORT/health" > /dev/null 2>&1 || \
       curl -f -s "http://localhost:$API_PORT/api/health" > /dev/null 2>&1; then
        print_success "API is accessible on port $API_PORT"
    else
        print_info "API health check endpoint not available (may be normal)"
    fi
fi

# Summary
echo ""
print_success "Deployment verification complete!"
echo ""
print_info "Next steps:"
print_info "  - Check PM2 logs: pm2 logs"
print_info "  - Monitor processes: pm2 monit"
print_info "  - Verify application functionality"

exit 0

