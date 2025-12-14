#!/bin/bash
#
# Verification Script: PM2 Auto-Restart Testing (T043)
#
# This script verifies that PM2 automatically restarts processes when they crash.
# It intentionally crashes a process and verifies that PM2 restarts it.
#
# Usage:
#   ./bin/verify-pm2-autorestart.sh [process_name]
#
# Arguments:
#   process_name: Optional. Name of process to test (default: "api")
#
# Prerequisites:
#   - PM2 installed globally
#   - At least one process running via PM2
#   - Process must be configured with autorestart: true
#
# Exit Codes:
#   0: Auto-restart verified successfully
#   1: Prerequisites not met
#   2: Process crash simulation failed
#   3: Auto-restart verification failed
#   4: Process did not restart within timeout

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROCESS_NAME="${1:-api}"
MAX_RESTART_WAIT=30  # seconds
CHECK_INTERVAL=1     # seconds

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
echo "PM2 Auto-Restart Verification (T043)"
echo "=========================================="
echo ""

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    print_error "PM2 is not installed. Install with: npm install -g pm2"
    exit 1
fi

# Check if process is running
if ! pm2 list | grep -q "$PROCESS_NAME.*online"; then
    print_error "Process '$PROCESS_NAME' is not running. Start it first with: pm2 start ecosystem.config.js"
    exit 1
fi
print_success "Process '$PROCESS_NAME' is running"

# Get initial restart count
INITIAL_RESTARTS=$(pm2 jlist | jq -r ".[] | select(.name==\"$PROCESS_NAME\") | .pm2_env.restart_time" 2>/dev/null || echo "0")
if [ "$INITIAL_RESTARTS" = "null" ]; then
    INITIAL_RESTARTS=0
fi
print_info "Initial restart count: $INITIAL_RESTARTS"

# Get process PID
PROCESS_PID=$(pm2 jlist | jq -r ".[] | select(.name==\"$PROCESS_NAME\") | .pid" 2>/dev/null)
if [ -z "$PROCESS_PID" ] || [ "$PROCESS_PID" = "null" ]; then
    print_error "Could not get PID for process '$PROCESS_NAME'"
    exit 1
fi
print_info "Process PID: $PROCESS_PID"

# Check autorestart configuration
AUTORESTART=$(pm2 jlist | jq -r ".[] | select(.name==\"$PROCESS_NAME\") | .pm2_env.autorestart" 2>/dev/null || echo "false")
if [ "$AUTORESTART" != "true" ]; then
    print_error "Process '$PROCESS_NAME' does not have autorestart enabled"
    print_info "Update ecosystem.config.js to set autorestart: true for this process"
    exit 1
fi
print_success "Auto-restart is enabled for '$PROCESS_NAME'"

# Simulate process crash by killing the process
print_info "Simulating process crash (killing PID $PROCESS_PID)..."
if ! kill -9 "$PROCESS_PID" 2>/dev/null; then
    print_error "Failed to kill process. It may have already crashed."
    # Check if process is still running
    if ! pm2 list | grep -q "$PROCESS_NAME.*online"; then
        print_info "Process is not online, proceeding with restart check..."
    else
        exit 2
    fi
else
    print_success "Process killed successfully"
fi

# Wait for PM2 to detect the crash and restart
print_info "Waiting for PM2 to restart the process (max ${MAX_RESTART_WAIT}s)..."
ELAPSED=0
RESTARTED=false

while [ $ELAPSED -lt $MAX_RESTART_WAIT ]; do
    sleep $CHECK_INTERVAL
    ELAPSED=$((ELAPSED + CHECK_INTERVAL))
    
    # Check if process is back online
    if pm2 list | grep -q "$PROCESS_NAME.*online"; then
        # Check if restart count increased
        CURRENT_RESTARTS=$(pm2 jlist | jq -r ".[] | select(.name==\"$PROCESS_NAME\") | .pm2_env.restart_time" 2>/dev/null || echo "0")
        if [ "$CURRENT_RESTARTS" = "null" ]; then
            CURRENT_RESTARTS=0
        fi
        
        if [ "$CURRENT_RESTARTS" -gt "$INITIAL_RESTARTS" ]; then
            RESTARTED=true
            break
        fi
    fi
    
    echo -n "."
done
echo ""

# Verify restart
if [ "$RESTARTED" = true ]; then
    CURRENT_RESTARTS=$(pm2 jlist | jq -r ".[] | select(.name==\"$PROCESS_NAME\") | .pm2_env.restart_time" 2>/dev/null || echo "0")
    if [ "$CURRENT_RESTARTS" = "null" ]; then
        CURRENT_RESTARTS=0
    fi
    
    NEW_PID=$(pm2 jlist | jq -r ".[] | select(.name==\"$PROCESS_NAME\") | .pid" 2>/dev/null)
    
    print_success "Process restarted successfully!"
    print_info "  - New PID: $NEW_PID"
    print_info "  - Total restarts: $CURRENT_RESTARTS (was $INITIAL_RESTARTS)"
    
    # Verify process is actually running
    if [ "$NEW_PID" != "$PROCESS_PID" ] && [ -n "$NEW_PID" ] && [ "$NEW_PID" != "null" ]; then
        print_success "Process has a new PID (restart confirmed)"
    else
        print_error "Process PID did not change (may not have restarted)"
        exit 3
    fi
    
    echo ""
    print_info "PM2 Status:"
    pm2 status
    exit 0
else
    print_error "Process did not restart within ${MAX_RESTART_WAIT} seconds"
    echo ""
    print_info "PM2 Status:"
    pm2 status
    echo ""
    print_info "Process logs:"
    pm2 logs "$PROCESS_NAME" --lines 20 --nostream 2>/dev/null || true
    exit 4
fi

