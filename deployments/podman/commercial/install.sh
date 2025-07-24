#!/bin/bash

# Plane Installation Script
# ========================
#
# This script installs Plane and its systemd container configurations.
#
# Usage:
# ------
# 1. First, extract the plane podman archive:
#    $ tar -xzf plane-podman.tar.gz
#    $ cd plane-podman
#
# 2. Then run the installation script:
#    With sudo access (recommended):
#    $ ./install.sh --domain your-domain.com
#    This will install Plane in /opt/plane
#
#    Without sudo access:
#    $ ./install.sh --domain your-domain.com --base-dir /your/custom/path
#    This will install Plane in your specified path
#
# Notes:
# ------
# - The script will automatically detect if you have sudo access
# - If you don't have sudo access, you MUST specify PLANE_BASE_DIR
# - Systemd container configurations will be installed in ~/.config/containers/systemd/
# - All paths in container files will be automatically updated to match your installation path
# - Domain parameter is required for proper configuration
#
# Example:
# --------
# tar -xzf plane-podman.tar.gz
# cd plane-podman
# ./install.sh --domain plane.example.com
#
# This will:
# 1. Install systemd configurations in ~/.config/containers/systemd/
# 2. Install Plane in /opt/plane
# 3. Update all container file paths to use /opt/plane
# 4. Configure domain settings and generate machine signature

# Exit on error
set -e

# Default paths
SYSTEMD_CONFIG_DIR="${HOME}/.config/containers/systemd"
CURRENT_USER="$(id -u)"
CURRENT_GROUP="$(id -g)"

# Function to check sudo access
check_sudo_access() {
    if sudo -n true 2>/dev/null; then
        return 0  # true, has sudo access
    else
        return 1  # false, no sudo access
    fi
}

print_log() {
    echo -e "\033[90m$(date +%Y-%m-%d\ %H:%M:%S) $1\033[0m"
}

# Function to display usage
show_usage() {
    echo "Usage: $0 [--domain <domain-name>] [--base-dir <base-dir>]"
    echo ""
    echo "Optional flags:"
    echo "  --domain <domain-name>          Domain name for Plane installation (default: localhost)"
    echo "  --base-dir <base-dir>           Plane installation directory (default: ${PLANE_SETUP_DIR})"    
    echo ""
    
    echo "Example: $0 --domain plane.example.com --base-dir /your/custom/path"
    echo ""
    echo "Systemd configuration will be installed in: ${SYSTEMD_CONFIG_DIR}"
    exit 1
}

# Function to create required directories
create_required_dirs() {
    local base_dir="$1"
    print_log "Creating required directories in ${base_dir}..."

    data_dirs=(monitor postgres redis rabbitmq minio)
    logs_dirs=(api worker beat_worker migrator)
    proxy_dirs=(config data)
    MKDIR_CMD="sudo"

    if check_sudo_access; then
        MKDIR_CMD="sudo mkdir -p"
    else
        MKDIR_CMD="mkdir -p"
    fi
        
    for dir in "${data_dirs[@]}"; do
        ${MKDIR_CMD} "${base_dir}/data/${dir}"
    done
    for dir in "${logs_dirs[@]}"; do
        ${MKDIR_CMD} "${base_dir}/logs/${dir}"
    done
    for dir in "${proxy_dirs[@]}"; do
        ${MKDIR_CMD} "${base_dir}/proxy/${dir}"
    done

    if check_sudo_access; then
        sudo chown -R "${CURRENT_USER}":"${CURRENT_GROUP}" "${base_dir}"
    fi
}

# Function to extract and move files
extract_and_move_files() {
    local target_dir="$1"
    local domain="$2"
    
    # Create systemd directory if it doesn't exist
    print_log "Creating systemd configuration directory..."
    mkdir -p "${SYSTEMD_CONFIG_DIR}"
    
    # Move systemd files directly
    print_log "Moving systemd configuration files..."
    cp -r "config/"* "${SYSTEMD_CONFIG_DIR}/"
    
    # Create required directories and move Plane files
    print_log "Moving Plane files..."
    create_required_dirs "${target_dir}"
    cp -r "plane/"* "${target_dir}/"
    print_log "Plane files moved to ${target_dir}"

    # Move Caddyfile to proxy directory
    print_log "Moving Caddyfile to proxy directory..."
    if [ -f "${target_dir}/Caddyfile" ]; then
        mv "${target_dir}/Caddyfile" "${target_dir}/proxy/Caddyfile"
    fi
    print_log "Caddyfile moved to ${target_dir}/proxy/Caddyfile"

    # Update plane.env with domain and machine signature
    print_log "Updating plane.env configuration..."
    local env_file="${target_dir}/plane.env"

    if [ -f "$env_file" ]; then
        local backup_file="${env_file}.bak"
        cp "${env_file}" "${backup_file}"

        # Generate machine signature
        local machine_signature=$(uuidgen)
        # Update domain and machine signature in plane.env
        sed -i "s|^DOMAIN_NAME=.*|DOMAIN_NAME=${domain}|g" "$backup_file"
        sed -i "s|^APP_DOMAIN=.*|APP_DOMAIN=${domain}|g" "$backup_file"
        sed -i "s|^MACHINE_SIGNATURE=.*|MACHINE_SIGNATURE=${machine_signature}|g" "$backup_file"
        sed -i "s|^WEB_URL=.*|WEB_URL=http://${domain}:8080|g" "$backup_file"
        sed -i "s|^CORS_ALLOWED_ORIGINS=.*|CORS_ALLOWED_ORIGINS=http://${domain}|g" "$backup_file"
        cp "${backup_file}" "${env_file}"
        rm "${backup_file}"
    fi
}

# Function to update configuration files
update_configs() {
    print_log "Updating configuration files..."
    
    # Update paths in all .container files in systemd directory
    for container_file in "${SYSTEMD_CONFIG_DIR}"/*.container; do
        if [ -f "$container_file" ]; then
            # Replace /opt/plane with the actual base directory in EnvironmentFile lines
            sed -i "s|/opt/plane/|${PLANE_SETUP_DIR}/|g" "$container_file"
        fi
    done
}

installation_summary() {
    local domain="$1"
    echo "****************************************************"
    echo "************ Plane Installation Summary ************"
    echo "****************************************************"
    echo ""
    echo "Domain: ${domain}"
    echo "Base directory: ${PLANE_SETUP_DIR}"
    echo "Systemd config directory: ${SYSTEMD_CONFIG_DIR}"
    echo ""
    echo "What's next?"
    echo ""
    echo "1. systemctl --user daemon-reload"
    echo "2. Start Plane Network service:"
    echo "   systemctl start --user plane-nw-network.service"
    echo "3. Start all Plane services"
    echo "   systemctl start --user plane-{db,redis,mq,minio}.service"
    echo "   systemctl start --user {api,worker,beat-worker,migrator,monitor}.service"
    echo "   systemctl start --user {web,space,admin,live,proxy}.service"
    echo ""
    echo " Check the status of the Plane Network service:"
    echo "   systemctl status --user plane-nw-network.service"
    echo ""
    echo " Check the status of the Plane services:"
    echo "   systemctl status --user plane-{db,redis,mq,minio}.service"
    echo "   systemctl status --user {api,worker,beat-worker,migrator,monitor}.service"
    echo "   systemctl status --user {web,space,admin,live,proxy}.service"
    echo ""
    echo -e " To access the Plane web interface, open your browser and navigate to: \033[92mhttp://${domain}:8080\033[0m"
    echo ""
    echo "****************************************************"
}

# Main installation process
main() {
    if check_sudo_access; then
        PLANE_SETUP_DIR="/opt/plane"
    else
        PLANE_SETUP_DIR="$HOME/plane"
    fi

    local domain="localhost"  # Set default domain to localhost
    local base_dir="${PLANE_SETUP_DIR}"

    # Parse command line arguments
    while [[ $# -gt 0 ]]; do
        case $1 in
            --domain)
                domain="$2"
                shift 2
                ;;
            --domain=*)
                domain="${1#*=}"
                shift
                ;;
            --base-dir)
                base_dir="$2"
                shift 2
                ;;
            --base-dir=*)
                base_dir="${1#*=}"
                shift
                ;;
            --help|*)
                show_usage
                exit 0
                ;;
            *)
                shift
                ;;
        esac
    done

    # Validate required parameters
    if [ -n "$base_dir" ]; then
        PLANE_SETUP_DIR="$base_dir"
    fi

    # clear screen
    clear
    echo "Starting installation..."
    echo ""
    
    extract_and_move_files "$base_dir" "$domain"
    update_configs
    echo ""
    echo ""
    installation_summary "$domain"
}

# Run main function with all arguments
main "$@"