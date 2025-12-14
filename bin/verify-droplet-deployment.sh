#!/bin/bash
#
# Verification Script: Digital Ocean Droplet Deployment Testing (T050)
#
# This script provides a checklist and verification steps for deploying
# FamilyFlow on a Digital Ocean droplet.
#
# Usage:
#   ./bin/verify-droplet-deployment.sh [--check] [--guide]
#
# Arguments:
#   --check: Run verification checks on current server
#   --guide: Display deployment guide
#
# Prerequisites:
#   - Digital Ocean droplet provisioned
#   - SSH access to droplet
#   - setup-server.sh and deploy.sh scripts available
#
# Exit Codes:
#   0: All checks passed (or guide displayed)
#   1: Prerequisites not met
#   2: Verification checks failed
#   3: Deployment steps incomplete

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
CHECK_MODE=false
GUIDE_MODE=false

# Parse arguments
if [ "$1" = "--check" ]; then
    CHECK_MODE=true
elif [ "$1" = "--guide" ]; then
    GUIDE_MODE=true
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

print_warning() {
    print_status "$YELLOW" "WARNING: $1"
}

print_info() {
    print_status "$YELLOW" "INFO: $1"
}

print_header() {
    print_status "$BLUE" "$1"
}

# Display deployment guide
if [ "$GUIDE_MODE" = true ]; then
    echo "=========================================="
    echo "Digital Ocean Droplet Deployment Guide (T050)"
    echo "=========================================="
    echo ""
    
    print_header "Step 1: Provision Digital Ocean Droplet"
    echo "  1. Create a new droplet with Ubuntu 22.04 LTS"
    echo "  2. Minimum specs: 2 CPU, 4GB RAM"
    echo "  3. Recommended specs: 4 CPU, 8GB RAM"
    echo "  4. Note the droplet IP address"
    echo ""
    
    print_header "Step 2: Initial Server Setup"
    echo "  On your local machine:"
    echo "    scp setup-server.sh root@your-droplet-ip:/root/"
    echo "    ssh root@your-droplet-ip"
    echo ""
    echo "  On the droplet:"
    echo "    chmod +x setup-server.sh"
    echo "    ./setup-server.sh"
    echo ""
    echo "  This installs:"
    echo "    - Node.js 22+"
    echo "    - Python 3.12"
    echo "    - pnpm"
    echo "    - PM2"
    echo "    - Redis"
    echo "    - Nginx (optional)"
    echo ""
    
    print_header "Step 3: Clone Repository"
    echo "  On the droplet:"
    echo "    git clone <your-repo-url> /opt/familyflow"
    echo "    cd /opt/familyflow"
    echo ""
    
    print_header "Step 4: Configure Environment"
    echo "  Create .env files:"
    echo "    cp apps/api/.env.example apps/api/.env"
    echo "    cp apps/web/.env.example apps/web/.env"
    echo ""
    echo "  Configure environment variables:"
    echo "    - SUPABASE_DB_URL (from Supabase dashboard)"
    echo "    - SECRET_KEY (generate secure key)"
    echo "    - DEBUG=0 (for production)"
    echo "    - ALLOWED_HOSTS (your domain/IP)"
    echo ""
    
    print_header "Step 5: Deploy Application"
    echo "  Run deployment script:"
    echo "    ./deploy.sh production"
    echo ""
    echo "  This script:"
    echo "    1. Pulls latest code"
    echo "    2. Installs dependencies"
    echo "    3. Runs database migrations"
    echo "    4. Builds frontend"
    echo "    5. Collects static files"
    echo "    6. Starts PM2 processes"
    echo ""
    
    print_header "Step 6: Configure PM2 Auto-Start"
    echo "  Enable PM2 to start on boot:"
    echo "    pm2 startup"
    echo "    (execute the generated command as root)"
    echo "    pm2 save"
    echo ""
    
    print_header "Step 7: Verify Deployment"
    echo "  Check PM2 processes:"
    echo "    pm2 status"
    echo ""
    echo "  Check logs:"
    echo "    pm2 logs"
    echo ""
    echo "  Test API:"
    echo "    curl http://localhost:8000/health"
    echo ""
    echo "  Test frontend:"
    echo "    curl http://localhost:3000"
    echo ""
    
    print_header "Step 8: Configure Nginx (Optional)"
    echo "  Set up reverse proxy and SSL:"
    echo "    - Configure Nginx virtual host"
    echo "    - Set up SSL with Let's Encrypt"
    echo "    - Update ALLOWED_HOSTS with domain"
    echo ""
    
    print_info "For detailed instructions, see:"
    print_info "  specs/001-family-management/DEPLOYMENT.md"
    echo ""
    exit 0
fi

# Run verification checks
if [ "$CHECK_MODE" = true ]; then
    echo "=========================================="
    echo "Digital Ocean Droplet Deployment Verification (T050)"
    echo "=========================================="
    echo ""
    
    # Check if running on Linux (typical for DO droplet)
    if [ "$(uname)" != "Linux" ]; then
        print_warning "Not running on Linux. This script is designed for Linux servers."
    else
        print_success "Running on Linux"
    fi
    
    # Check system requirements
    print_info "Checking system requirements..."
    
    # Check Node.js
    if command -v node &> /dev/null; then
        NODE_VERSION=$(node --version)
        print_success "Node.js installed: $NODE_VERSION"
    else
        print_error "Node.js not installed"
    fi
    
    # Check Python
    if command -v python3 &> /dev/null; then
        PYTHON_VERSION=$(python3 --version)
        print_success "Python installed: $PYTHON_VERSION"
    else
        print_error "Python not installed"
    fi
    
    # Check PM2
    if command -v pm2 &> /dev/null; then
        PM2_VERSION=$(pm2 --version)
        print_success "PM2 installed: $PM2_VERSION"
    else
        print_error "PM2 not installed"
    fi
    
    # Check Redis
    if command -v redis-cli &> /dev/null; then
        if redis-cli ping &> /dev/null; then
            print_success "Redis is installed and running"
        else
            print_warning "Redis is installed but not running"
        fi
    else
        print_warning "Redis not found"
    fi
    
    
    # Check if repository is cloned
    if [ -f "setup-server.sh" ] && [ -f "deploy.sh" ]; then
        print_success "Repository files found"
    else
        print_warning "Repository may not be fully cloned"
    fi
    
    # Check .env files
    if [ -f "apps/api/.env" ]; then
        print_success "apps/api/.env exists"
    else
        print_warning "apps/api/.env not found (create from .env.example)"
    fi
    
    # Check PM2 processes
    if command -v pm2 &> /dev/null; then
        if pm2 list | grep -q "online"; then
            print_success "PM2 processes are running"
            pm2 status
        else
            print_info "No PM2 processes running (start with: pm2 start ecosystem.config.js --env production)"
        fi
    fi
    
    echo ""
    print_info "Verification complete!"
    print_info "For deployment guide, run: ./bin/verify-droplet-deployment.sh --guide"
    exit 0
fi

# Default: show usage
echo "=========================================="
echo "Digital Ocean Droplet Deployment Verification (T050)"
echo "=========================================="
echo ""
echo "Usage:"
echo "  ./bin/verify-droplet-deployment.sh --check   # Run verification checks"
echo "  ./bin/verify-droplet-deployment.sh --guide   # Display deployment guide"
echo ""
echo "This script helps verify and guide Digital Ocean droplet deployment."
echo "For detailed instructions, see: specs/001-family-management/DEPLOYMENT.md"
echo ""

exit 0

