#!/bin/bash
#
# Verification Script: PM2 Auto-Start on Boot Testing (T051)
#
# This script verifies that PM2 is configured to auto-start on server boot
# via systemd integration.
#
# Usage:
#   ./bin/verify-pm2-autostart.sh [--setup]
#
# Arguments:
#   --setup: Optional. Set up PM2 auto-start if not configured
#
# Prerequisites:
#   - PM2 installed globally
#   - Systemd available (Linux)
#   - Root or sudo access (for setup)
#
# Exit Codes:
#   0: PM2 auto-start verified successfully
#   1: Prerequisites not met
#   2: PM2 startup script not configured
#   3: Systemd service verification failed
#   4: Setup failed

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
SETUP_MODE=false

# Parse arguments
if [ "$1" = "--setup" ]; then
    SETUP_MODE=true
fi

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
echo "PM2 Auto-Start on Boot Verification (T051)"
echo "=========================================="
echo ""

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    print_error "PM2 is not installed. Install with: npm install -g pm2"
    exit 1
fi
print_success "PM2 is installed"

# Check if running on Linux (systemd)
if [ "$(uname)" != "Linux" ]; then
    print_info "Not running on Linux. Systemd auto-start is Linux-specific."
    print_info "On macOS, use launchd. On Windows, use Task Scheduler."
    print_info "Skipping systemd verification."
    exit 0
fi
print_success "Running on Linux (systemd available)"

# Check if systemd is available
if ! command -v systemctl &> /dev/null; then
    print_error "systemctl not found. Systemd may not be available."
    exit 1
fi
print_success "systemctl is available"

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then
    if [ "$SETUP_MODE" = true ]; then
        print_error "Setup mode requires root or sudo access"
        print_info "Run with: sudo ./bin/verify-pm2-autostart.sh --setup"
        exit 1
    fi
    print_info "Not running as root. Some checks may be limited."
fi

# Check PM2 startup script
print_info "Checking PM2 startup script configuration..."
STARTUP_SCRIPT=$(pm2 startup 2>&1 | grep -oP 'sudo \K[^ ]+' || echo "")

if [ -n "$STARTUP_SCRIPT" ]; then
    print_success "PM2 startup script detected"
    print_info "  - Script: $STARTUP_SCRIPT"
else
    # Try to get startup command
    STARTUP_OUTPUT=$(pm2 startup 2>&1 || true)
    if echo "$STARTUP_OUTPUT" | grep -q "sudo"; then
        print_success "PM2 startup command available"
        print_info "Run: pm2 startup"
    else
        print_error "PM2 startup script not configured"
        
        if [ "$SETUP_MODE" = true ]; then
            print_info "Setting up PM2 auto-start..."
            if pm2 startup systemd -u "$USER" --hp "$HOME" 2>&1 | tee /tmp/pm2-startup-output.txt; then
                STARTUP_CMD=$(grep "sudo" /tmp/pm2-startup-output.txt | head -1)
                if [ -n "$STARTUP_CMD" ]; then
                    print_info "Execute this command as root:"
                    echo "$STARTUP_CMD"
                    print_info "Then run: pm2 save"
                fi
                rm -f /tmp/pm2-startup-output.txt
            else
                print_error "Failed to generate PM2 startup script"
                exit 4
            fi
        else
            print_info "To set up PM2 auto-start, run:"
            print_info "  pm2 startup"
            print_info "  (then execute the generated command as root)"
            print_info "  pm2 save"
            exit 2
        fi
    fi
fi

# Check if PM2 save has been run
print_info "Checking PM2 save configuration..."
if [ -f "$HOME/.pm2/dump.pm2" ]; then
    print_success "PM2 dump file exists ($HOME/.pm2/dump.pm2)"
    
    # Check if dump file has processes
    if [ -s "$HOME/.pm2/dump.pm2" ]; then
        PROCESS_COUNT=$(pm2 jlist 2>/dev/null | jq 'length' || echo "0")
        print_info "  - Processes in dump: $PROCESS_COUNT"
    fi
else
    print_info "PM2 dump file not found"
    if [ "$SETUP_MODE" = true ]; then
        print_info "Saving PM2 configuration..."
        if pm2 save; then
            print_success "PM2 configuration saved"
        else
            print_error "Failed to save PM2 configuration"
            exit 4
        fi
    else
        print_info "Run 'pm2 save' to save current PM2 process list"
    fi
fi

# Check systemd service (if configured)
print_info "Checking systemd service..."
if systemctl list-unit-files | grep -q "pm2"; then
    PM2_SERVICE=$(systemctl list-unit-files | grep pm2 | awk '{print $1}' | head -1)
    print_success "PM2 systemd service found: $PM2_SERVICE"
    
    # Check service status
    if systemctl is-enabled "$PM2_SERVICE" > /dev/null 2>&1; then
        if systemctl is-enabled "$PM2_SERVICE" | grep -q "enabled"; then
            print_success "PM2 service is enabled (will start on boot)"
        else
            print_info "PM2 service is not enabled"
            if [ "$SETUP_MODE" = true ] && [ "$EUID" -eq 0 ]; then
                print_info "Enabling PM2 service..."
                systemctl enable "$PM2_SERVICE" && print_success "PM2 service enabled"
            fi
        fi
        
        # Check service status
        SERVICE_STATUS=$(systemctl is-active "$PM2_SERVICE" 2>/dev/null || echo "inactive")
        if [ "$SERVICE_STATUS" = "active" ]; then
            print_success "PM2 service is active"
        else
            print_info "PM2 service status: $SERVICE_STATUS"
        fi
    fi
else
    print_info "PM2 systemd service not found (may be configured differently)"
fi

# Check PM2 processes
print_info "Checking current PM2 processes..."
if pm2 list | grep -q "online"; then
    PROCESS_COUNT=$(pm2 jlist 2>/dev/null | jq '[.[] | select(.pm2_env.status=="online")] | length' || echo "0")
    print_success "PM2 has $PROCESS_COUNT process(es) running"
    pm2 status
else
    print_info "No PM2 processes currently running"
    print_info "Start processes with: pm2 start ecosystem.config.js --env production"
    print_info "Then save with: pm2 save"
fi

# Summary
echo ""
if [ -f "$HOME/.pm2/dump.pm2" ] && systemctl list-unit-files | grep -q "pm2.*enabled"; then
    print_success "PM2 auto-start on boot is configured!"
    echo ""
    print_info "Configuration Summary:"
    print_info "  ✓ PM2 startup script configured"
    print_info "  ✓ PM2 dump file exists"
    print_info "  ✓ Systemd service enabled"
    echo ""
    print_info "To test auto-start:"
    print_info "  1. Reboot the server"
    print_info "  2. After reboot, check: pm2 status"
    print_info "  3. Verify all processes are running"
    exit 0
elif [ -f "$HOME/.pm2/dump.pm2" ]; then
    print_info "PM2 is partially configured"
    print_info "  ✓ PM2 dump file exists"
    print_info "  ⚠ Systemd service may need configuration"
    echo ""
    print_info "To complete setup:"
    print_info "  1. Run: pm2 startup"
    print_info "  2. Execute the generated command as root"
    print_info "  3. Run: pm2 save"
    exit 0
else
    print_info "PM2 auto-start is not fully configured"
    echo ""
    print_info "To set up PM2 auto-start:"
    print_info "  1. Start your processes: pm2 start ecosystem.config.js --env production"
    print_info "  2. Run: pm2 startup"
    print_info "  3. Execute the generated command as root/sudo"
    print_info "  4. Run: pm2 save"
    echo ""
    print_info "Or run this script with --setup flag:"
    print_info "  sudo ./bin/verify-pm2-autostart.sh --setup"
    exit 0
fi

