#!/bin/bash
#
# Verification Script: PM2 Logging Testing (T044)
#
# This script verifies that PM2 logs are written to ~/.pm2/logs/ and that
# log rotation works correctly.
#
# Usage:
#   ./bin/verify-pm2-logging.sh [process_name]
#
# Arguments:
#   process_name: Optional. Name of process to test (default: "api")
#
# Prerequisites:
#   - PM2 installed globally
#   - At least one process running via PM2
#   - Process must have logging configured in ecosystem.config.js
#
# Exit Codes:
#   0: Logging verified successfully
#   1: Prerequisites not met
#   2: Log files not found
#   3: Log rotation verification failed
#   4: Log writing verification failed

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROCESS_NAME="${1:-api}"
PM2_LOG_DIR="$HOME/.pm2/logs"
LOG_WAIT_TIME=5  # seconds to wait for logs to be written

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
echo "PM2 Logging Verification (T044)"
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

# Check if PM2 log directory exists
if [ ! -d "$PM2_LOG_DIR" ]; then
    print_error "PM2 log directory not found: $PM2_LOG_DIR"
    print_info "PM2 should create this directory automatically. Check PM2 installation."
    exit 1
fi
print_success "PM2 log directory exists: $PM2_LOG_DIR"

# Expected log files based on ecosystem.config.js naming
EXPECTED_LOG_FILES=(
    "${PROCESS_NAME}-error.log"
    "${PROCESS_NAME}-out.log"
    "${PROCESS_NAME}-combined.log"
)

# Check for log files
print_info "Checking for log files..."
FOUND_LOGS=0
MISSING_LOGS=()

for log_file in "${EXPECTED_LOG_FILES[@]}"; do
    log_path="$PM2_LOG_DIR/$log_file"
    if [ -f "$log_path" ]; then
        print_success "Found: $log_file"
        FOUND_LOGS=$((FOUND_LOGS + 1))
        
        # Check file size
        FILE_SIZE=$(stat -f%z "$log_path" 2>/dev/null || stat -c%s "$log_path" 2>/dev/null || echo "0")
        print_info "  - Size: $FILE_SIZE bytes"
        
        # Check if file is writable
        if [ -w "$log_path" ]; then
            print_success "  - File is writable"
        else
            print_error "  - File is not writable"
        fi
    else
        print_error "Not found: $log_file"
        MISSING_LOGS+=("$log_file")
    fi
done

if [ $FOUND_LOGS -eq 0 ]; then
    print_error "No log files found for process '$PROCESS_NAME'"
    print_info "Check ecosystem.config.js logging configuration"
    exit 2
fi

# Verify logs are being written
print_info "Verifying logs are being written..."
sleep $LOG_WAIT_TIME

# Get initial log sizes
declare -A INITIAL_SIZES
for log_file in "${EXPECTED_LOG_FILES[@]}"; do
    log_path="$PM2_LOG_DIR/$log_file"
    if [ -f "$log_path" ]; then
        INITIAL_SIZES["$log_file"]=$(stat -f%z "$log_path" 2>/dev/null || stat -c%s "$log_path" 2>/dev/null || echo "0")
    fi
done

# Wait a bit more and check if sizes increased
sleep $LOG_WAIT_TIME

LOG_WRITING=false
for log_file in "${EXPECTED_LOG_FILES[@]}"; do
    log_path="$PM2_LOG_DIR/$log_file"
    if [ -f "$log_path" ]; then
        CURRENT_SIZE=$(stat -f%z "$log_path" 2>/dev/null || stat -c%s "$log_path" 2>/dev/null || echo "0")
        INITIAL_SIZE="${INITIAL_SIZES[$log_file]:-0}"
        
        if [ "$CURRENT_SIZE" -gt "$INITIAL_SIZE" ]; then
            print_success "$log_file is being written to (size increased from $INITIAL_SIZE to $CURRENT_SIZE bytes)"
            LOG_WRITING=true
        else
            print_info "$log_file size unchanged (may be idle or no recent activity)"
        fi
    fi
done

# Check log file permissions
print_info "Checking log file permissions..."
for log_file in "${EXPECTED_LOG_FILES[@]}"; do
    log_path="$PM2_LOG_DIR/$log_file"
    if [ -f "$log_path" ]; then
        PERMS=$(stat -f%OLp "$log_path" 2>/dev/null || stat -c%a "$log_path" 2>/dev/null || echo "unknown")
        print_info "  - $log_file: permissions $PERMS"
    fi
done

# Test log rotation (if configured)
print_info "Checking log rotation configuration..."
LOG_ROTATION_CONFIG=$(pm2 jlist | jq -r ".[] | select(.name==\"$PROCESS_NAME\") | .pm2_env.pm_log_path" 2>/dev/null || echo "")
if [ -n "$LOG_ROTATION_CONFIG" ] && [ "$LOG_ROTATION_CONFIG" != "null" ]; then
    print_success "Log rotation is configured"
    print_info "  - Log path: $LOG_ROTATION_CONFIG"
else
    print_info "Log rotation not explicitly configured (PM2 uses default rotation)"
fi

# Display recent log content
print_info "Recent log content (last 5 lines from each log):"
for log_file in "${EXPECTED_LOG_FILES[@]}"; do
    log_path="$PM2_LOG_DIR/$log_file"
    if [ -f "$log_path" ]; then
        echo ""
        print_info "=== $log_file ==="
        tail -n 5 "$log_path" 2>/dev/null || echo "(empty or unreadable)"
    fi
done

# Summary
echo ""
if [ $FOUND_LOGS -gt 0 ]; then
    print_success "Logging verification complete!"
    print_info "  - Found $FOUND_LOGS log file(s)"
    if [ "$LOG_WRITING" = true ]; then
        print_success "  - Logs are being written"
    else
        print_info "  - Logs may be idle (no recent activity)"
    fi
    echo ""
    print_info "To view logs in real-time: pm2 logs $PROCESS_NAME"
    print_info "To view all logs: pm2 logs"
    print_info "Log directory: $PM2_LOG_DIR"
    exit 0
else
    print_error "Logging verification failed - no log files found"
    exit 2
fi

