#!/bin/bash
#
# SSL Certificate Setup Script for Nginx
#
# This script generates self-signed SSL certificates for development
# or sets up Let's Encrypt certificates for production.
#
# Usage:
#   ./setup-ssl.sh [--letsencrypt] [--domain example.com] [--email admin@example.com]
#
# Options:
#   --letsencrypt    Use Let's Encrypt (requires domain and email)
#   --domain         Domain name for Let's Encrypt
#   --email          Email for Let's Encrypt registration
#

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SSL_DIR="/etc/nginx/ssl"
USE_LETSENCRYPT=false
DOMAIN=""
EMAIL=""

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --letsencrypt)
            USE_LETSENCRYPT=true
            shift
            ;;
        --domain)
            DOMAIN="$2"
            shift 2
            ;;
        --email)
            EMAIL="$2"
            shift 2
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "=========================================="
echo "SSL Certificate Setup"
echo "=========================================="
echo ""

if [ "$USE_LETSENCRYPT" = true ]; then
    if [ -z "$DOMAIN" ] || [ -z "$EMAIL" ]; then
        echo -e "${RED}Error: --domain and --email are required for Let's Encrypt${NC}"
        exit 1
    fi

    echo -e "${YELLOW}Setting up Let's Encrypt SSL certificate...${NC}"
    echo "Domain: $DOMAIN"
    echo "Email: $EMAIL"
    echo ""

    # Install certbot if not already installed
    if ! command -v certbot &> /dev/null; then
        echo "Installing certbot..."
        if [[ "$OSTYPE" == "linux-gnu"* ]]; then
            sudo apt-get update
            sudo apt-get install -y certbot python3-certbot-nginx
        elif [[ "$OSTYPE" == "darwin"* ]]; then
            brew install certbot
        else
            echo -e "${RED}Unsupported OS. Please install certbot manually.${NC}"
            exit 1
        fi
    fi

    # Obtain certificate
    echo "Obtaining SSL certificate from Let's Encrypt..."
    sudo certbot certonly --nginx -d "$DOMAIN" --email "$EMAIL" --agree-tos --non-interactive || {
        echo -e "${RED}Failed to obtain certificate. Please check your domain configuration.${NC}"
        exit 1
    }

    echo -e "${GREEN}✓ Let's Encrypt certificate obtained${NC}"
    echo ""
    echo "Update nginx.conf with:"
    echo "  ssl_certificate /etc/letsencrypt/live/$DOMAIN/fullchain.pem;"
    echo "  ssl_certificate_key /etc/letsencrypt/live/$DOMAIN/privkey.pem;"

else
    # Generate self-signed certificate for development
    echo -e "${YELLOW}Generating self-signed SSL certificate for development...${NC}"
    echo ""

    # Create SSL directory
    sudo mkdir -p "$SSL_DIR"

    # Generate self-signed certificate
    sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout "$SSL_DIR/nginx-selfsigned.key" \
        -out "$SSL_DIR/nginx-selfsigned.crt" \
        -subj "/C=US/ST=State/L=City/O=Organization/CN=localhost" \
        -addext "subjectAltName=DNS:localhost,DNS:*.localhost,IP:127.0.0.1,IP:::1"

    # Set permissions
    sudo chmod 600 "$SSL_DIR/nginx-selfsigned.key"
    sudo chmod 644 "$SSL_DIR/nginx-selfsigned.crt"

    echo -e "${GREEN}✓ Self-signed certificate generated${NC}"
    echo ""
    echo -e "${YELLOW}Note: Self-signed certificates will show a security warning in browsers.${NC}"
    echo "This is normal for development. For production, use Let's Encrypt."
fi

echo ""
echo "=========================================="
echo "SSL Setup Complete"
echo "=========================================="

