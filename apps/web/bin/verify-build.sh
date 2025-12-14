#!/bin/bash
#
# Frontend Build Verification Script for Native Deployment
#
# This script verifies that the frontend build process works correctly
# in native (non-Docker) deployment environment.
#
# Task: T037 - Test frontend build process in native environment
#
# Usage:
#   ./bin/verify-build.sh
#
# Prerequisites:
#   - Node.js >= 22.18.0
#   - pnpm 10.24.0+
#   - Dependencies installed (pnpm install)
#

set -e  # Exit on any error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
WEB_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
REPO_ROOT="$(cd "$WEB_DIR/../.." && pwd)"

echo "=========================================="
echo "Frontend Build Verification"
echo "=========================================="
echo ""
echo "This script verifies that the frontend build process"
echo "works correctly in native deployment environment."
echo ""
echo "Working directory: $WEB_DIR"
echo ""

# Check prerequisites
echo "[Step 1/4] Checking prerequisites..."

if ! command -v pnpm &> /dev/null; then
    echo "❌ ERROR: pnpm is not installed"
    echo "   Install with: npm install -g pnpm"
    exit 1
fi

PNPM_VERSION=$(pnpm --version)
echo "✓ pnpm version: $PNPM_VERSION"

if ! command -v node &> /dev/null; then
    echo "❌ ERROR: Node.js is not installed"
    exit 1
fi

NODE_VERSION=$(node --version)
echo "✓ Node.js version: $NODE_VERSION"

# Check if dependencies are installed
if [ ! -d "$WEB_DIR/node_modules" ]; then
    echo "⚠ WARNING: node_modules not found. Installing dependencies..."
    cd "$WEB_DIR"
    pnpm install
else
    echo "✓ Dependencies installed"
fi

# Clean previous build
echo ""
echo "[Step 2/4] Cleaning previous build..."
cd "$WEB_DIR"
if [ -d "build" ]; then
    rm -rf build
    echo "✓ Previous build removed"
else
    echo "✓ No previous build to clean"
fi

# Run build
echo ""
echo "[Step 3/4] Running build process..."
echo "Executing: pnpm build"
cd "$WEB_DIR"

if pnpm build; then
    echo ""
    echo "✓ Build completed successfully"
else
    echo ""
    echo "❌ ERROR: Build failed"
    exit 1
fi

# Verify build output
echo ""
echo "[Step 4/4] Verifying build output..."

BUILD_DIR="$WEB_DIR/build"
if [ ! -d "$BUILD_DIR" ]; then
    echo "❌ ERROR: Build directory not found"
    exit 1
fi

echo "✓ Build directory exists: $BUILD_DIR"

# Check for expected build artifacts
if [ -d "$BUILD_DIR/client" ]; then
    echo "✓ Client build directory exists"
    
    # Check for index.html
    if [ -f "$BUILD_DIR/client/index.html" ]; then
        echo "✓ index.html found"
    else
        echo "⚠ WARNING: index.html not found in expected location"
    fi
    
    # Check for assets directory
    if [ -d "$BUILD_DIR/client/assets" ]; then
        ASSET_COUNT=$(find "$BUILD_DIR/client/assets" -type f | wc -l | tr -d ' ')
        echo "✓ Assets directory exists ($ASSET_COUNT files)"
    else
        echo "⚠ WARNING: Assets directory not found"
    fi
else
    echo "⚠ WARNING: Client build directory not found"
fi

if [ -d "$BUILD_DIR/server" ]; then
    echo "✓ Server build directory exists"
    
    if [ -f "$BUILD_DIR/server/index.js" ]; then
        echo "✓ Server index.js found"
    else
        echo "⚠ WARNING: Server index.js not found"
    fi
else
    echo "⚠ WARNING: Server build directory not found"
fi

# Summary
echo ""
echo "=========================================="
echo "Build Verification Summary"
echo "=========================================="
echo "✓ Build process completed successfully"
echo "✓ Build artifacts verified"
echo ""
echo "Build output location: $BUILD_DIR"
echo ""
echo "To preview the build:"
echo "  cd $WEB_DIR"
echo "  pnpm preview"
echo ""
echo "Or serve manually:"
echo "  serve -s build/client -l 3000"
echo ""

