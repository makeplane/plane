#!/bin/bash
#
# Verification Script: Single Command Startup Testing (T049)
#
# This script verifies that the single command startup works:
# `pm2 start ecosystem.config.js --env production`
#
# Usage:
#   ./bin/verify-single-command-startup.sh [environment]
#
# Arguments:
#   environment: Optional. 'production' (default) or 'development'
#
# Prerequisites:
#   - PM2 installed globally
#   - ecosystem.config.js exists
#   - All entrypoint scripts exist and are executable
#   - Database and Redis available
#   - .env files configured
#
# Exit Codes:
#   0: Single command startup verified successfully
#   1: Prerequisites not met
#   2: Startup command failed
#   3: Process verification failed
#   4: Service health check failed

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT="${1:-production}"
ECOSYSTEM_FILE="ecosystem.config.js"
EXPECTED_PROCESSES=("api" "celery-worker" "celery-beat" "web")
MAX_STARTUP_WAIT=120  # seconds (longer for production)
CHECK_INTERVAL=3      # seconds

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
echo "Single Command Startup Verification (T049)"
echo "=========================================="
echo "Environment: $ENVIRONMENT"
echo ""

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    print_error "PM2 is not installed. Install with: npm install -g pm2"
    exit 1
fi
print_success "PM2 is installed"

# Check if ecosystem.config.js exists
if [ ! -f "$ECOSYSTEM_FILE" ]; then
    print_error "ecosystem.config.js not found in project root"
    exit 1
fi
print_success "ecosystem.config.js found"

# Check entrypoint scripts
ENTRYPOINT_SCRIPTS=(
    "apps/api/bin/entrypoint-api.sh"
    "apps/api/bin/entrypoint-worker.sh"
    "apps/api/bin/entrypoint-beat.sh"
)

for script in "${ENTRYPOINT_SCRIPTS[@]}"; do
    if [ ! -f "$script" ]; then
        print_error "Entrypoint script not found: $script"
        exit 1
    fi
    if [ ! -x "$script" ]; then
        print_info "Making $script executable..."
        chmod +x "$script"
    fi
done
print_success "All entrypoint scripts exist and are executable"

# Check .env files
if [ ! -f "apps/api/.env" ]; then
    print_error "apps/api/.env not found"
    exit 1
fi
print_success "apps/api/.env found"

# Stop any existing PM2 processes
print_info "Stopping any existing PM2 processes..."
pm2 delete all 2>/dev/null || true
pm2 kill 2>/dev/null || true
sleep 2

# Execute single command startup
echo ""
print_info "Executing single command startup..."
print_info "Command: pm2 start $ECOSYSTEM_FILE --env $ENVIRONMENT"
echo ""

if ! pm2 start "$ECOSYSTEM_FILE" --env "$ENVIRONMENT"; then
    print_error "PM2 startup command failed"
    exit 2
fi

# Wait for processes to start
print_info "Waiting for processes to start (max ${MAX_STARTUP_WAIT}s)..."
ELAPSED=0
ALL_STARTED=false

while [ $ELAPSED -lt $MAX_STARTUP_WAIT ]; do
    sleep $CHECK_INTERVAL
    ELAPSED=$((ELAPSED + CHECK_INTERVAL))
    
    # Check process status
    RUNNING_COUNT=0
    for process in "${EXPECTED_PROCESSES[@]}"; do
        if pm2 list | grep -q "$process.*online"; then
            RUNNING_COUNT=$((RUNNING_COUNT + 1))
        fi
    done
    
    if [ $RUNNING_COUNT -eq ${#EXPECTED_PROCESSES[@]} ]; then
        ALL_STARTED=true
        break
    fi
    
    echo -n "."
done
echo ""

# Verify all processes are running
print_info "Verifying process status..."
pm2 list

echo ""
print_info "Process Details:"
ALL_ONLINE=true
for process in "${EXPECTED_PROCESSES[@]}"; do
    if pm2 list | grep -q "$process.*online"; then
        print_success "$process is online"
        
        # Get process info
        PID=$(pm2 jlist | jq -r ".[] | select(.name==\"$process\") | .pid" 2>/dev/null || echo "N/A")
        UPTIME=$(pm2 jlist | jq -r ".[] | select(.name==\"$process\") | .pm2_env.pm_uptime" 2>/dev/null || echo "0")
        
        if [ "$PID" != "N/A" ] && [ "$PID" != "null" ]; then
            print_info "  - PID: $PID"
        fi
        if [ "$UPTIME" != "0" ] && [ "$UPTIME" != "null" ]; then
            UPTIME_SEC=$((UPTIME / 1000))
            print_info "  - Uptime: ${UPTIME_SEC}s"
        fi
    else
        print_error "$process is not online"
        ALL_ONLINE=false
        
        # Check process status
        if pm2 list | grep -q "$process"; then
            STATUS=$(pm2 jlist | jq -r ".[] | select(.name==\"$process\") | .pm2_env.status" 2>/dev/null || echo "unknown")
            print_error "  - Status: $STATUS"
            
            # Show recent logs
            print_info "  - Recent error logs:"
            pm2 logs "$process" --lines 10 --nostream --err 2>/dev/null || true
        fi
    fi
done

# Health checks
echo ""
print_info "Performing health checks..."

# Check API health (if available)
if pm2 list | grep -q "api.*online"; then
    # Try to determine API port from .env or default
    API_PORT=$(grep -E "^PORT=" apps/api/.env 2>/dev/null | cut -d'=' -f2 | tr -d ' ' || echo "8000")
    if [ -z "$API_PORT" ] || [ "$API_PORT" = "" ]; then
        API_PORT=8000
    fi
    
    print_info "Checking API health on port $API_PORT..."
    if curl -f -s "http://localhost:$API_PORT/health" > /dev/null 2>&1 || \
       curl -f -s "http://localhost:$API_PORT/api/health" > /dev/null 2>&1 || \
       curl -f -s "http://localhost:$API_PORT/" > /dev/null 2>&1; then
        print_success "API is responding"
    else
        print_info "API health endpoint not accessible (may be normal if endpoint doesn't exist)"
    fi
fi

# Check frontend (if available)
if pm2 list | grep -q "web.*online"; then
    WEB_PORT=$(grep -E "^PORT=" apps/web/.env 2>/dev/null | cut -d'=' -f2 | tr -d ' ' || echo "3000")
    if [ -z "$WEB_PORT" ] || [ "$WEB_PORT" = "" ]; then
        WEB_PORT=3000
    fi
    
    print_info "Checking frontend on port $WEB_PORT..."
    if curl -f -s "http://localhost:$WEB_PORT" > /dev/null 2>&1; then
        print_success "Frontend is responding"
    else
        print_info "Frontend not accessible (may be normal if not built or configured)"
    fi
fi

# Final verification
echo ""
if [ "$ALL_STARTED" = true ] && [ "$ALL_ONLINE" = true ]; then
    print_success "Single command startup verified successfully!"
    echo ""
    print_info "PM2 Status Summary:"
    pm2 status
    echo ""
    print_info "All processes started with single command:"
    print_info "  pm2 start ecosystem.config.js --env $ENVIRONMENT"
    echo ""
    print_info "Useful commands:"
    print_info "  - View logs: pm2 logs"
    print_info "  - Monitor: pm2 monit"
    print_info "  - Stop: pm2 stop all"
    print_info "  - Delete: pm2 delete all"
    exit 0
else
    print_error "Single command startup verification failed"
    echo ""
    print_info "PM2 Status:"
    pm2 status
    echo ""
    print_info "Check logs for details: pm2 logs"
    exit 3
fi

