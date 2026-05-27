#!/bin/bash
set -e

echo "============================================"
echo " Plane Frontend Dev Container: ${APP_FILTER}"
echo "============================================"

# Update network config (detect host IP, update .env files)
echo "Updating network configuration..."
bash /app/update-network.sh || echo "WARN: update-network.sh failed, using existing .env files"

# Ensure i18n locales symlink exists (required for translations to load)
# The built @plane/i18n dist/index.js uses dynamic import("../locales/...")
# which needs packages/i18n/locales -> packages/i18n/src/locales
if [ ! -e "/app/packages/i18n/locales" ]; then
  echo "Creating i18n locales symlink..."
  ln -s /app/packages/i18n/src/locales /app/packages/i18n/locales
fi

LOCK_FILE="/app/node_modules/.frontend-setup-done"
SETUP_LOCK="/app/node_modules/.frontend-setup-lock"

# Use a lock file to ensure only one container runs install + build
# Other containers wait for the first one to finish
if [ ! -f "$LOCK_FILE" ]; then
  # Try to acquire the setup lock (atomic mkdir)
  if mkdir "$SETUP_LOCK" 2>/dev/null; then
    echo "[$APP_FILTER] Acquired setup lock. Running install + build..."

    # Install dependencies if node_modules is empty
    if [ ! -d "/app/node_modules/.pnpm" ]; then
      echo "[$APP_FILTER] Installing dependencies..."
      cd /app && pnpm install --frozen-lockfile
    else
      echo "[$APP_FILTER] Dependencies already installed."
    fi

    # Build shared packages (turbo-cached after first run)
    echo "[$APP_FILTER] Building shared packages..."
    cd /app && pnpm turbo run build --filter='./packages/*' --concurrency=10

    # Mark setup as complete
    touch "$LOCK_FILE"
    echo "[$APP_FILTER] Setup complete."
  else
    # Another container is doing the setup, wait for it
    echo "[$APP_FILTER] Waiting for another container to finish setup..."
    while [ ! -f "$LOCK_FILE" ]; do
      sleep 5
      echo "[$APP_FILTER] Still waiting..."
    done
    echo "[$APP_FILTER] Setup completed by another container."
  fi
else
  echo "[$APP_FILTER] Setup already done from previous run."
fi

# Start the app dev server (runs forever until container stops)
echo "[$APP_FILTER] Starting dev server..."
exec pnpm turbo run dev --filter="${APP_FILTER}"
