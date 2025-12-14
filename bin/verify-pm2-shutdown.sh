#!/bin/bash
#
# Verification Script: PM2 Shutdown Testing (T046)
#
# This script verifies that PM2 shutdown (`pm2 stop all`) works correctly
# and all processes stop cleanly.
#
# Usage:
#   ./bin/verify-pm2-shutdown.sh
#
# Prerequisites:
#   - PM2 installed globally
#   - At least one process running via PM2
#
# Exit Codes:
#   0: Shutdown verified successfully
#   1: Prerequisites not met
#   2: Stop command failed
#   3: Processes did not stop cleanly
#   4: Process cleanup verification failed

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SHUTDOWN_WAIT_TIME=10  # seconds to wait for shutdown to complete
MAX_SHUTDOWN_WAIT=30   # seconds maximum wait time

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
echo "PM2 Shutdown Verification (T046)"
echo "=========================================="
echo ""

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    print_error "PM2 is not installed. Install with: npm install -g pm2"
    exit 1
fi

# Check if any processes are running
RUNNING_PROCESSES=$(pm2 jlist | jq -r '.[] | select(.pm2_env.status=="online") | .name' 2>/dev/null || echo "")
if [ -z "$RUNNING_PROCESSES" ]; then
    print_error "No processes are running. Start processes first with: pm2 start ecosystem.config.js"
    exit 1
fi

# Get list of running processes
PROCESS_COUNT=$(pm2 jlist | jq '[.[] | select(.pm2_env.status=="online")] | length' 2>/dev/null || echo "0")
print_success "Found $PROCESS_COUNT running process(es)"

print_info "Running processes:"
pm2 list

# Get initial PIDs for verification
INITIAL_PIDS_LIST=""
while IFS= read -r process_name; do
    if [ -n "$process_name" ]; then
        PID=$(pm2 jlist | jq -r ".[] | select(.name==\"$process_name\") | .pid" 2>/dev/null || echo "")
        if [ -n "$PID" ] && [ "$PID" != "null" ]; then
            INITIAL_PIDS_LIST="${INITIAL_PIDS_LIST}${process_name}:${PID} "
            print_info "  - $process_name: PID $PID"
        fi
    fi
done <<< "$RUNNING_PROCESSES"

# Perform shutdown
echo ""
print_info "Stopping all PM2 processes..."
if ! pm2 stop all; then
    print_error "PM2 stop command failed"
    exit 2
fi

# Wait for shutdown to complete
print_info "Waiting for processes to stop (max ${MAX_SHUTDOWN_WAIT}s)..."
ELAPSED=0
ALL_STOPPED=false

while [ $ELAPSED -lt $MAX_SHUTDOWN_WAIT ]; do
    sleep 1
    ELAPSED=$((ELAPSED + 1))
    
    # Check if any processes are still online
    STILL_RUNNING=$(pm2 jlist | jq -r '.[] | select(.pm2_env.status=="online") | .name' 2>/dev/null || echo "")
    
    if [ -z "$STILL_RUNNING" ]; then
        ALL_STOPPED=true
        break
    fi
    
    echo -n "."
done
echo ""

# Verify all processes stopped
if [ "$ALL_STOPPED" = true ]; then
    print_success "All processes stopped successfully!"
    
    # Verify process status
    print_info "Process status after shutdown:"
    pm2 list
    
    # Verify PIDs are no longer active
    print_info "Verifying process cleanup..."
    CLEANUP_VERIFIED=true
    
    for pid_entry in $INITIAL_PIDS_LIST; do
        if [ -n "$pid_entry" ]; then
            process_name=$(echo "$pid_entry" | cut -d':' -f1)
            OLD_PID=$(echo "$pid_entry" | cut -d':' -f2)
            
            # Check if PID is still running (should not be)
            if ps -p "$OLD_PID" > /dev/null 2>&1; then
                print_error "Process $process_name (PID $OLD_PID) is still running"
                CLEANUP_VERIFIED=false
            else
                print_success "Process $process_name (PID $OLD_PID) stopped cleanly"
            fi
        fi
    done
    
    if [ "$CLEANUP_VERIFIED" = true ]; then
        echo ""
        print_success "Shutdown verification complete!"
        print_info "All processes stopped cleanly"
        echo ""
        print_info "To restart processes: pm2 start ecosystem.config.js"
        print_info "To delete processes: pm2 delete all"
        exit 0
    else
        print_error "Some processes did not stop cleanly"
        exit 4
    fi
else
    STILL_RUNNING=$(pm2 jlist | jq -r '.[] | select(.pm2_env.status=="online") | .name' 2>/dev/null || echo "")
    print_error "Some processes did not stop within ${MAX_SHUTDOWN_WAIT} seconds"
    echo ""
    print_info "Processes still running:"
    for process in $STILL_RUNNING; do
        print_error "  - $process"
        pm2 logs "$process" --lines 10 --nostream 2>/dev/null || true
    done
    echo ""
    print_info "PM2 Status:"
    pm2 status
    exit 3
fi

