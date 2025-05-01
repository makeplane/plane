#!/bin/bash

# Plane Project Setup Script
# This script prepares the local development environment by setting up all necessary .env files
# https://github.com/makeplane/plane

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

# Copy all environment example files
services=("" "web" "apiserver" "space" "admin" "live" "silo" "email")
success=true

for service in "${services[@]}"; do
    prefix="./"
    if [ "$service" != "" ]; then
        prefix="./$service/"
    fi

    copy_env_file "${prefix}.env.example" "${prefix}.env" || success=false
    
    # Special handling for silo service
done

# Generate SECRET_KEY for Django
if [ -f "./apiserver/.env" ]; then
    echo -e "\n${YELLOW}Generating Django SECRET_KEY...${NC}"
    SECRET_KEY=$(tr -dc 'a-z0-9' < /dev/urandom | head -c50)

    if [ -z "$SECRET_KEY" ]; then
        echo -e "${RED}Error: Failed to generate SECRET_KEY.${NC}"
        echo -e "${RED}Ensure 'tr' and 'head' commands are available on your system.${NC}"
        success=false
    else
        echo -e "SECRET_KEY=\"$SECRET_KEY\"" >> ./apiserver/.env
        echo -e "${GREEN}✓${NC} Added SECRET_KEY to apiserver/.env"
    fi
else
    echo -e "${RED}✗${NC} apiserver/.env not found. SECRET_KEY not added."
    success=false
fi

# Activate Yarn (version set in package.json)
corepack enable yarn || success=false
# Install Node dependencies
yarn install || success=false

# Silo service env variables setup warning
if [ "$service" == "silo" ] && [ -f "./silo/.env" ]; then        
    # Add a note about integration setup
    echo -e "\n${YELLOW}Note: Remember to configure integration credentials in silo/.env:${NC}"
    echo -e "- JIRA_CLIENT_ID and JIRA_CLIENT_SECRET"
    echo -e "- LINEAR_CLIENT_ID and LINEAR_CLIENT_SECRET"
    echo -e "- GITHUB_APP_ID and GITHUB_PRIVATE_KEY"
    echo -e "- GITLAB_CLIENT_ID and GITLAB_CLIENT_SECRET"
    echo -e "- ASANA_CLIENT_ID and ASANA_CLIENT_SECRET"
    echo -e "- SLACK_CLIENT_ID and SLACK_CLIENT_SECRET"
fi

# Special handling for email service
# if [ "$service" == "email" ] && [ -f "./email/.env" ]; then
#     echo -e "\n${YELLOW}Setting up Email service configurations...${NC}"
    
#     # Create keys directory if it doesn't exist
#     mkdir -p ./email/keys
    
#     # Generate self-signed certificate if not present
#     if [ ! -f "./email/keys/cert.pem" ] || [ ! -f "./email/keys/key.pem" ]; then
#         echo -e "${YELLOW}Generating self-signed certificate for email service...${NC}"
#         openssl req -x509 -newkey rsa:4096 -keyout ./email/keys/key.pem -out ./email/keys/cert.pem -days 365 -nodes -subj "/CN=plane.email"
#         echo -e "${GREEN}✓${NC} Generated self-signed certificate"
#     fi
    
#     # Update email service configuration
#     sed -i.bak "s|TLS_CERT_PATH=keys/cert.pem|TLS_CERT_PATH=./keys/cert.pem|" ./email/.env
#     sed -i.bak "s|TLS_PRIV_KEY_PATH=keys/key.pem|TLS_PRIV_KEY_PATH=./keys/key.pem|" ./email/.env
    
#     echo -e "${GREEN}✓${NC} Updated Email service configuration"
# fi

# Special handling for monitor service
# if [ "$service" == "monitor" ] && [ -f "./monitor/.env" ]; then
#     echo -e "\n${YELLOW}Setting up Monitor service configurations...${NC}"
#     echo -e "${GREEN}✓${NC} Monitor service environment file created"
#     echo -e "${YELLOW}Note: Configure monitoring endpoints and thresholds in monitor/.env${NC}"
# fi

# Summary
echo -e "\n${YELLOW}Setup status:${NC}"
if [ "$success" = true ]; then
    echo -e "${GREEN}✓${NC} Environment setup completed successfully!\n"
    echo -e "${BOLD}Next steps:${NC}"
    echo -e "1. Review the .env files in each folder if needed"
    echo -e "2. Start the services with: ${BOLD}docker compose -f docker-compose-local.yml up -d${NC}"
    echo -e "\n${GREEN}Happy coding! 🚀${NC}"
else
    echo -e "${RED}✗${NC} Some issues occurred during setup. Please check the errors above.\n"
    echo -e "For help, visit: ${BLUE}https://github.com/makeplane/plane${NC}"
    exit 1
fi
