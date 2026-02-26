#!/bin/bash

# Plane Project Setup Script
# This script prepares the local development environment by setting up all necessary .env files
# https://github.com/makeplane/plane

# Resolve the project root (one level up from src/)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
SRC_DIR="$SCRIPT_DIR"

# Set colors for output messages
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Print header
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}${BLUE}                   Plane - Project Management Tool                    ${NC}"
echo -e "${BOLD}${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}Setting up your development environment...${NC}\n"

# Function to handle file copying with error checking
copy_env_file() {
    local source=$1
    local destination=$2

    if [ ! -f "$source" ]; then
        echo -e "${RED}Error: Source file $source does not exist.${NC}"
        return 1
    fi

    cp "$source" "$destination"

    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✓${NC} Copied $destination"
    else
        echo -e "${RED}✗${NC} Failed to copy $destination"
        return 1
    fi
}

# Export character encoding settings for macOS compatibility
export LC_ALL=C
export LC_CTYPE=C
echo -e "${YELLOW}Setting up environment files...${NC}"

# Copy root .env.example (lives at project root)
success=true
copy_env_file "$PROJECT_ROOT/.env.example" "$PROJECT_ROOT/.env" || success=false

# Copy service .env files (live inside src/apps/)
services=("web" "api" "space" "admin" "live")

for service in "${services[@]}"; do
    prefix="$SRC_DIR/apps/$service/"
    copy_env_file "${prefix}.env.example" "${prefix}.env" || success=false
done

# Generate SECRET_KEY for Django
if [ -f "$SRC_DIR/apps/api/.env" ]; then
    echo -e "\n${YELLOW}Generating Django SECRET_KEY...${NC}"
    SECRET_KEY=$(tr -dc 'a-z0-9' < /dev/urandom | head -c50)

    if [ -z "$SECRET_KEY" ]; then
        echo -e "${RED}Error: Failed to generate SECRET_KEY.${NC}"
        echo -e "${RED}Ensure 'tr' and 'head' commands are available on your system.${NC}"
        success=false
    else
        echo -e "SECRET_KEY=\"$SECRET_KEY\"" >> "$SRC_DIR/apps/api/.env"
        echo -e "${GREEN}✓${NC} Added SECRET_KEY to src/apps/api/.env"
    fi
else
    echo -e "${RED}✗${NC} src/apps/api/.env not found. SECRET_KEY not added."
    success=false
fi

# Activate pnpm (version set in package.json)
cd "$SRC_DIR"
corepack enable pnpm || success=false
# Install Node dependencies
pnpm install || success=false

# Summary
echo -e "\n${YELLOW}Setup status:${NC}"
if [ "$success" = true ]; then
    echo -e "${GREEN}✓${NC} Environment setup completed successfully!\n"
    echo -e "${BOLD}Next steps:${NC}"
    echo -e "1. Review the .env files in each folder if needed"
    echo -e "2. Start the services with: ${BOLD}./orchestrate.sh${NC}"
    echo -e "\n${GREEN}Happy coding! 🚀${NC}"
else
    echo -e "${RED}✗${NC} Some issues occurred during setup. Please check the errors above.\n"
    echo -e "For help, visit: ${BLUE}https://github.com/makeplane/plane${NC}"
    exit 1
fi
