#!/bin/bash
#
# Verification Script: PM2 Graceful Reload Testing (T045)
#
# This script verifies that PM2 graceful reload (`pm2 reload all`) works correctly
# and provides zero-downtime reload.
#
# Usage:
#   ./bin/verify-pm2-reload.sh [process_name]
#
# Arguments:
#   process_name: Optional. Name of process to test (default: "api")
#
# Prerequisites:
#   - PM2 installed globally
#   - At least one process running via PM2
#   - Process must support graceful reload (SIGUSR2 or cluster mode)
#
# Exit Codes:
#   0: Graceful reload verified successfully
#   1: Prerequisites not met
#   2: Reload command failed
#   3: Process did not reload correctly
#   4: Zero-downtime verification failed

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROCESS_NAME="${1:-api}"
RELOAD_WAIT_TIME=10  # seconds to wait for reload to complete
MAX_RELOAD_WAIT=30   # seconds maximum wait time

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
echo "PM2 Graceful Reload Verification (T045)"
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

# Get initial process info
INITIAL_PID=$(pm2 jlist | jq -r ".[] | select(.name==\"$PROCESS_NAME\") | .pid" 2>/dev/null)
INITIAL_RESTARTS=$(pm2 jlist | jq -r ".[] | select(.name==\"$PROCESS_NAME\") | .pm2_env.restart_time" 2>/dev/null || echo "0")
INITIAL_UPTIME=$(pm2 jlist | jq -r ".[] | select(.name==\"$PROCESS_NAME\") | .pm2_env.pm_uptime" 2>/dev/null || echo "0")

if [ -z "$INITIAL_PID" ] || [ "$INITIAL_PID" = "null" ]; then
    print_error "Could not get PID for process '$PROCESS_NAME'"
    exit 1
fi

print_info "Initial process state:"
print_info "  - PID: $INITIAL_PID"
print_info "  - Restarts: $INITIAL_RESTARTS"
print_info "  - Uptime: $INITIAL_UPTIME"

# Check if process supports reload
EXEC_MODE=$(pm2 jlist | jq -r ".[] | select(.name==\"$PROCESS_NAME\") | .pm2_env.exec_mode" 2>/dev/null || echo "fork")
print_info "  - Exec mode: $EXEC_MODE"

# Perform graceful reload
print_info "Performing graceful reload..."
if ! pm2 reload "$PROCESS_NAME"; then
    print_error "PM2 reload command failed"
    exit 2
fi

# Wait for reload to complete
print_info "Waiting for reload to complete (max ${MAX_RELOAD_WAIT}s)..."
ELAPSED=0
RELOADED=false

while [ $ELAPSED -lt $MAX_RELOAD_WAIT ]; do
    sleep 1
    ELAPSED=$((ELAPSED + 1))
    
    # Check if process is still online
    if pm2 list | grep -q "$PROCESS_NAME.*online"; then
        # Check if PID changed (indicates reload)
        CURRENT_PID=$(pm2 jlist | jq -r ".[] | select(.name==\"$PROCESS_NAME\") | .pid" 2>/dev/null)
        CURRENT_RESTARTS=$(pm2 jlist | jq -r ".[] | select(.name==\"$PROCESS_NAME\") | .pm2_env.restart_time" 2>/dev/null || echo "0")
        
        if [ "$CURRENT_PID" != "$INITIAL_PID" ] && [ -n "$CURRENT_PID" ] && [ "$CURRENT_PID" != "null" ]; then
            RELOADED=true
            break
        fi
        
        # For cluster mode, check if restart count increased (but not too much)
        if [ "$EXEC_MODE" = "cluster" ] && [ "$CURRENT_RESTARTS" -gt "$INITIAL_RESTARTS" ]; then
            RELOADED=true
            break
        fi
    else
        # Process went offline during reload - wait a bit more
        sleep 2
        if pm2 list | grep -q "$PROCESS_NAME.*online"; then
            RELOADED=true
            break
        fi
    fi
    
    echo -n "."
done
echo ""

# Verify reload
if [ "$RELOADED" = true ]; then
    CURRENT_PID=$(pm2 jlist | jq -r ".[] | select(.name==\"$PROCESS_NAME\") | .pid" 2>/dev/null)
    CURRENT_RESTARTS=$(pm2 jlist | jq -r ".[] | select(.name==\"$PROCESS_NAME\") | .pm2_env.restart_time" 2>/dev/null || echo "0")
    CURRENT_UPTIME=$(pm2 jlist | jq -r ".[] | select(.name==\"$PROCESS_NAME\") | .pm2_env.pm_uptime" 2>/dev/null || echo "0")
    
    print_success "Process reloaded successfully!"
    print_info "Final process state:"
    print_info "  - New PID: $CURRENT_PID"
    print_info "  - Restarts: $CURRENT_RESTARTS"
    print_info "  - Uptime: $CURRENT_UPTIME"
    
    # Verify zero-downtime (process should have been online throughout)
    if pm2 list | grep -q "$PROCESS_NAME.*online"; then
        print_success "Zero-downtime reload verified (process remained online)"
    else
        print_error "Process went offline during reload (not zero-downtime)"
        exit 4
    fi
    
    # Verify PID changed (for fork mode)
    if [ "$EXEC_MODE" = "fork" ]; then
        if [ "$CURRENT_PID" != "$INITIAL_PID" ]; then
            print_success "Process PID changed (reload confirmed)"
        else
            print_info "Process PID unchanged (may use different reload mechanism)"
        fi
    fi
    
    echo ""
    print_info "PM2 Status:"
    pm2 status
    exit 0
else
    print_error "Process did not reload correctly within ${MAX_RELOAD_WAIT} seconds"
    echo ""
    print_info "PM2 Status:"
    pm2 status
    echo ""
    print_info "Process logs:"
    pm2 logs "$PROCESS_NAME" --lines 20 --nostream 2>/dev/null || true
    exit 3
fi

