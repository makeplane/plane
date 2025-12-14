#!/bin/bash
#
# Verification Script: PM2 Startup Testing (T042)
#
# This script verifies that PM2 can start all processes defined in ecosystem.config.js
# and that all processes (API, worker, beat, frontend) start successfully.
#
# Usage:
#   ./bin/verify-pm2-startup.sh [environment]
#
# Arguments:
#   environment: Optional. Either "development" (default) or "production"
#
# Prerequisites:
#   - PM2 installed globally: npm install -g pm2
#   - ecosystem.config.js exists in project root
#   - All entrypoint scripts exist and are executable
#   - Database and Redis are available (for API/worker/beat)
#   - Frontend dependencies installed (for web process)
#
# Exit Codes:
#   0: All processes started successfully
#   1: Prerequisites not met
#   2: PM2 startup failed
#   3: One or more processes failed to start
#   4: Process verification failed

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
ENVIRONMENT="${1:-development}"
ECOSYSTEM_FILE="ecosystem.config.js"
EXPECTED_PROCESSES=("api" "celery-worker" "celery-beat" "web")
MAX_STARTUP_WAIT=60  # seconds
CHECK_INTERVAL=2     # seconds

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
echo "PM2 Startup Verification (T042)"
echo "=========================================="
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

# Check if entrypoint scripts exist
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

# Check if web package.json exists (for frontend)
if [ ! -f "apps/web/package.json" ]; then
    print_error "Frontend package.json not found"
    exit 1
fi
print_success "Frontend package.json found"

# Stop any existing PM2 processes
print_info "Stopping any existing PM2 processes..."
pm2 delete all 2>/dev/null || true
pm2 kill 2>/dev/null || true
sleep 2

# Start PM2 with ecosystem config
print_info "Starting PM2 processes with environment: $ENVIRONMENT"
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
for process in "${EXPECTED_PROCESSES[@]}"; do
    if pm2 list | grep -q "$process.*online"; then
        print_success "$process is online"
        
        # Get process info
        RESTARTS=$(pm2 jlist | jq -r ".[] | select(.name==\"$process\") | .pm2_env.restart_time" 2>/dev/null || echo "0")
        UPTIME=$(pm2 jlist | jq -r ".[] | select(.name==\"$process\") | .pm2_env.pm_uptime" 2>/dev/null || echo "0")
        
        if [ "$RESTARTS" != "0" ] && [ "$RESTARTS" != "null" ]; then
            print_info "  - Restarts: $RESTARTS"
        fi
    else
        print_error "$process is not online"
        
        # Check if process exists but is errored
        if pm2 list | grep -q "$process"; then
            STATUS=$(pm2 jlist | jq -r ".[] | select(.name==\"$process\") | .pm2_env.status" 2>/dev/null || echo "unknown")
            print_error "  - Status: $STATUS"
            
            # Show recent logs
            print_info "  - Recent error logs:"
            pm2 logs "$process" --lines 10 --nostream --err 2>/dev/null || true
        fi
    fi
done

# Final verification
if [ "$ALL_STARTED" = true ]; then
    echo ""
    print_success "All processes started successfully!"
    echo ""
    print_info "PM2 Status Summary:"
    pm2 status
    echo ""
    print_info "To view logs: pm2 logs"
    print_info "To stop processes: pm2 stop all"
    print_info "To delete processes: pm2 delete all"
    exit 0
else
    echo ""
    print_error "One or more processes failed to start"
    echo ""
    print_info "PM2 Status:"
    pm2 status
    echo ""
    print_info "Check logs for details: pm2 logs"
    exit 3
fi

