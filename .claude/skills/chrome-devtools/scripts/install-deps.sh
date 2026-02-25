#!/bin/bash
# System dependencies installation script for Chrome DevTools Agent Skill
# This script installs required system libraries for running Chrome/Chromium

set -e

echo "🚀 Installing system dependencies for Chrome/Chromium..."
echo ""

# Detect OS
if [ -f /etc/os-release ]; then
    . /etc/os-release
    OS=$ID
else
    echo "❌ Cannot detect OS. This script supports Debian/Ubuntu-based systems."
    exit 1
fi

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    SUDO="sudo"
    echo "⚠️  This script requires root privileges to install system packages."
    echo "   You may be prompted for your password."
    echo ""
else
    SUDO=""
fi

# Install dependencies based on OS
case $OS in
    ubuntu|debian|pop)
        echo "Detected: $PRETTY_NAME"
        echo "Installing dependencies with apt..."
        echo ""

        $SUDO apt-get update

        # Install Chrome dependencies
        $SUDO apt-get install -y \
            ca-certificates \
            fonts-liberation \
            libasound2t64 \
            libatk-bridge2.0-0 \
            libatk1.0-0 \
            libc6 \
            libcairo2 \
            libcups2 \
            libdbus-1-3 \
            libexpat1 \
            libfontconfig1 \
            libgbm1 \
            libgcc1 \
            libglib2.0-0 \
            libgtk-3-0 \
            libnspr4 \
            libnss3 \
            libpango-1.0-0 \
            libpangocairo-1.0-0 \
            libstdc++6 \
            libx11-6 \
            libx11-xcb1 \
            libxcb1 \
            libxcomposite1 \
            libxcursor1 \
            libxdamage1 \
            libxext6 \
            libxfixes3 \
            libxi6 \
            libxrandr2 \
            libxrender1 \
            libxss1 \
            libxtst6 \
            lsb-release \
            wget \
            xdg-utils

        echo ""
        echo "✅ System dependencies installed successfully!"
        ;;

    fedora|rhel|centos)
        echo "Detected: $PRETTY_NAME"
        echo "Installing dependencies with dnf/yum..."
        echo ""

        # Try dnf first, fallback to yum
        if command -v dnf &> /dev/null; then
            PKG_MGR="dnf"
        else
            PKG_MGR="yum"
        fi

        $SUDO $PKG_MGR install -y \
            alsa-lib \
            atk \
            at-spi2-atk \
            cairo \
            cups-libs \
            dbus-libs \
            expat \
            fontconfig \
            glib2 \
            gtk3 \
            libdrm \
            libgbm \
            libX11 \
            libxcb \
            libXcomposite \
            libXcursor \
            libXdamage \
            libXext \
            libXfixes \
            libXi \
            libxkbcommon \
            libXrandr \
            libXrender \
            libXScrnSaver \
            libXtst \
            mesa-libgbm \
            nspr \
            nss \
            pango

        echo ""
        echo "✅ System dependencies installed successfully!"
        ;;

    arch|manjaro)
        echo "Detected: $PRETTY_NAME"
        echo "Installing dependencies with pacman..."
        echo ""

        $SUDO pacman -Sy --noconfirm \
            alsa-lib \
            at-spi2-core \
            cairo \
            cups \
            dbus \
            expat \
            glib2 \
            gtk3 \
            libdrm \
            libx11 \
            libxcb \
            libxcomposite \
            libxcursor \
            libxdamage \
            libxext \
            libxfixes \
            libxi \
            libxkbcommon \
            libxrandr \
            libxrender \
            libxshmfence \
            libxss \
            libxtst \
            mesa \
            nspr \
            nss \
            pango

        echo ""
        echo "✅ System dependencies installed successfully!"
        ;;

    *)
        echo "❌ Unsupported OS: $OS"
        echo "   This script supports: Ubuntu, Debian, Fedora, RHEL, CentOS, Arch, Manjaro"
        echo ""
        echo "   Please install Chrome/Chromium dependencies manually for your OS."
        echo "   See: https://pptr.dev/troubleshooting"
        exit 1
        ;;
esac

echo ""
echo "📝 Next steps:"
echo "   1. Run: cd $(dirname "$0")"
echo "   2. Run: npm install"
echo "   3. Test: node navigate.js --url https://example.com"
echo ""
