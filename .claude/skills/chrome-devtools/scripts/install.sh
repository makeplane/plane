#!/bin/bash
# Installation script for Chrome DevTools Agent Skill

set -e

echo "🚀 Installing Chrome DevTools Agent Skill..."
echo ""

# Check Node.js version
echo "Checking Node.js version..."
NODE_VERSION=$(node --version | cut -d'v' -f2 | cut -d'.' -f1)

if [ "$NODE_VERSION" -lt 18 ]; then
  echo "❌ Error: Node.js 18+ is required. Current version: $(node --version)"
  echo "   Please upgrade Node.js: https://nodejs.org/"
  exit 1
fi

echo "✓ Node.js version: $(node --version)"
echo ""

# Check for system dependencies (Linux only)
if [[ "$OSTYPE" == "linux-gnu"* ]]; then
  echo "Checking system dependencies (Linux)..."

  # Check for critical Chrome dependencies
  MISSING_DEPS=()

  if ! ldconfig -p | grep -q libnss3.so; then
    MISSING_DEPS+=("libnss3")
  fi

  if ! ldconfig -p | grep -q libnspr4.so; then
    MISSING_DEPS+=("libnspr4")
  fi

  if ! ldconfig -p | grep -q libgbm.so; then
    MISSING_DEPS+=("libgbm1")
  fi

  if [ ${#MISSING_DEPS[@]} -gt 0 ]; then
    echo "⚠️  Missing system dependencies: ${MISSING_DEPS[*]}"
    echo ""
    echo "   Chrome/Chromium requires system libraries to run."
    echo "   Install them with:"
    echo ""
    echo "   ./install-deps.sh"
    echo ""
    echo "   Or manually:"
    echo "   sudo apt-get install -y libnss3 libnspr4 libgbm1 libasound2t64 libatk1.0-0 libatk-bridge2.0-0 libcups2 libdrm2"
    echo ""

    read -p "   Continue anyway? (y/N) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      echo "Installation cancelled."
      exit 1
    fi
  else
    echo "✓ System dependencies found"
  fi
  echo ""
elif [[ "$OSTYPE" == "darwin"* ]]; then
  echo "Platform: macOS (no system dependencies needed)"
  echo ""
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "cygwin" ]]; then
  echo "Platform: Windows (no system dependencies needed)"
  echo ""
fi

# Install Node.js dependencies
echo "Installing Node.js dependencies..."
npm install

echo ""
echo "✅ Installation complete!"
echo ""
echo "Test the installation:"
echo "  node navigate.js --url https://example.com"
echo ""
echo "For more information:"
echo "  cat README.md"
echo ""
