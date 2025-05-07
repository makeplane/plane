#! /bin/bash

DEBIAN_FRONTEND=noninteractive
BACKEND_ENV_FILE=/opt/plane/backend/backend.env
TERM=xterm-256color

PLANE_SERVICES=(admin web space live api worker beat-worker caddy)

# if the user is not ubuntu, switch to ubuntu
# if [ "$USER" != "ubuntu" ]; then
#   sudo su - ubuntu
# fi

function welcome() {
clear

cat <<"EOF"
--------------------------------------------
 ____  _                          ///////// 
|  _ \| | __ _ _ __   ___         ///////// 
| |_) | |/ _` | '_ \ / _ \   /////    ///// 
|  __/| | (_| | | | |  __/   /////    ///// 
|_|   |_|\__,_|_| |_|\___|        ////      
                                  ////      
--------------------------------------------
           Project management tool          
--------------------------------------------
EOF
}

function setup_welcome_message() {
  # Create a custom MOTD file
  sudo tee /etc/update-motd.d/99-plane-welcome > /dev/null << 'EOF'
#!/bin/bash

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m'

cat << "BANNER"
--------------------------------------------
 ____  _                          ///////// 
|  _ \| | __ _ _ __   ___         ///////// 
| |_) | |/ _` | '_ \ / _ \   /////    ///// 
|  __/| | (_| | | | |  __/   /////    ///// 
|_|   |_|\__,_|_| |_|\___|        ////      
                                  ////      
--------------------------------------------
           Project management tool          
--------------------------------------------
BANNER

echo -e "${GREEN}Welcome to Plane CE Server!${NC}"
echo -e "${BLUE}Available commands:${NC}"
echo "  plane start       - Start all services"
echo "  plane stop        - Stop all services"
echo "  plane status      - Check services status"
echo "  plane logs        - View service logs"
echo "  plane configure   - Configure Plane"
echo "  plane upgrade     - Upgrade Plane version"
echo ""
echo "For more information, visit: https://docs.plane.so"
echo "--------------------------------------------"
EOF

  # Make the MOTD script executable
  sudo chmod +x /etc/update-motd.d/99-plane-welcome

  # Remove default MOTD files that we don't need
  sudo rm -f /etc/update-motd.d/10-help-text
  sudo rm -f /etc/update-motd.d/50-motd-news
  sudo rm -f /etc/update-motd.d/99-esm
}

function show_spinner(){
  local pid=$1
  local delay=0.25
  local spin='⣷⣯⣟⡿⢿⣻⣽⣾'
  local charwidth=1
  local i=0
  local j=0
  local GREEN='\e[32m'
  local RED='\e[31m'
  local NC='\e[0m'
  local message=$2
  local temp_log="/tmp/plane_install_temp.log"
  local final_message=${message/Starting/Started}
  final_message=${final_message/Stopping/Stopped}
  final_message=${final_message/Installing/Installed}
  final_message=${final_message/Updating/Updated}
  final_message=${final_message/Adding/Added}
  final_message=${final_message/Reinstalling/Reinstalled}

  # Clear temp log
  echo "" > "$temp_log"

  # Check if running in CI environment
  if [ -n "$CI" ]; then
    echo "🔄 $message..."
    wait $pid
    local exit_status=$?
    if [ $exit_status -eq 0 ]; then
      echo "✅ $final_message"
    else
      echo "❌ $final_message"
      if [ -f "$temp_log" ]; then
        echo -e "\nError details:"
        cat "$temp_log"
        echo ""
      fi
      return 1
    fi
    return 0
  fi

  # Interactive environment with spinner
  while ps -p $pid > /dev/null; do
    local i=$(( (i + 1) % ${#spin} ))
    local j=$(( j + 1 ))
    printf "\r\033[K[${GREEN}${spin:$i:$charwidth}${NC}] $message..."
    sleep $delay
  done

  wait $pid
  local exit_status=$?
  
  if [ $exit_status -eq 0 ]; then
    printf "\r\033[K[${GREEN}✓${NC}] $final_message\n"
  else
    printf "\r\033[K[${RED}✗${NC}] $final_message\n"
    if [ -f "$temp_log" ]; then
      echo -e "\nError details:"
      cat "$temp_log"
      echo ""
    fi
    return 1
  fi
  return 0
}

function validate_and_fix_python(){
  local python_version=$(python3 --version)
  if [ $? -ne 0 ]; then
    echo "Failed to get Python version"
    return 1
  fi

  # check if python3-apt is installed
  if ! dpkg -l | grep -q python3-apt; then
    echo "python3-apt is not installed"
    return 1
  fi

  sudo apt install --reinstall python3-apt > /tmp/plane_install_temp.log 2>&1 &
  show_spinner $! "Reinstalling python3-apt"
  if [ $? -ne 0 ]; then
    echo "Failed to reinstall python3-apt"
    exit 1
  fi

  if [ -f "/usr/lib/python3/dist-packages/apt_pkg.cpython-310-x86_64-linux-gnu.so" ] && 
      [ ! -f "/usr/lib/python3/dist-packages/apt_pkg.cpython-312-x86_64-linux-gnu.so" ]; then
    sudo ln -s /usr/lib/python3/dist-packages/apt_pkg.cpython-310-x86_64-linux-gnu.so /usr/lib/python3/dist-packages/apt_pkg.cpython-312-x86_64-linux-gnu.so
  fi

  return 0
}

function install_caddy(){
  sudo apt-get update -y > /tmp/plane_install_temp.log 2>&1 &
  show_spinner $! "Updating apt for Caddy"
  if [ $? -ne 0 ]; then
    return 1
  fi
  sudo apt-get install -y debian-keyring debian-archive-keyring apt-transport-https curl > /tmp/plane_install_temp.log 2>&1 &
  show_spinner $! "Installing Caddy dependencies"
  if [ $? -ne 0 ]; then
    echo "Failed to install Caddy dependencies"
    return 1
  fi
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor --yes -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg > /tmp/plane_install_temp.log 2>&1
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list > /tmp/plane_install_temp.log 2>&1
  sudo apt-get update > /tmp/plane_install_temp.log 2>&1 &
  show_spinner $! "Updating apt for Caddy"
  if [ $? -ne 0 ]; then
    echo "Failed to update apt for Caddy"
    return 1
  fi
  sudo apt-get install caddy > /tmp/plane_install_temp.log 2>&1 &
  show_spinner $! "Installing Caddy"
  if [ $? -ne 0 ]; then
    echo "Failed to install Caddy"
    return 1
  fi
  sudo service caddy stop > /tmp/plane_install_temp.log 2>&1 &
  show_spinner $! "Stopping Caddy"
  if [ $? -ne 0 ]; then
    echo "Failed to stop Caddy"
    return 1
  fi
  sudo cp /opt/plane/Caddyfile /etc/caddy/Caddyfile > /tmp/plane_install_temp.log 2>&1
}

function install_nvm(){
  # Capture both stdout and stderr to temp log
  curl -s -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash > /tmp/plane_install_temp.log 2>&1 &
  show_spinner $! "Installing nvm"
  if [ $? -ne 0 ]; then
    return 1
  fi
  . $HOME/.nvm/nvm.sh
  nvm install 20 > /tmp/plane_install_temp.log 2>&1 &
  show_spinner $! "Installing node 20"
  if [ $? -ne 0 ]; then
    return 1
  fi

  . $HOME/.nvm/nvm.sh
  npm install -g yarn > /tmp/plane_install_temp.log 2>&1 &
  show_spinner $! "Installing yarn"
  if [ $? -ne 0 ]; then
    return 1
  fi
  return 0
}

function install_python(){
  # First update apt and install essential packages
  sudo apt-get update -y > /tmp/plane_install_temp.log 2>&1 &
  show_spinner $! "Updating system packages"
  if [ $? -ne 0 ]; then
    return 1
  fi

  # Install core dependencies first
  sudo apt-get install -y software-properties-common python3-apt apt-transport-https ca-certificates > /tmp/plane_install_temp.log 2>&1 &
  show_spinner $! "Installing core dependencies for python"
  if [ $? -ne 0 ]; then
    return 1
  fi

  # Verify python3-apt installation
  if ! dpkg -l | grep -q python3-apt; then
    echo "Failed to install python3-apt. This is required for repository management."
    return 1
  fi

  # Add deadsnakes PPA using add-apt-repository
  sudo add-apt-repository -y ppa:deadsnakes/ppa > /tmp/plane_install_temp.log 2>&1 &
  show_spinner $! "Adding Python repository"
  if [ $? -ne 0 ]; then
    return 1
  fi

  # Update again after adding new repository
  sudo apt-get update > /tmp/plane_install_temp.log 2>&1 &
  show_spinner $! "Updating system packages for deadsnakes PPA"
  if [ $? -ne 0 ]; then
    return 1
  fi

  # Install Python 3.12 and its development packages
  sudo apt-get install -y python3.12 python3.12-venv python3.12-dev python3-pip > /tmp/plane_install_temp.log 2>&1 &
  show_spinner $! "Installing Python 3.12"
  if [ $? -ne 0 ]; then
    return 1
  fi

  # Instead of changing system Python, create a symlink in /usr/local/bin
  sudo ln -sf /usr/bin/python3.12 /usr/local/bin/python3 > /tmp/plane_install_temp.log 2>&1 &
  show_spinner $! "Creating Python symlink"
  if [ $? -ne 0 ]; then
    return 1
  fi

  # Install additional development dependencies
  sudo apt-get install -y build-essential libpq-dev libffi-dev > /tmp/plane_install_temp.log 2>&1 &
  show_spinner $! "Installing development dependencies"
  if [ $? -ne 0 ]; then
    return 1
  fi

  # Verify Python installation
  if ! command -v python3 &> /dev/null; then
    echo "Python installation failed. Python3 command not found."
    return 1
  fi

  # Verify pip installation
  if ! command -v pip3 &> /dev/null; then
    echo "Pip installation failed. pip3 command not found."
    return 1
  fi

  return 0
}

function install_backend_dependencies(){
  local backend_dir=/opt/plane/backend
  python3 -m venv $backend_dir/.venv > /tmp/plane_install_temp.log 2>&1 &
  show_spinner $! "Creating virtual environment"
  if [ $? -ne 0 ]; then
    echo "Failed to create virtual environment"
    exit 1
  fi
  source $backend_dir/.venv/bin/activate
  pip install -r $backend_dir/requirements.txt --compile > /tmp/plane_install_temp.log 2>&1 &
  show_spinner $! "Installing backend dependencies"
  if [ $? -ne 0 ]; then
    echo "Failed to install backend dependencies"
    exit 1
  fi
  deactivate
}

function create_services(){
  for file in /opt/plane/svc/*.service; do
    sudo cp $file /etc/systemd/system/plane-${file##*/}
  done
  # Enable services
  sudo systemctl daemon-reload
  sudo systemctl enable rsyslog
  sudo systemctl enable cloud-init

  sudo systemctl start rsyslog
  sudo systemctl start cloud-init

  sudo mkdir -p /var/log/plane
  for service in ${PLANE_SERVICES[@]}; do
    sudo touch /var/log/plane/${service}.log
  done
  # if current user is ubuntu, then chown the logs to ubuntu
  if [ "$USER" = "ubuntu" ]; then
    sudo chown -R ubuntu:ubuntu /var/log/plane
  fi
  sudo chmod -R 755 /var/log/plane
  sudo chmod 644 /var/log/plane/*.log

}

function install_prerequisites() {
  validate_and_fix_python
  if [ $? -ne 0 ]; then
    echo -e "\n${RED}Python yet to be installed${NC}"
  fi

  install_caddy
  if [ $? -ne 0 ]; then
    echo -e "\n${RED}Installation failed during Caddy setup${NC}"
    exit 1
  fi

  install_nvm
  if [ $? -ne 0 ]; then
    echo -e "\n${RED}Installation failed during Node.js setup${NC}"
    exit 1
  fi

  install_python
  if [ $? -ne 0 ]; then
    echo -e "\n${RED}Installation failed during Python setup${NC}"
    exit 1
  fi

  create_services
  if [ $? -ne 0 ]; then
    echo -e "\n${RED}Installation failed during service creation${NC}"
    exit 1
  fi

  install_backend_dependencies
  if [ $? -ne 0 ]; then
    echo -e "\n${RED}Installation failed during backend dependencies setup${NC}"
    exit 1
  fi

  setup_welcome_message
  if [ $? -ne 0 ]; then
    echo -e "\n${RED}Failed to setup welcome message${NC}"
    # exit 1
  fi

  # Show installed versions
  echo -e "\n${GREEN}Installation completed successfully!${NC}"
  echo -e "\nInstalled versions:"
  source ~/.nvm/nvm.sh
  echo "Node.js: $(node --version)"
  echo "npm: $(npm -v)"
  echo "Yarn: $(yarn --version)"
  echo "Python: $(python3 --version)"
  echo "Caddy: $(caddy version | head -n1)"
}

function start_single_service(){
  service_name=$1
  if [[ ! " ${PLANE_SERVICES[@]} " =~ " ${service_name} " ]]; then
    echo "Invalid service name: $service_name"
    exit 1
  fi

  if [ "$service_name" = "caddy" ]; then
    sudo systemctl enable caddy.service > /dev/null 2>&1
    sudo service caddy start &
    show_spinner $! "Starting Caddy"
  else
    sudo systemctl enable plane-${service_name}.service > /dev/null 2>&1
    sudo service plane-${service_name} start &
    show_spinner $! "Starting ${service_name}"
  fi
  local status=$?
  if [ $status -ne 0 ]; then
    return 1
  fi
  return 0
}

function stop_single_service(){
  service_name=$1
  if [[ ! " ${PLANE_SERVICES[@]} " =~ " ${service_name} " ]]; then
    echo "Invalid service name: $service_name"
    exit 1
  fi

  if [ "$service_name" = "caddy" ]; then
    sudo systemctl disable caddy.service > /dev/null 2>&1
    sudo service caddy stop &
    show_spinner $! "Stopping Caddy"
  else
    sudo systemctl disable plane-${service_name}.service > /dev/null 2>&1
    sudo service plane-${service_name} stop &
    show_spinner $! "Stopping ${service_name}"
  fi
  local status=$?
  if [ $status -ne 0 ]; then
    return 1
  fi
  return 0
}

function start_services(){
  if [ $# -eq 2 ]; then 
    service_name=$2
    start_single_service $service_name
  else
    for service in ${PLANE_SERVICES[@]}; do
      start_single_service $service
    done
  fi
}

function stop_services(){
  if [ $# -eq 2 ]; then
    service_name=$2
    stop_single_service $service_name
  else
    for service in ${PLANE_SERVICES[@]}; do
      stop_single_service $service
    done
  fi
}

function restart_services(){
  stop_services "$@"
  start_services "$@"
}

function service_status(){
  shift
  if [ $# -ge 1 ]; then
    service_name=$1
    if [[ ! " ${PLANE_SERVICES[@]} " =~ " ${service_name} " ]]; then
      echo "Invalid service name: $service_name"
      exit 1
    fi

    if [ "$service_name" = "caddy" ]; then
      sudo systemctl status caddy
    else
      sudo systemctl status plane-${service_name}
    fi
    if [ $? -ne 0 ]; then
      echo "Failed to get status of $service_name"
      exit 1
    fi
  else
    # Show status for all services
    welcome
    echo "Status of all Plane services:"
    echo "┌──────────────┬────────────┐"
    echo "│ Service      │ Status     │"
    echo "├──────────────┴────────────┘"
    
    for service in ${PLANE_SERVICES[@]}; do
      status="inactive"
      if [ "$service" = "caddy" ]; then
        if sudo systemctl is-active caddy >/dev/null 2>&1; then
          status="active"
        fi
      else
        if sudo systemctl is-active plane-${service} >/dev/null 2>&1; then
          status="active"
        fi
      fi
      printf "│ %-12s │ %-10s │\n" "$service" "$status"
    done
    
    echo "└──────────────┴────────────┘"
  fi
}

function service_logs(){
  shift
  if [ $# -ge 1 ]; then
    service_name=$1
    if [[ ! " ${PLANE_SERVICES[@]} " =~ " ${service_name} " ]]; then
      echo "Invalid service name: $service_name"
      exit 1
    fi
  else
    echo "Usage: logs <service_name> [-f|--follow]"
    exit 1
  fi

  log_follow=""
  # if the second argument is -f or --follow, then set log_follow to -f
  if [ $# -eq 2 ] && { [ "$2" = "-f" ] || [ "$2" = "--follow" ]; }; then
    log_follow="-f"
  fi

  if [ "$service_name" = "caddy" ]; then
    sudo journalctl -u caddy $log_follow
  else
    sudo journalctl -u plane-${service_name} $log_follow
  fi
  if [ $? -ne 0 ]; then
    echo "Failed to get logs for $service_name"
    exit 1
  fi
}

function update_env_file(){
  local ENV_FILE=$1
  local KEY=$2
  local VALUE=$3
  local SILENT=$4 # optional, if set to true, no output will be printed

  if [ -z "$SILENT" ]; then
    echo "Updating $ENV_FILE with $KEY=$VALUE"
  fi

  sed -i "s|^$KEY=.*|$KEY=$VALUE|" $ENV_FILE
  if [ $? -ne 0 ]; then
    echo "Failed to update $ENV_FILE with $KEY=$VALUE"
    exit 1
  fi
}

function get_env_var(){
  local ENV_FILE=$1
  local KEY=$2
  local VALUE=$(grep "^$KEY=" $ENV_FILE | cut -d= -f2)
  if [ $? -ne 0 ]; then
    VALUE=""
  fi
  echo $VALUE
}

function ask_for_value(){
  local ENV_FILE=$1
  local KEY=$2
  local CURRENT_VALUE=$(get_env_var $ENV_FILE $KEY)
  read -p "Enter the $KEY [$CURRENT_VALUE]: " value
  if [ -z "$value" ] && [ -z "$CURRENT_VALUE" ]; then
    echo "$KEY is required"
    exit 1
  fi
  if [ -z "$value" ]; then
    value=$CURRENT_VALUE
  fi
  echo $value
}

# Make sure whiptail is installed
function check_whiptail() {
  if ! command -v whiptail &> /dev/null; then
    echo "Installing whiptail..."
    sudo apt-get update && sudo apt-get install -y whiptail
    if [ $? -ne 0 ]; then
      echo "Failed to install whiptail. Falling back to basic configuration."
      return 1
    fi
  fi
  return 0
}

function validate_url() {
  local url=$1
  local regex='^(https?|ftp|file)://[-A-Za-z0-9\+&@#/%?=~_|!:,.;]*[-A-Za-z0-9\+&@#/%=~_|]'
  
  if [[ $url =~ $regex ]]; then
    return 0
  else
    return 1
  fi
}

function configure_backend_wizard() {
  if ! check_whiptail; then
    configure_backend_basic
    return
  fi
  
  # Create a backup of the environment file
  if [ -f "$BACKEND_ENV_FILE" ]; then
    cp "$BACKEND_ENV_FILE" "${BACKEND_ENV_FILE}.bak"
    echo "Created backup at ${BACKEND_ENV_FILE}.bak"
  fi

  # Welcome screen
  whiptail --title "Plane Configuration Wizard" --msgbox "Welcome to the Plane Configuration Wizard!\n\nThis wizard will help you configure your Plane instance." 12 60

  local restart_services=false
  local exit_loop=false
  local current_selection="1"  # Track the current menu selection

  # Initialize variables for storing configuration
  local new_domain=""
  local new_database_url=""
  local new_redis_url=""
  local new_amqp_url=""
  local new_s3_bucket=""
  local new_s3_access_key=""
  local new_s3_secret_key=""
  local new_s3_region=""
  local new_s3_endpoint=""

  while [ "$exit_loop" = false ]; do
    # Configuration sections menu with current selection
    SECTIONS=$(whiptail --title "Configuration Sections" --default-item "$current_selection" --menu "Choose a section to configure:" 17 60 10 \
      "1" "Domain Configuration" \
      "2" "Database Configuration" \
      "3" "Redis Configuration" \
      "4" "RabbitMQ Configuration" \
      "5" "S3 Storage Configuration" \
      "6" "Save and Exit" 3>&1 1>&2 2>&3)
    
    # Handle cancel button/escape key
    if [ $? -ne 0 ]; then
      whiptail --title "Configuration Cancelled" --msgbox "Configuration wizard cancelled. Exiting without saving changes." 8 60
      # Restore from backup if it exists
      if [ -f "${BACKEND_ENV_FILE}.bak" ]; then
        mv "${BACKEND_ENV_FILE}.bak" "$BACKEND_ENV_FILE"
      fi
      return
    fi

    # Store the current selection
    current_selection=$SECTIONS

    case $SECTIONS in
      "1")
        # Basic Settings
        local app_domain=$(get_env_var $BACKEND_ENV_FILE "APP_DOMAIN")
        APP_DOMAIN=""
        while [ -z "$APP_DOMAIN" ]; do
          APP_DOMAIN=$(whiptail --title "Basic Settings" --inputbox "Enter your application domain (required):" 10 60 "$app_domain" 3>&1 1>&2 2>&3)
          if [ $? -ne 0 ]; then
            # User pressed Cancel
            break
          elif [ -z "$APP_DOMAIN" ]; then
            whiptail --title "Error" --msgbox "Application domain cannot be empty. Please enter a valid domain." 8 60
          fi
        done
        
        if [ $? -eq 0 ] && [ -n "$APP_DOMAIN" ]; then
          new_domain=$APP_DOMAIN
          restart_services=true
        fi
        ;;
        
      "2")
        # Database Configuration
        local postgres_url=$(get_env_var $BACKEND_ENV_FILE "DATABASE_URL")
        DATABASE_URL=""
        while [ -z "$DATABASE_URL" ]; do
          DATABASE_URL=$(whiptail --title "Database Configuration" --inputbox "Enter your PostgreSQL connection URL (required):" 10 60 "$postgres_url" 3>&1 1>&2 2>&3)
          if [ $? -ne 0 ]; then
            # User pressed Cancel
            break
          elif [ -z "$DATABASE_URL" ]; then
            whiptail --title "Error" --msgbox "Database URL cannot be empty. Please enter a valid connection URL." 8 60
          fi
        done
        
        if [ $? -eq 0 ] && [ -n "$DATABASE_URL" ]; then
          new_database_url=$DATABASE_URL
          restart_services=true
        fi
        ;;
        
      "3")
        # Redis Configuration
        local redis_url=$(get_env_var $BACKEND_ENV_FILE "REDIS_URL")
        REDIS_URL=""
        while [ -z "$REDIS_URL" ]; do
          REDIS_URL=$(whiptail --title "Redis Configuration" --inputbox "Enter your Redis connection URL (required):" 10 60 "$redis_url" 3>&1 1>&2 2>&3)
          if [ $? -ne 0 ]; then
            # User pressed Cancel
            break
          elif [ -z "$REDIS_URL" ]; then
            whiptail --title "Error" --msgbox "Redis URL cannot be empty. Please enter a valid connection URL." 8 60
          fi
        done
        
        if [ $? -eq 0 ] && [ -n "$REDIS_URL" ]; then
          new_redis_url=$REDIS_URL
          restart_services=true
        fi
        ;;
        
      "4")
        # RabbitMQ Configuration
        local amqp_url=$(get_env_var $BACKEND_ENV_FILE "AMQP_URL")
        AMQP_URL=""
        while [ -z "$AMQP_URL" ]; do
          AMQP_URL=$(whiptail --title "RabbitMQ Configuration" --inputbox "Enter your RabbitMQ connection URL (required):" 10 60 "$amqp_url" 3>&1 1>&2 2>&3)
          if [ $? -ne 0 ]; then
            # User pressed Cancel
            break
          elif [ -z "$AMQP_URL" ]; then
            whiptail --title "Error" --msgbox "RabbitMQ URL cannot be empty. Please enter a valid connection URL." 8 60
          fi
        done
        
        if [ $? -eq 0 ] && [ -n "$AMQP_URL" ]; then
          new_amqp_url=$AMQP_URL
          restart_services=true
        fi
        ;;
        
      "5")
        # S3 Storage Configuration
        local s3_bucket=$(get_env_var $BACKEND_ENV_FILE "AWS_S3_BUCKET_NAME")
        local s3_access_key=$(get_env_var $BACKEND_ENV_FILE "AWS_ACCESS_KEY_ID")
        local s3_secret_key=$(get_env_var $BACKEND_ENV_FILE "AWS_SECRET_ACCESS_KEY")
        local s3_region=$(get_env_var $BACKEND_ENV_FILE "AWS_REGION")
        local s3_endpoint=$(get_env_var $BACKEND_ENV_FILE "AWS_S3_ENDPOINT_URL")

        # Bucket name (required)
        while true; do
          S3_BUCKET=$(whiptail --title "S3 Configuration" --inputbox "Enter your S3 bucket name (required):" 10 60 "$s3_bucket" 3>&1 1>&2 2>&3)
          if [ $? -ne 0 ]; then
            continue 2  # Return to main menu
          fi
          if [ -n "$S3_BUCKET" ]; then
            break  # Valid input, continue to next field
          fi
          whiptail --title "Error" --msgbox "S3 bucket name cannot be empty." 8 60
        done

        # Access key (required)
        while true; do
          S3_ACCESS_KEY=$(whiptail --title "S3 Configuration" --inputbox "Enter your S3 access key (required):" 10 60 "$s3_access_key" 3>&1 1>&2 2>&3)
          if [ $? -ne 0 ]; then
            continue 2  # Return to main menu
          fi
          if [ -n "$S3_ACCESS_KEY" ]; then
            break  # Valid input, continue to next field
          fi
          whiptail --title "Error" --msgbox "S3 access key cannot be empty." 8 60
        done

        # Secret key (required)
        while true; do
          S3_SECRET_KEY=$(whiptail --title "S3 Configuration" --passwordbox "Enter your S3 secret key (required):" 10 60 "$s3_secret_key" 3>&1 1>&2 2>&3)
          if [ $? -ne 0 ]; then
            continue 2  # Return to main menu
          fi
          if [ -n "$S3_SECRET_KEY" ]; then
            break  # Valid input, continue to next field
          fi
          whiptail --title "Error" --msgbox "S3 secret key cannot be empty." 8 60
        done

        # Region (required)
        while true; do
          S3_REGION=$(whiptail --title "S3 Configuration" --inputbox "Enter your S3 region (required):" 10 60 "$s3_region" 3>&1 1>&2 2>&3)
          if [ $? -ne 0 ]; then
            continue 2  # Return to main menu
          fi
          if [ -n "$S3_REGION" ]; then
            break  # Valid input, continue to next field
          fi
          whiptail --title "Error" --msgbox "S3 region cannot be empty." 8 60
        done

        # Endpoint URL (required)
        while true; do
          S3_ENDPOINT=$(whiptail --title "S3 Configuration" --inputbox "Enter your S3 endpoint URL (required):" 10 60 "$s3_endpoint" 3>&1 1>&2 2>&3)
          if [ $? -ne 0 ]; then
            continue 2  # Return to main menu
          fi
          if [ -n "$S3_ENDPOINT" ]; then
            break  # Valid input, continue to next field
          fi
          whiptail --title "Error" --msgbox "S3 endpoint URL cannot be empty." 8 60
        done

        # All values were provided successfully
        new_s3_bucket=$S3_BUCKET
        new_s3_access_key=$S3_ACCESS_KEY
        new_s3_secret_key=$S3_SECRET_KEY
        new_s3_region=$S3_REGION
        new_s3_endpoint=$S3_ENDPOINT
        restart_services=true
        ;;
        
      "6" | "")
        # Save and Exit
        if [ -n "$new_domain" ]; then
          update_env_file $BACKEND_ENV_FILE "APP_DOMAIN" "$new_domain" true
        fi
        if [ -n "$new_database_url" ]; then
          update_env_file $BACKEND_ENV_FILE "DATABASE_URL" "$new_database_url" true
        fi
        if [ -n "$new_redis_url" ]; then
          update_env_file $BACKEND_ENV_FILE "REDIS_URL" "$new_redis_url" true
        fi
        if [ -n "$new_amqp_url" ]; then
          update_env_file $BACKEND_ENV_FILE "AMQP_URL" "$new_amqp_url" true
        fi
        if [ -n "$new_s3_bucket" ]; then
          update_env_file $BACKEND_ENV_FILE "AWS_S3_BUCKET_NAME" "$new_s3_bucket" true
        fi
        if [ -n "$new_s3_access_key" ]; then
          update_env_file $BACKEND_ENV_FILE "AWS_ACCESS_KEY_ID" "$new_s3_access_key" true
        fi
        if [ -n "$new_s3_secret_key" ]; then
          update_env_file $BACKEND_ENV_FILE "AWS_SECRET_ACCESS_KEY" "$new_s3_secret_key" true
        fi
        if [ -n "$new_s3_region" ]; then
          update_env_file $BACKEND_ENV_FILE "AWS_REGION" "$new_s3_region" true
        fi
        if [ -n "$new_s3_endpoint" ]; then
          update_env_file $BACKEND_ENV_FILE "AWS_S3_ENDPOINT_URL" "$new_s3_endpoint" true
        fi
        exit_loop=true
        ;;
    esac
   
  done

  # Summary screen
  if [ "$restart_services" = true ]; then
    if whiptail --title "Configuration Complete" --yesno "Configuration saved successfully!\n\nDo you want to restart services now?" 10 60; then
      restart_services
    else
      whiptail --title "Configuration Complete" --msgbox "Configuration saved. Remember to restart services manually with:\n\nplane restart" 10 60
    fi
  else
    whiptail --title "Configuration Complete" --msgbox "No changes were made to the configuration." 10 60
  fi
}

# Rename your original function to be the fallback
function configure_backend_basic() {
  # Original configure_backend code
  # ask for app_domain
  local app_domain=$(ask_for_value $BACKEND_ENV_FILE "APP_DOMAIN")

  # ask for redis_url
  local redis_url=$(ask_for_value $BACKEND_ENV_FILE "REDIS_URL")

  # ask for postgres_url
  local postgres_url=$(ask_for_value $BACKEND_ENV_FILE "DATABASE_URL")

  # ask for rabbitmq
  local amqp_url=$(ask_for_value $BACKEND_ENV_FILE "AMQP_URL")

  # ask for s3 setting
  local s3_bucket=$(ask_for_value $BACKEND_ENV_FILE "AWS_S3_BUCKET_NAME")
  local s3_access_key=$(ask_for_value $BACKEND_ENV_FILE "AWS_ACCESS_KEY_ID")
  local s3_secret_key=$(ask_for_value $BACKEND_ENV_FILE "AWS_SECRET_ACCESS_KEY")
  local s3_region=$(ask_for_value $BACKEND_ENV_FILE "AWS_REGION")
  local s3_endpoint=$(ask_for_value $BACKEND_ENV_FILE "AWS_S3_ENDPOINT_URL")

  local restart_services=false

  if [ -n "$redis_url" ]; then
    update_env_file $BACKEND_ENV_FILE "REDIS_URL" $redis_url
    restart_services=true
  fi

  if [ -n "$postgres_url" ]; then
    update_env_file $BACKEND_ENV_FILE "DATABASE_URL" $postgres_url
    restart_services=true
  fi

  if [ -n "$amqp_url" ]; then
    update_env_file $BACKEND_ENV_FILE "AMQP_URL" $amqp_url
    restart_services=true
  fi

  if [ -n "$s3_bucket" ] && [ -n "$s3_access_key" ] && [ -n "$s3_secret_key" ] && [ -n "$s3_region" ] && [ -n "$s3_endpoint" ]; then
    update_env_file $BACKEND_ENV_FILE "AWS_S3_BUCKET_NAME" $s3_bucket
    update_env_file $BACKEND_ENV_FILE "AWS_ACCESS_KEY_ID" $s3_access_key
    update_env_file $BACKEND_ENV_FILE "AWS_SECRET_ACCESS_KEY" $s3_secret_key
    update_env_file $BACKEND_ENV_FILE "AWS_REGION" $s3_region
    update_env_file $BACKEND_ENV_FILE "AWS_S3_ENDPOINT_URL" $s3_endpoint
    restart_services=true
  fi

  if [ "$restart_services" = true ]; then
    restart_services
  fi
}

# Replace your original configure_backend function with this
function configure_backend(){
  configure_backend_wizard
}

function upgrade_services(){
  echo ""
  echo ""
  echo "This command will be available in the upcoming release."
  echo ""
  echo ""
}

function main(){
  welcome

  action=$1

  if [ -z "$action" ]; then
    echo "Usage: $0 command [options]"
    echo "Commands:"
    echo "    $0 configure                      # configure backend"
    echo "    $0 start                          # start all services"
    echo "    $0 start <service>                # start specific service"
    echo "    $0 stop                           # stop all services"
    echo "    $0 stop <service>                 # stop specific service"
    echo "    $0 restart                        # restart all services"
    echo "    $0 restart <service>              # restart specific service"
    echo "    $0 status                         # get status of all services"
    echo "    $0 status <service>               # get status of specific service"
    echo "    $0 logs <service>                 # get logs of specific service"
    echo "    $0 upgrade                        # upgrade services"
    echo ""
    echo "Available services:"
    echo "    admin, web, space, live, api, worker, beat-worker, caddy"
    exit 1
  fi

  case $action in
    "start")
      echo "Starting services"
      start_services "$@"
      if [ $? -ne 0 ]; then
        echo "Failed to start services"
        exit 1
      fi
      ;;
    "stop")
      echo "Stopping services"
      stop_services "$@"
      if [ $? -ne 0 ]; then
        echo "Failed to stop services"
        exit 1
      fi
      ;;
    "restart")
      echo "Restarting services"
      restart_services "$@"
      if [ $? -ne 0 ]; then
        echo "Failed to restart services"
        exit 1
      fi
      ;;
    "configure")
      echo "Configuring backend"
      configure_backend
      if [ $? -ne 0 ]; then
        echo "Failed to configure backend"
        exit 1
      fi
      ;;
    "upgrade")
      upgrade_services
      if [ $? -ne 0 ]; then
        echo "Failed to upgrade services"
        exit 1
      fi
      ;;
    "status")
      service_status "$@"
      if [ $? -ne 0 ]; then
        exit 1
      fi
      ;;
    "logs")
      service_logs "$@"
      if [ $? -ne 0 ]; then
        exit 1
      fi
      ;;
  esac
}

# Only run main if not being sourced
if ! (return 0 2>/dev/null); then
  main "$@"
fi
