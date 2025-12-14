#!/bin/bash
#
# Nginx Installation Script
#
# This script installs and configures nginx as a reverse proxy with SSL.
# It can be run on macOS (Homebrew) or Linux (apt).
#
# Usage:
#   ./install.sh [--letsencrypt] [--domain example.com] [--email admin@example.com]
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
NGINX_CONF_SOURCE="$SCRIPT_DIR/nginx.conf"
NGINX_CONF_DEST="/etc/nginx/sites-available/familyflow"
NGINX_CONF_ENABLED="/etc/nginx/sites-enabled/familyflow"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

print_info() {
    echo -e "${BLUE}$1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Detect OS
detect_os() {
    case "$(uname -s)" in
        Linux*)     echo "linux";;
        Darwin*)    echo "macos";;
        *)          echo "unknown";;
    esac
}

OS=$(detect_os)

echo "=========================================="
echo "Nginx Reverse Proxy Installation"
echo "=========================================="
echo ""

# Check if running as root/sudo
if [ "$EUID" -ne 0 ] && [ "$OS" = "linux" ]; then
    print_error "This script must be run with sudo on Linux"
    exit 1
fi

# Install nginx
print_info "Installing nginx..."

if [ "$OS" = "linux" ]; then
    if ! command -v nginx &> /dev/null; then
        apt-get update
        apt-get install -y nginx
        print_success "Nginx installed"
    else
        print_info "Nginx is already installed"
    fi
elif [ "$OS" = "macos" ]; then
    if ! command -v nginx &> /dev/null; then
        if ! command -v brew &> /dev/null; then
            print_error "Homebrew is required. Install from https://brew.sh"
            exit 1
        fi
        brew install nginx
        print_success "Nginx installed"
    else
        print_info "Nginx is already installed"
    fi
else
    print_error "Unsupported operating system"
    exit 1
fi

# Copy nginx configuration
print_info "Installing nginx configuration..."

if [ ! -f "$NGINX_CONF_SOURCE" ]; then
    print_error "Nginx configuration file not found: $NGINX_CONF_SOURCE"
    exit 1
fi

if [ "$OS" = "linux" ]; then
    # Linux: Use sites-available/sites-enabled structure
    mkdir -p /etc/nginx/sites-available
    mkdir -p /etc/nginx/sites-enabled
    cp "$NGINX_CONF_SOURCE" "$NGINX_CONF_DEST"
    ln -sf "$NGINX_CONF_DEST" "$NGINX_CONF_ENABLED"
    
    # Remove default site if it exists
    if [ -f /etc/nginx/sites-enabled/default ]; then
        rm -f /etc/nginx/sites-enabled/default
    fi
elif [ "$OS" = "macos" ]; then
    # macOS: Use nginx.conf directly or include in main config
    NGINX_CONF_DIR="/opt/homebrew/etc/nginx"  # Homebrew Apple Silicon
    if [ ! -d "$NGINX_CONF_DIR" ]; then
        NGINX_CONF_DIR="/usr/local/etc/nginx"  # Homebrew Intel
    fi
    
    if [ -d "$NGINX_CONF_DIR" ]; then
        # Backup existing config
        if [ -f "$NGINX_CONF_DIR/nginx.conf" ]; then
            cp "$NGINX_CONF_DIR/nginx.conf" "$NGINX_CONF_DIR/nginx.conf.backup"
        fi
        
        # Create servers directory and copy config
        mkdir -p "$NGINX_CONF_DIR/servers"
        cp "$NGINX_CONF_SOURCE" "$NGINX_CONF_DIR/servers/familyflow.conf"
        
        # Update main nginx.conf to include servers directory
        if ! grep -q "include servers/\*.conf" "$NGINX_CONF_DIR/nginx.conf" 2>/dev/null; then
            # Add include directive before the last closing brace
            sed -i '' '/^}$/i\
    include servers/*.conf;
' "$NGINX_CONF_DIR/nginx.conf" 2>/dev/null || \
            echo "    include servers/*.conf;" >> "$NGINX_CONF_DIR/nginx.conf"
        fi
    else
        print_error "Could not find nginx configuration directory"
        exit 1
    fi
fi

print_success "Nginx configuration installed"

# Set up SSL certificates
print_info "Setting up SSL certificates..."

if [ -f "$SCRIPT_DIR/setup-ssl.sh" ]; then
    chmod +x "$SCRIPT_DIR/setup-ssl.sh"
    
    # Check for Let's Encrypt flags
    USE_LETSENCRYPT=false
    DOMAIN=""
    EMAIL=""
    
    for arg in "$@"; do
        case $arg in
            --letsencrypt)
                USE_LETSENCRYPT=true
                ;;
            --domain=*)
                DOMAIN="${arg#*=}"
                ;;
            --email=*)
                EMAIL="${arg#*=}"
                ;;
        esac
    done
    
    if [ "$USE_LETSENCRYPT" = true ]; then
        if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
            print_error "Domain and email are required for Let's Encrypt"
            print_info "Usage: ./install.sh --letsencrypt --domain=example.com --email=admin@example.com"
            exit 1
        fi
        "$SCRIPT_DIR/setup-ssl.sh" --letsencrypt --domain "$DOMAIN" --email "$EMAIL"
    else
        "$SCRIPT_DIR/setup-ssl.sh"
    fi
    
    print_success "SSL certificates set up"
else
    print_warning "SSL setup script not found, skipping SSL setup"
fi

# Test nginx configuration
print_info "Testing nginx configuration..."
if nginx -t 2>/dev/null; then
    print_success "Nginx configuration is valid"
else
    print_error "Nginx configuration test failed"
    exit 1
fi

# Start/enable nginx
print_info "Starting nginx..."

if [ "$OS" = "linux" ]; then
    systemctl enable nginx
    systemctl start nginx
    print_success "Nginx started and enabled on boot"
elif [ "$OS" = "macos" ]; then
    # On macOS, nginx is typically started manually or via launchd
    brew services start nginx 2>/dev/null || {
        print_info "Starting nginx manually..."
        nginx
    }
    print_success "Nginx started"
fi

echo ""
echo "=========================================="
echo "Nginx Installation Complete"
echo "=========================================="
echo ""
print_info "Nginx is now configured as a reverse proxy with SSL"
print_info "Access your application at:"
echo "  - HTTP:  http://localhost (redirects to HTTPS)"
echo "  - HTTPS: https://localhost"
echo ""
print_info "To manage nginx:"
echo "  - Start:   sudo systemctl start nginx (Linux) or brew services start nginx (macOS)"
echo "  - Stop:    sudo systemctl stop nginx (Linux) or brew services stop nginx (macOS)"
echo "  - Restart: sudo systemctl restart nginx (Linux) or brew services restart nginx (macOS)"
echo "  - Reload:  sudo nginx -s reload"
echo "  - Test:    sudo nginx -t"
echo ""

