#!/bin/bash
#
# Frontend API Endpoints Verification Script for Native Deployment
#
# This script verifies that frontend can access API endpoints
# without Docker network issues.
#
# Task: T041 - Verify frontend can access API endpoints without Docker network issues
#
# Usage:
#   ./bin/verify-api-endpoints.sh [API_BASE_URL]
#
# Arguments:
#   API_BASE_URL: Optional API base URL (defaults to http://localhost:8000)
#
# Prerequisites:
#   - Backend API server running
#   - curl or wget available
#

set -e  # Exit on any error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEB_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$WEB_DIR/../.." && pwd)"

# Default API URL
API_BASE_URL="${1:-http://localhost:8000}"

echo "=========================================="
echo "Frontend API Endpoints Verification"
echo "=========================================="
echo ""
echo "This script verifies that frontend can access API endpoints"
echo "without Docker network issues in native deployment."
echo ""
echo "API Base URL: $API_BASE_URL"
echo "Working directory: $WEB_DIR"
echo ""

# Check prerequisites
echo "[Step 1/5] Checking prerequisites..."

if ! command -v curl &> /dev/null && ! command -v wget &> /dev/null; then
    echo "⚠ WARNING: Neither curl nor wget available for testing"
    echo "   Install curl: brew install curl (macOS) or apt install curl (Linux)"
else
    if command -v curl &> /dev/null; then
        echo "✓ curl available"
        HTTP_CLIENT="curl"
    else
        echo "✓ wget available"
        HTTP_CLIENT="wget"
    fi
fi

# Test API server connectivity
echo ""
echo "[Step 2/5] Testing API server connectivity..."

test_endpoint() {
    local endpoint=$1
    local description=$2
    
    if [ "$HTTP_CLIENT" = "curl" ]; then
        if curl -s -f -o /dev/null --max-time 5 "$API_BASE_URL$endpoint" 2>/dev/null; then
            echo "✓ $description: Reachable"
            return 0
        else
            HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$API_BASE_URL$endpoint" 2>/dev/null || echo "000")
            if [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "403" ]; then
                echo "✓ $description: Reachable (auth required, HTTP $HTTP_CODE)"
                return 0
            else
                echo "✗ $description: Not reachable (HTTP $HTTP_CODE)"
                return 1
            fi
        fi
    elif [ "$HTTP_CLIENT" = "wget" ]; then
        if wget -q --spider --timeout=5 "$API_BASE_URL$endpoint" 2>/dev/null; then
            echo "✓ $description: Reachable"
            return 0
        else
            echo "✗ $description: Not reachable"
            return 1
        fi
    fi
    return 1
}

# Test key API endpoints
ENDPOINTS_PASSED=0
ENDPOINTS_TOTAL=0

# Test config endpoint (public)
ENDPOINTS_TOTAL=$((ENDPOINTS_TOTAL + 1))
if test_endpoint "/api/configs/" "Config endpoint"; then
    ENDPOINTS_PASSED=$((ENDPOINTS_PASSED + 1))
fi

# Test families endpoint (requires auth)
ENDPOINTS_TOTAL=$((ENDPOINTS_TOTAL + 1))
if test_endpoint "/api/families/" "Families endpoint"; then
    ENDPOINTS_PASSED=$((ENDPOINTS_PASSED + 1))
fi

# Test CORS headers
echo ""
echo "[Step 3/5] Testing CORS configuration..."

if [ "$HTTP_CLIENT" = "curl" ]; then
    CORS_HEADERS=$(curl -s -I "$API_BASE_URL/api/configs/" 2>/dev/null | grep -i "access-control" || echo "")
    if [ -n "$CORS_HEADERS" ]; then
        echo "✓ CORS headers present:"
        echo "$CORS_HEADERS" | sed 's/^/  /'
    else
        echo "⚠ WARNING: CORS headers not detected"
        echo "   This may be OK if frontend and backend are same-origin"
        echo "   Or CORS may need to be configured in backend settings"
    fi
fi

# Check environment configuration
echo ""
echo "[Step 4/5] Checking frontend API configuration..."

ENV_FILE="$WEB_DIR/.env"
if [ -f "$ENV_FILE" ]; then
    if grep -q "VITE_API_BASE_URL" "$ENV_FILE"; then
        ENV_API_URL=$(grep "VITE_API_BASE_URL" "$ENV_FILE" | cut -d '=' -f2 | tr -d '"' | tr -d "'" | xargs)
        echo "✓ VITE_API_BASE_URL configured: $ENV_API_URL"
        
        if [ "$ENV_API_URL" != "$API_BASE_URL" ]; then
            echo "⚠ WARNING: .env API URL ($ENV_API_URL) differs from test URL ($API_BASE_URL)"
        fi
    else
        echo "⚠ WARNING: VITE_API_BASE_URL not set in .env"
        echo "   Add: VITE_API_BASE_URL=$API_BASE_URL"
    fi
else
    echo "⚠ WARNING: .env file not found"
    echo "   Create apps/web/.env with: VITE_API_BASE_URL=$API_BASE_URL"
fi

# Verify service implementations
echo ""
echo "[Step 5/5] Verifying API service implementations..."

# Check BacklogService
BACKLOG_SERVICE="$REPO_ROOT/packages/services/src/family/backlog.service.ts"
if [ -f "$BACKLOG_SERVICE" ]; then
    echo "✓ BacklogService found"
    
    # Check endpoint paths
    if grep -q "/api/families" "$BACKLOG_SERVICE"; then
        echo "✓ Uses /api/families endpoints"
    fi
    
    if grep -q "/backlog" "$BACKLOG_SERVICE"; then
        echo "✓ Uses /backlog endpoints"
    fi
else
    echo "⚠ WARNING: BacklogService not found"
fi

# Check FamilyService
FAMILY_SERVICE="$REPO_ROOT/packages/services/src/family/family.service.ts"
if [ -f "$FAMILY_SERVICE" ]; then
    echo "✓ FamilyService found"
    
    if grep -q "/api/families" "$FAMILY_SERVICE"; then
        echo "✓ Uses /api/families endpoints"
    fi
else
    echo "⚠ WARNING: FamilyService not found"
fi

# Summary
echo ""
echo "=========================================="
echo "API Endpoints Verification Summary"
echo "=========================================="
echo "Endpoints tested: $ENDPOINTS_PASSED/$ENDPOINTS_TOTAL"
echo ""

if [ $ENDPOINTS_PASSED -eq $ENDPOINTS_TOTAL ]; then
    echo "✓ All API endpoints are reachable"
else
    echo "⚠ Some endpoints are not reachable"
    echo "   Make sure backend is running:"
    echo "   cd apps/api && python manage.py runserver"
fi

echo ""
echo "To test from browser:"
echo "1. Start frontend: cd apps/web && pnpm dev"
echo "2. Open browser dev tools (F12) → Network tab"
echo "3. Navigate to a family page"
echo "4. Verify API requests:"
echo "   - Requests go to: $API_BASE_URL"
echo "   - No CORS errors in console"
echo "   - Responses return successfully"
echo "   - No network errors"
echo ""
echo "Common issues to check:"
echo "- CORS_ALLOWED_ORIGINS in backend includes frontend URL"
echo "- VITE_API_BASE_URL matches backend URL"
echo "- Backend is accessible from frontend (no firewall blocking)"
echo ""

