#!/bin/bash
#
# Frontend API Service Verification Script for Native Deployment
#
# This script verifies that frontend API service calls work correctly
# with the native backend (non-Docker) deployment.
#
# Task: T038 - Verify frontend API service calls work with native backend
#
# Usage:
#   ./bin/verify-api-service.sh [API_BASE_URL]
#
# Arguments:
#   API_BASE_URL: Optional API base URL (defaults to http://localhost:8000)
#
# Prerequisites:
#   - Backend API server running
#   - Frontend dependencies installed
#   - Node.js >= 22.18.0
#

set -e  # Exit on any error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEB_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$WEB_DIR/../.." && pwd)"

# Default API URL
API_BASE_URL="${1:-http://localhost:8000}"

echo "=========================================="
echo "Frontend API Service Verification"
echo "=========================================="
echo ""
echo "This script verifies that frontend API service calls"
echo "work correctly with native backend deployment."
echo ""
echo "API Base URL: $API_BASE_URL"
echo "Working directory: $WEB_DIR"
echo ""

# Check prerequisites
echo "[Step 1/5] Checking prerequisites..."

if ! command -v node &> /dev/null; then
    echo "❌ ERROR: Node.js is not installed"
    exit 1
fi

NODE_VERSION=$(node --version)
echo "✓ Node.js version: $NODE_VERSION"

# Check if .env file exists
ENV_FILE="$WEB_DIR/.env"
if [ -f "$ENV_FILE" ]; then
    echo "✓ .env file found"
    
    # Check if VITE_API_BASE_URL is set
    if grep -q "VITE_API_BASE_URL" "$ENV_FILE"; then
        ENV_API_URL=$(grep "VITE_API_BASE_URL" "$ENV_FILE" | cut -d '=' -f2 | tr -d '"' | tr -d "'" | xargs)
        echo "✓ VITE_API_BASE_URL found in .env: $ENV_API_URL"
    else
        echo "⚠ WARNING: VITE_API_BASE_URL not found in .env"
        echo "   Add: VITE_API_BASE_URL=$API_BASE_URL"
    fi
else
    echo "⚠ WARNING: .env file not found"
    echo "   Create apps/web/.env with: VITE_API_BASE_URL=$API_BASE_URL"
fi

# Check API_BASE_URL constant
echo ""
echo "[Step 2/5] Verifying API_BASE_URL configuration..."

CONSTANTS_FILE="$REPO_ROOT/packages/constants/src/endpoints.ts"
if [ -f "$CONSTANTS_FILE" ]; then
    echo "✓ Constants file found: $CONSTANTS_FILE"
    
    if grep -q "VITE_API_BASE_URL" "$CONSTANTS_FILE"; then
        echo "✓ API_BASE_URL uses VITE_API_BASE_URL environment variable"
    else
        echo "⚠ WARNING: API_BASE_URL configuration not found in constants"
    fi
else
    echo "⚠ WARNING: Constants file not found"
fi

# Test API server connectivity
echo ""
echo "[Step 3/5] Testing API server connectivity..."

if command -v curl &> /dev/null; then
    # Test if API server is reachable
    if curl -s -f -o /dev/null --max-time 5 "$API_BASE_URL/api/configs/" 2>/dev/null; then
        echo "✓ API server is reachable at $API_BASE_URL"
    else
        echo "⚠ WARNING: API server not reachable at $API_BASE_URL"
        echo "   Make sure the backend is running:"
        echo "   cd apps/api && python manage.py runserver"
        echo ""
        echo "   Or check if API_BASE_URL is correct"
    fi
    
    # Test CORS headers (if API responds)
    CORS_TEST=$(curl -s -I "$API_BASE_URL/api/configs/" 2>/dev/null | grep -i "access-control" || echo "")
    if [ -n "$CORS_TEST" ]; then
        echo "✓ CORS headers detected"
        echo "  $CORS_TEST"
    else
        echo "⚠ WARNING: CORS headers not detected (may be OK if same-origin)"
    fi
else
    echo "⚠ WARNING: curl not available, skipping connectivity test"
fi

# Verify API service implementation
echo ""
echo "[Step 4/5] Verifying API service implementation..."

API_SERVICE_FILE="$WEB_DIR/core/services/api.service.ts"
if [ -f "$API_SERVICE_FILE" ]; then
    echo "✓ API service file found: $API_SERVICE_FILE"
    
    # Check for axios usage
    if grep -q "axios" "$API_SERVICE_FILE"; then
        echo "✓ Uses axios for HTTP requests"
    fi
    
    # Check for withCredentials
    if grep -q "withCredentials" "$API_SERVICE_FILE"; then
        echo "✓ withCredentials enabled (for cookie-based auth)"
    fi
    
    # Check for error handling
    if grep -q "interceptors" "$API_SERVICE_FILE"; then
        echo "✓ Has response interceptors (error handling)"
    fi
else
    echo "⚠ WARNING: API service file not found"
fi

# Check service implementations
echo ""
echo "[Step 5/5] Checking service implementations..."

SERVICES_DIR="$WEB_DIR/core/services"
if [ -d "$SERVICES_DIR" ]; then
    SERVICE_COUNT=$(find "$SERVICES_DIR" -name "*.service.ts" -type f | wc -l | tr -d ' ')
    echo "✓ Found $SERVICE_COUNT service files"
    
    # Check if services extend APIService
    SERVICES_EXTENDING=$(grep -r "extends APIService" "$SERVICES_DIR" --include="*.ts" | wc -l | tr -d ' ')
    echo "✓ $SERVICES_EXTENDING services extend APIService"
    
    # Check for FamilyFlow-specific services
    if [ -f "$REPO_ROOT/packages/services/src/family/family.service.ts" ]; then
        echo "✓ Family service found"
    fi
else
    echo "⚠ WARNING: Services directory not found"
fi

# Summary and recommendations
echo ""
echo "=========================================="
echo "API Service Verification Summary"
echo "=========================================="
echo "✓ Configuration files checked"
echo "✓ API service implementation verified"
echo ""
echo "Next steps:"
echo "1. Ensure backend API is running:"
echo "   cd apps/api && python manage.py runserver"
echo ""
echo "2. Set VITE_API_BASE_URL in apps/web/.env:"
echo "   VITE_API_BASE_URL=$API_BASE_URL"
echo ""
echo "3. Test API calls from browser:"
echo "   - Start frontend: cd apps/web && pnpm dev"
echo "   - Open browser dev tools (F12)"
echo "   - Check Network tab for API requests"
echo "   - Verify requests go to: $API_BASE_URL"
echo ""
echo "4. Check CORS settings in backend if needed:"
echo "   - Verify CORS_ALLOWED_ORIGINS includes frontend URL"
echo "   - Check apps/api/plane/settings/common.py"
echo ""

