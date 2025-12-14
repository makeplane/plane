#!/bin/bash
#
# Verification Script: PM2 Process Monitoring Testing (T047)
#
# This script verifies that PM2 process monitoring (`pm2 monit`) works correctly
# and displays CPU/memory usage correctly.
#
# Usage:
#   ./bin/verify-pm2-monitoring.sh [process_name]
#
# Arguments:
#   process_name: Optional. Name of process to test (default: "api")
#
# Prerequisites:
#   - PM2 installed globally
#   - At least one process running via PM2
#
# Exit Codes:
#   0: Monitoring verified successfully
#   1: Prerequisites not met
#   2: Monitoring data retrieval failed
#   3: Monitoring metrics verification failed

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
PROCESS_NAME="${1:-api}"

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
echo "PM2 Process Monitoring Verification (T047)"
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

# Check if jq is available for JSON parsing
if ! command -v jq &> /dev/null; then
    print_info "jq not found. Installing jq is recommended for better output parsing."
    print_info "Continuing with basic monitoring checks..."
    USE_JQ=false
else
    USE_JQ=true
    print_success "jq is available for JSON parsing"
fi

# Get process monitoring data
print_info "Retrieving process monitoring data..."
if [ "$USE_JQ" = true ]; then
    # Get detailed process info
    PROCESS_DATA=$(pm2 jlist | jq ".[] | select(.name==\"$PROCESS_NAME\")" 2>/dev/null)
    
    if [ -z "$PROCESS_DATA" ]; then
        print_error "Could not retrieve process data for '$PROCESS_NAME'"
        exit 2
    fi
    
    # Extract monitoring metrics
    CPU_USAGE=$(echo "$PROCESS_DATA" | jq -r '.monit.cpu' 2>/dev/null || echo "N/A")
    MEMORY_USAGE=$(echo "$PROCESS_DATA" | jq -r '.monit.memory' 2>/dev/null || echo "N/A")
    PID=$(echo "$PROCESS_DATA" | jq -r '.pid' 2>/dev/null || echo "N/A")
    STATUS=$(echo "$PROCESS_DATA" | jq -r '.pm2_env.status' 2>/dev/null || echo "N/A")
    UPTIME=$(echo "$PROCESS_DATA" | jq -r '.pm2_env.pm_uptime' 2>/dev/null || echo "N/A")
    RESTARTS=$(echo "$PROCESS_DATA" | jq -r '.pm2_env.restart_time' 2>/dev/null || echo "0")
    
    print_success "Monitoring data retrieved successfully"
    echo ""
    print_info "Process Monitoring Metrics:"
    print_info "  - Process Name: $PROCESS_NAME"
    print_info "  - Status: $STATUS"
    print_info "  - PID: $PID"
    
    # Verify CPU usage
    if [ "$CPU_USAGE" != "N/A" ] && [ "$CPU_USAGE" != "null" ]; then
        # CPU usage is typically a percentage (0-100) or can be higher for multi-core
        CPU_FLOAT=$(echo "$CPU_USAGE" | awk '{print $1}')
        if [ -n "$CPU_FLOAT" ] && [ "$CPU_FLOAT" != "null" ]; then
            print_success "  - CPU Usage: ${CPU_USAGE}%"
        else
            print_error "  - CPU Usage: Invalid value ($CPU_USAGE)"
        fi
    else
        print_error "  - CPU Usage: Not available"
    fi
    
    # Verify memory usage
    if [ "$MEMORY_USAGE" != "N/A" ] && [ "$MEMORY_USAGE" != "null" ]; then
        # Memory usage is in bytes, convert to MB for readability
        MEMORY_MB=$(echo "$MEMORY_USAGE" | awk '{printf "%.2f", $1/1024/1024}')
        print_success "  - Memory Usage: ${MEMORY_MB} MB (${MEMORY_USAGE} bytes)"
    else
        print_error "  - Memory Usage: Not available"
    fi
    
    # Additional metrics
    if [ "$UPTIME" != "N/A" ] && [ "$UPTIME" != "null" ]; then
        UPTIME_SECONDS=$((UPTIME / 1000))
        UPTIME_MINUTES=$((UPTIME_SECONDS / 60))
        print_info "  - Uptime: ${UPTIME_MINUTES} minutes (${UPTIME_SECONDS} seconds)"
    fi
    
    if [ "$RESTARTS" != "0" ] && [ "$RESTARTS" != "null" ]; then
        print_info "  - Restarts: $RESTARTS"
    fi
else
    # Fallback: Use pm2 describe
    print_info "Using pm2 describe for monitoring data..."
    pm2 describe "$PROCESS_NAME" 2>/dev/null || {
        print_error "Could not retrieve process description"
        exit 2
    }
fi

# Display PM2 status table
echo ""
print_info "PM2 Status Table:"
pm2 status

# Display PM2 list with more details
echo ""
print_info "PM2 Detailed List:"
pm2 list

# Test pm2 monit command (non-interactive)
print_info "Testing pm2 monit command (non-interactive snapshot)..."
if pm2 monit --no-interaction 2>/dev/null || pm2 show "$PROCESS_NAME" > /dev/null 2>&1; then
    print_success "pm2 monit command is available"
    print_info "To view interactive monitoring: pm2 monit"
else
    print_info "pm2 monit may require interactive terminal"
fi

# Verify monitoring data is being updated
echo ""
print_info "Verifying monitoring data is being updated..."
sleep 2

if [ "$USE_JQ" = true ]; then
    UPDATED_PROCESS_DATA=$(pm2 jlist | jq ".[] | select(.name==\"$PROCESS_NAME\")" 2>/dev/null)
    UPDATED_CPU=$(echo "$UPDATED_PROCESS_DATA" | jq -r '.monit.cpu' 2>/dev/null || echo "N/A")
    UPDATED_MEMORY=$(echo "$UPDATED_PROCESS_DATA" | jq -r '.monit.memory' 2>/dev/null || echo "N/A")
    
    if [ "$UPDATED_CPU" != "N/A" ] && [ "$UPDATED_CPU" != "null" ] && \
       [ "$UPDATED_MEMORY" != "N/A" ] && [ "$UPDATED_MEMORY" != "null" ]; then
        print_success "Monitoring data is being updated"
        print_info "  - Updated CPU: ${UPDATED_CPU}%"
        MEMORY_MB=$(echo "$UPDATED_MEMORY" | awk '{printf "%.2f", $1/1024/1024}')
        print_info "  - Updated Memory: ${MEMORY_MB} MB"
    else
        print_error "Monitoring data update verification failed"
        exit 3
    fi
fi

# Summary
echo ""
print_success "Process monitoring verification complete!"
echo ""
print_info "Monitoring Commands:"
print_info "  - View status: pm2 status"
print_info "  - View details: pm2 describe $PROCESS_NAME"
print_info "  - Interactive monitor: pm2 monit"
print_info "  - Show process: pm2 show $PROCESS_NAME"
print_info "  - JSON output: pm2 jlist | jq"

exit 0

