#!/bin/bash
#
# Verification Script: Production Environment Configuration (T053)
#
# This script verifies that production environment configuration is correct:
# - SECRET_KEY is set and secure
# - DEBUG is False
# - ALLOWED_HOSTS is configured
# - SSL configuration (if using Nginx)
#
# Usage:
#   ./bin/verify-production-config.sh [--fix]
#
# Arguments:
#   --fix: Optional. Attempt to fix common configuration issues
#
# Prerequisites:
#   - apps/api/.env file exists
#   - Django settings accessible
#
# Exit Codes:
#   0: Production configuration verified successfully
#   1: Prerequisites not met
#   2: Configuration validation failed
#   3: Security issues detected
#   4: Fix attempts failed

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Configuration
FIX_MODE=false
ENV_FILE="apps/api/.env"

# Parse arguments
if [ "$1" = "--fix" ]; then
    FIX_MODE=true
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

# Check prerequisites
echo "=========================================="
echo "Production Configuration Verification (T053)"
echo "=========================================="
echo ""

# Check if .env file exists
if [ ! -f "$ENV_FILE" ]; then
    print_error ".env file not found: $ENV_FILE"
    exit 1
fi
print_success ".env file found"

# Load .env file (basic parsing)
source_env() {
    set -a
    [ -f "$ENV_FILE" ] && . "$ENV_FILE"
    set +a
}

# Verify SECRET_KEY
echo ""
print_info "Verifying SECRET_KEY..."
SECRET_KEY=$(grep -E "^SECRET_KEY=" "$ENV_FILE" | cut -d'=' -f2- | tr -d ' ' || echo "")
if [ -z "$SECRET_KEY" ]; then
    print_error "SECRET_KEY is not set"
    if [ "$FIX_MODE" = true ]; then
        print_info "Generating new SECRET_KEY..."
        NEW_SECRET_KEY=$(python3 -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())" 2>/dev/null || \
                        openssl rand -hex 32)
        if [ -n "$NEW_SECRET_KEY" ]; then
            if grep -q "^SECRET_KEY=" "$ENV_FILE"; then
                sed -i.bak "s|^SECRET_KEY=.*|SECRET_KEY=$NEW_SECRET_KEY|" "$ENV_FILE"
            else
                echo "SECRET_KEY=$NEW_SECRET_KEY" >> "$ENV_FILE"
            fi
            print_success "SECRET_KEY generated and added to .env"
        else
            print_error "Failed to generate SECRET_KEY"
            exit 4
        fi
    else
        print_info "Set SECRET_KEY in $ENV_FILE"
        print_info "Generate with: python manage.py shell -c \"from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())\""
    fi
else
    # Check if SECRET_KEY is secure (not default values)
    if [ "$SECRET_KEY" = "your-secret-key-here" ] || \
       [ "$SECRET_KEY" = "django-insecure" ] || \
       [ ${#SECRET_KEY} -lt 50 ]; then
        print_warning "SECRET_KEY appears to be insecure (too short or default value)"
        if [ "$FIX_MODE" = true ]; then
            print_info "Generating new secure SECRET_KEY..."
            NEW_SECRET_KEY=$(python3 -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())" 2>/dev/null || \
                            openssl rand -hex 32)
            if [ -n "$NEW_SECRET_KEY" ]; then
                sed -i.bak "s|^SECRET_KEY=.*|SECRET_KEY=$NEW_SECRET_KEY|" "$ENV_FILE"
                print_success "SECRET_KEY updated"
            fi
        fi
    else
        print_success "SECRET_KEY is set and appears secure (length: ${#SECRET_KEY})"
    fi
fi

# Verify DEBUG
echo ""
print_info "Verifying DEBUG setting..."
DEBUG=$(grep -E "^DEBUG=" "$ENV_FILE" | cut -d'=' -f2 | tr -d ' ' || echo "")
if [ -z "$DEBUG" ]; then
    print_warning "DEBUG is not set (defaults to False in production settings)"
    if [ "$FIX_MODE" = true ]; then
        if ! grep -q "^DEBUG=" "$ENV_FILE"; then
            echo "DEBUG=0" >> "$ENV_FILE"
            print_success "DEBUG=0 added to .env"
        fi
    fi
elif [ "$DEBUG" = "1" ] || [ "$DEBUG" = "True" ] || [ "$DEBUG" = "true" ]; then
    print_error "DEBUG is enabled (should be False/0 in production)"
    if [ "$FIX_MODE" = true ]; then
        sed -i.bak "s|^DEBUG=.*|DEBUG=0|" "$ENV_FILE"
        print_success "DEBUG set to 0"
    else
        print_info "Set DEBUG=0 in $ENV_FILE for production"
    fi
else
    print_success "DEBUG is disabled (DEBUG=$DEBUG)"
fi

# Verify ALLOWED_HOSTS
echo ""
print_info "Verifying ALLOWED_HOSTS..."
ALLOWED_HOSTS=$(grep -E "^ALLOWED_HOSTS=" "$ENV_FILE" | cut -d'=' -f2- | tr -d ' ' || echo "")
if [ -z "$ALLOWED_HOSTS" ]; then
    print_warning "ALLOWED_HOSTS is not set"
    print_info "ALLOWED_HOSTS should include your domain and server IP"
    if [ "$FIX_MODE" = true ]; then
        # Try to detect server IP or domain
        SERVER_IP=$(hostname -I | awk '{print $1}' 2>/dev/null || echo "")
        if [ -n "$SERVER_IP" ]; then
            if ! grep -q "^ALLOWED_HOSTS=" "$ENV_FILE"; then
                echo "ALLOWED_HOSTS=$SERVER_IP,localhost,127.0.0.1" >> "$ENV_FILE"
                print_success "ALLOWED_HOSTS added with server IP: $SERVER_IP"
                print_info "Update ALLOWED_HOSTS with your domain name"
            fi
        else
            print_info "Add ALLOWED_HOSTS to $ENV_FILE"
        fi
    else
        print_info "Set ALLOWED_HOSTS in $ENV_FILE (comma-separated list)"
        print_info "Example: ALLOWED_HOSTS=yourdomain.com,www.yourdomain.com,123.456.789.0"
    fi
else
    print_success "ALLOWED_HOSTS is set: $ALLOWED_HOSTS"
    
    # Check if it includes localhost (good for development, but should include domain)
    if echo "$ALLOWED_HOSTS" | grep -q "localhost\|127.0.0.1"; then
        if ! echo "$ALLOWED_HOSTS" | grep -qE "\.(com|net|org|io|dev|app)"; then
            print_warning "ALLOWED_HOSTS only includes localhost (add your domain for production)"
        fi
    fi
fi

# Check SSL/HTTPS configuration (if Nginx is mentioned)
echo ""
print_info "Checking SSL/HTTPS configuration..."
if command -v nginx &> /dev/null; then
    print_success "Nginx is installed"
    
    # Check if Nginx is configured for SSL
    if [ -f "/etc/nginx/sites-available/default" ] || \
       [ -f "/etc/nginx/nginx.conf" ]; then
        if grep -q "ssl_certificate\|443" /etc/nginx/sites-available/default /etc/nginx/nginx.conf 2>/dev/null; then
            print_success "Nginx SSL configuration detected"
        else
            print_info "Nginx SSL not configured (optional for production)"
        fi
    fi
else
    print_info "Nginx not installed (optional for reverse proxy/SSL)"
fi

# Check Django settings module
echo ""
print_info "Verifying Django settings module..."
DJANGO_SETTINGS=$(grep -E "^DJANGO_SETTINGS_MODULE=" "$ENV_FILE" | cut -d'=' -f2 | tr -d ' ' || echo "")
if [ -z "$DJANGO_SETTINGS" ]; then
    print_info "DJANGO_SETTINGS_MODULE not set in .env (will use default)"
    print_info "For production, set: DJANGO_SETTINGS_MODULE=plane.settings.production"
elif echo "$DJANGO_SETTINGS" | grep -q "production"; then
    print_success "Django settings module is set to production: $DJANGO_SETTINGS"
elif echo "$DJANGO_SETTINGS" | grep -q "local"; then
    print_warning "Django settings module is set to local (not recommended for production)"
    print_info "Set to: DJANGO_SETTINGS_MODULE=plane.settings.production"
else
    print_info "Django settings module: $DJANGO_SETTINGS"
fi

# Check database configuration
echo ""
print_info "Verifying database configuration..."
if grep -qE "^SUPABASE_DB_URL=|^DATABASE_URL=" "$ENV_FILE"; then
    print_success "Database URL is configured"
else
    print_warning "Database URL not found in .env"
    print_info "Configure SUPABASE_DB_URL or DATABASE_URL"
fi

# Summary
echo ""
ISSUES_FOUND=0

if [ -z "$SECRET_KEY" ] || [ ${#SECRET_KEY} -lt 50 ]; then
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

if [ "$DEBUG" = "1" ] || [ "$DEBUG" = "True" ] || [ "$DEBUG" = "true" ]; then
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

if [ -z "$ALLOWED_HOSTS" ]; then
    ISSUES_FOUND=$((ISSUES_FOUND + 1))
fi

if [ $ISSUES_FOUND -eq 0 ]; then
    print_success "Production configuration verification complete!"
    echo ""
    print_info "All critical settings are configured correctly"
    exit 0
else
    print_warning "Production configuration has $ISSUES_FOUND issue(s)"
    echo ""
    print_info "Review the issues above and fix them"
    if [ "$FIX_MODE" = false ]; then
        print_info "Or run with --fix to attempt automatic fixes:"
        print_info "  ./bin/verify-production-config.sh --fix"
    fi
    exit 2
fi

