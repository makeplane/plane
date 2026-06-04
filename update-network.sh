#!/bin/bash
# Plane Network Setup Script for Linux

echo "Detecting active IP address..."

# Try to get the IP address using standard Linux commands
# First, try ip route
WIFI_IP=$(ip route get 1.1.1.1 2>/dev/null | awk '{print $7}')

# Fallback 1: hostname -I
if [ -z "$WIFI_IP" ]; then
    WIFI_IP=$(hostname -I | awk '{print $1}')
fi

# Fallback 2: ip addr
if [ -z "$WIFI_IP" ]; then
    WIFI_IP=$(ip addr show | grep -Eo 'inet [0-9.]+' | grep -Ev '127.0.0.1' | awk '{print $2}' | head -n 1)
fi

if [ -z "$WIFI_IP" ]; then
    echo "ERROR: Could not detect your local IP address. Make sure you are connected to the network."
    exit 1
fi

echo "Detected active IP: $WIFI_IP"
echo
echo "Updating all .env files..."

# --- apps/web/.env ---
cat << EOF > apps/web/.env
VITE_API_BASE_URL="http://$WIFI_IP:8000"

VITE_WEB_BASE_URL="http://$WIFI_IP:3000"

VITE_ADMIN_BASE_URL="http://$WIFI_IP:3001"
VITE_ADMIN_BASE_PATH="/god-mode"

VITE_SPACE_BASE_URL="http://$WIFI_IP:3002"
VITE_SPACE_BASE_PATH="/spaces"

VITE_LIVE_BASE_URL="http://$WIFI_IP:3100"
VITE_LIVE_BASE_PATH="/live"
EOF
echo "[OK] apps/web/.env"

# --- apps/admin/.env ---
cat << EOF > apps/admin/.env
VITE_API_BASE_URL="http://$WIFI_IP:8000"

VITE_WEB_BASE_URL="http://$WIFI_IP:3000"

VITE_ADMIN_BASE_URL="http://$WIFI_IP:3001"
VITE_ADMIN_BASE_PATH="/god-mode"

VITE_SPACE_BASE_URL="http://$WIFI_IP:3002"
VITE_SPACE_BASE_PATH="/spaces"

VITE_LIVE_BASE_URL="http://$WIFI_IP:3100"
VITE_LIVE_BASE_PATH="/live"
EOF
echo "[OK] apps/admin/.env"

# --- apps/space/.env ---
cat << EOF > apps/space/.env
VITE_API_BASE_URL="http://$WIFI_IP:8000"

VITE_WEB_BASE_URL="http://$WIFI_IP:3000"

VITE_ADMIN_BASE_URL="http://$WIFI_IP:3001"
VITE_ADMIN_BASE_PATH="/god-mode"

VITE_SPACE_BASE_URL="http://$WIFI_IP:3002"
VITE_SPACE_BASE_PATH="/spaces"

VITE_LIVE_BASE_URL="http://$WIFI_IP:3100"
VITE_LIVE_BASE_PATH="/live"
EOF
echo "[OK] apps/space/.env"

# --- apps/live/.env ---
cat << EOF > apps/live/.env
PORT=3100
API_BASE_URL="http://$WIFI_IP:8000"

WEB_BASE_URL="http://$WIFI_IP:3000"

LIVE_BASE_URL="http://$WIFI_IP:3100"
LIVE_BASE_PATH="/live"

LIVE_SERVER_SECRET_KEY="secret-key"

REDIS_PASSWORD="uA4hJz9mQ8vXw2pL5rKd7sN1tYg0b"
REDIS_PORT=6379
REDIS_HOST=localhost
REDIS_URL="redis://:uA4hJz9mQ8vXw2pL5rKd7sN1tYg0b@localhost:6379/"

CORS_ALLOWED_ORIGINS="http://$WIFI_IP:3000,http://$WIFI_IP:3001,http://$WIFI_IP:3002,http://localhost:3000,http://localhost:3001,http://localhost:3002"
EOF
echo "[OK] apps/live/.env"

# --- apps/api/.env (update CORS and URLs) ---
if [ -f apps/api/.env ]; then
    # We can replace localhost or any existing IP in the API .env with the new WIFI_IP for allowed origins and base URLs
    sed -i -E "s/CORS_ALLOWED_ORIGINS=\"[^\"]+\"/CORS_ALLOWED_ORIGINS=\"http:\/\/localhost:3000,http:\/\/localhost:3001,http:\/\/localhost:3002,http:\/\/localhost:3100,http:\/\/$WIFI_IP:3000,http:\/\/$WIFI_IP:3001,http:\/\/$WIFI_IP:3002,http:\/\/$WIFI_IP:3100\"/g" apps/api/.env
    sed -i -E "s/ADMIN_BASE_URL=\"[^\"]+\"/ADMIN_BASE_URL=\"http:\/\/$WIFI_IP:3001\"/g" apps/api/.env
    sed -i -E "s/SPACE_BASE_URL=\"[^\"]+\"/SPACE_BASE_URL=\"http:\/\/$WIFI_IP:3002\"/g" apps/api/.env
    sed -i -E "s/APP_BASE_URL=\"[^\"]+\"/APP_BASE_URL=\"http:\/\/$WIFI_IP:3000\"/g" apps/api/.env
    sed -i -E "s/LIVE_BASE_URL=\"[^\"]+\"/LIVE_BASE_URL=\"http:\/\/$WIFI_IP:3100\"/g" apps/api/.env
    echo "[OK] apps/api/.env updated"
fi

echo
echo "============================================"
echo " All .env files updated to IP: $WIFI_IP"
echo "============================================"
echo
echo "Next steps:"
echo "  1. Run docker-compose or pnpm dev:"
echo "     pnpm dev"
echo
echo "Then open on other devices: http://$WIFI_IP:3000"
echo
