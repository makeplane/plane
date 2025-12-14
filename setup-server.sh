#!/bin/bash
#
# FamilyFlow Initial Server Setup Script for Digital Ocean Droplet
#
# This script sets up a fresh Ubuntu 22.04 LTS server with all required dependencies
# for running FamilyFlow in native (non-Docker) mode.
#
# Usage:
#   ./setup-server.sh
#
# Prerequisites:
#   - Fresh Ubuntu 22.04 LTS droplet
#   - Root or sudo access
#   - Internet connection
#
# What this script does:
#   1. Updates system packages
#   2. Installs Node.js 22+
#   3. Installs Python 3.12
#   4. Installs pnpm
#   5. Installs PM2 globally
#   6. Installs Redis (for caching and Celery broker)
#   7. Optionally installs Nginx (for reverse proxy/SSL)
#   8. Configures systemd services for auto-start
#   9. Sets up firewall (UFW)
#
# Example:
#   curl -fsSL https://raw.githubusercontent.com/your-repo/setup-server.sh | bash
#   OR
#   scp setup-server.sh root@your-droplet-ip:/root/
#   ssh root@your-droplet-ip
#   chmod +x setup-server.sh
#   ./setup-server.sh
#
# For detailed deployment instructions, see:
#   - specs/001-family-management/DEPLOYMENT.md (when created)
#   - specs/001-family-management/quickstart.md
#

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}FamilyFlow Server Setup Script${NC}"
echo -e "${GREEN}Ubuntu 22.04 LTS${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""

# Check if running as root or with sudo
if [ "$EUID" -ne 0 ]; then
    echo -e "${RED}Error: This script must be run as root or with sudo${NC}"
    exit 1
fi

# Step 1: Update system packages
echo -e "${YELLOW}[1/10] Updating system packages...${NC}"
apt-get update
apt-get upgrade -y
echo -e "${GREEN}✓ System updated${NC}"
echo ""

# Step 2: Install Node.js 22+
echo -e "${YELLOW}[2/10] Installing Node.js 22+...${NC}"
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt-get install -y nodejs
node --version
npm --version
echo -e "${GREEN}✓ Node.js installed${NC}"
echo ""

# Step 3: Install Python 3.12
echo -e "${YELLOW}[3/10] Installing Python 3.12...${NC}"
apt-get install -y software-properties-common
add-apt-repository -y ppa:deadsnakes/ppa
apt-get update
apt-get install -y python3.12 python3.12-venv python3.12-dev python3-pip
python3.12 --version
echo -e "${GREEN}✓ Python 3.12 installed${NC}"
echo ""

# Step 4: Install pnpm
echo -e "${YELLOW}[4/10] Installing pnpm...${NC}"
npm install -g pnpm@10.24.0
pnpm --version
echo -e "${GREEN}✓ pnpm installed${NC}"
echo ""

# Step 5: Install PM2 globally
echo -e "${YELLOW}[5/10] Installing PM2...${NC}"
npm install -g pm2
pm2 --version
echo -e "${GREEN}✓ PM2 installed${NC}"
echo ""

# Step 6: Install Redis
echo -e "${YELLOW}[6/9] Installing Redis (for caching and Celery broker)...${NC}"
apt-get install -y redis-server
systemctl enable redis-server
systemctl start redis-server
systemctl status redis-server --no-pager | head -5
echo -e "${GREEN}✓ Redis installed and started${NC}"
echo ""

# Step 7: Optionally install Nginx
echo -e "${YELLOW}[7/9] Installing Nginx (optional, for reverse proxy/SSL)...${NC}"
read -p "Install Nginx for reverse proxy and SSL? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    apt-get install -y nginx
    systemctl enable nginx
    
    # Copy nginx configuration
    if [ -f "nginx/nginx.conf" ]; then
        cp nginx/nginx.conf /etc/nginx/sites-available/familyflow
        ln -sf /etc/nginx/sites-available/familyflow /etc/nginx/sites-enabled/
        rm -f /etc/nginx/sites-enabled/default
        
        # Set up SSL certificates (self-signed for development)
        if [ -f "nginx/setup-ssl.sh" ]; then
            chmod +x nginx/setup-ssl.sh
            ./nginx/setup-ssl.sh
        fi
        
        # Test and start nginx
        nginx -t && systemctl start nginx
        echo -e "${GREEN}✓ Nginx installed and configured${NC}"
    else
        systemctl start nginx
        echo -e "${GREEN}✓ Nginx installed${NC}"
        echo -e "${YELLOW}Note: Nginx configuration file not found. Configure manually.${NC}"
    fi
else
    echo -e "${YELLOW}  Skipping Nginx installation${NC}"
fi
echo ""

# Step 8: Configure systemd services for auto-start
echo -e "${YELLOW}[8/9] Configuring systemd services...${NC}"
# Redis is already enabled above
# PM2 will be configured when you run: pm2 startup
echo -e "${GREEN}✓ Systemd services configured${NC}"
echo -e "${BLUE}Note: Run 'pm2 startup' after deploying the application to enable PM2 auto-start${NC}"
echo ""

# Step 9: Configure firewall (UFW)
echo -e "${YELLOW}[9/9] Configuring firewall (UFW)...${NC}"
ufw --force enable
ufw default deny incoming
ufw default allow outgoing
ufw allow 22/tcp    # SSH
ufw allow 80/tcp    # HTTP
ufw allow 443/tcp   # HTTPS
ufw status
echo -e "${GREEN}✓ Firewall configured${NC}"
echo ""

# Summary
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}Server Setup Complete!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "Installed components:"
echo "  ✓ Node.js $(node --version)"
echo "  ✓ Python $(python3.12 --version)"
echo "  ✓ pnpm $(pnpm --version)"
echo "  ✓ PM2 $(pm2 --version)"
echo "  ✓ Redis (systemd service - for caching and Celery broker)"
echo ""
echo "Next steps:"
echo "  1. Clone your FamilyFlow repository"
echo "  2. Create .env files from .env.example templates"
echo "  3. Configure environment variables (Supabase, etc.)"
echo "  4. Run database migrations: cd apps/api && python manage.py migrate"
echo "  5. Build frontend: cd apps/web && pnpm build"
echo "  6. Start application: pm2 start ecosystem.config.js --env production"
echo "  7. Enable PM2 auto-start: pm2 startup && pm2 save"
echo ""

