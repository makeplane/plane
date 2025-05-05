#! /bin/bash

DEBIAN_FRONTEND=noninteractive
BACKEND_ENV_FILE=/opt/plane/backend/backend.env

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

function install_nvm(){
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
  . $HOME/.nvm/nvm.sh
  nvm install 20
  npm install -g yarn
}

function install_python(){
  sudo apt-get update
  sudo apt-get install -y software-properties-common cloud-init rsyslog debian-keyring debian-archive-keyring apt-transport-https curl
  sudo add-apt-repository -y ppa:deadsnakes/ppa
  sudo apt-get update
  sudo apt-get install -y python3.12 python3.12-venv python3.12-dev python3-pip
  sudo update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.12 1
  sudo apt-get install -y libpq-dev libffi-dev

}

function install_caddy(){
  sudo apt-get install -y debian-keyring debian-archive-keyring apt-transport-https curl
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
  sudo apt-get update
  sudo apt-get install caddy
  sudo service caddy stop
  sudo cp /opt/plane/Caddyfile /etc/caddy/Caddyfile
}

function install_backend_dependencies(){
  local backend_dir=/opt/plane/backend
  python3 -m venv $backend_dir/.venv
  source $backend_dir/.venv/bin/activate
  pip install -r $backend_dir/requirements.txt --compile
  deactivate
}

function create_services(){
  sudo cp /opt/plane/svc/*.service /etc/systemd/system/
  sudo systemctl daemon-reload
  sudo systemctl enable rsyslog
  sudo systemctl enable cloud-init

  sudo systemctl start rsyslog
  sudo systemctl start cloud-init

  sudo mkdir -p /var/log/plane
  sudo chown -R ubuntu:ubuntu /var/log/plane
  sudo chmod 755 /var/log/plane

  sudo systemctl enable admin.service
  sudo systemctl enable web.service
  sudo systemctl enable space.service
  sudo systemctl enable live.service
  sudo systemctl enable api.service
  sudo systemctl enable worker.service
  sudo systemctl enable beat-worker.service

}

function install_prerequisites() {
  echo "Installing prerequisites"
  install_nvm
  if [ $? -ne 0 ]; then
    echo "Failed to install nvm"
    exit 1
  fi

  install_python
  if [ $? -ne 0 ]; then
    echo "Failed to install python"
    exit 1
  fi

  install_caddy
  if [ $? -ne 0 ]; then
    echo "Failed to install caddy"
    exit 1
  fi

  source ~/.nvm/nvm.sh
  node --version
  npm -v
  yarn --version
  python3 --version
  caddy version

  create_services
  if [ $? -ne 0 ]; then
    echo "Failed to create services"
    exit 1
  fi

  install_backend_dependencies
  if [ $? -ne 0 ]; then
    echo "Failed to install backend dependencies"
    exit 1
  fi

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
  local final_message=${message/Starting/Started}
  final_message=${final_message/Stopping/Stopped}

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
  fi
}

function start_single_service(){
  local services=(admin web space live api worker beat-worker caddy)
  service_name=$1
  if [[ ! " ${services[@]} " =~ " ${service_name} " ]]; then
    echo "Invalid service name: $service_name"
    exit 1
  fi

  sudo service $service_name start &
  show_spinner $! "Starting $service_name"
  local status=$?
  if [ $status -ne 0 ]; then
    return 1
  fi
  return 0
}

function stop_single_service(){
  local services=(admin web space live api worker beat-worker caddy)
  service_name=$1
  if [[ ! " ${services[@]} " =~ " ${service_name} " ]]; then
    echo "Invalid service name: $service_name"
    exit 1
  fi

  sudo service $service_name stop &
  show_spinner $! "Stopping $service_name"
  local status=$?
  if [ $status -ne 0 ]; then
    return 1
  fi
  return 0
}

function start_services(){
  local services=(admin web space live api worker beat-worker caddy)

  if [ $# -eq 2 ]; then 
    service_name=$2
    start_single_service $service_name
  else
    for service in ${services[@]}; do
      start_single_service $service
    done
  fi
}

function stop_services(){
  local services=(admin web space live api worker beat-worker caddy)

  if [ $# -eq 2 ]; then
    service_name=$2
    stop_single_service $service_name
  else
    for service in ${services[@]}; do
      stop_single_service $service
    done
  fi
}

function restart_services(){
  stop_services "$@"
  create_services
  start_services "$@"
}

function service_status(){
  if [ $# -ne 1 ]; then
    echo "Usage: status <service_name>"
    exit 1
  fi

  sudo systemctl status $1
  if [ $? -ne 0 ]; then
    echo "Failed to get status of $1"
    exit 1
  fi
}

function service_logs(){
  if [ $# -ne 1 ]; then
    echo "Usage: logs <service_name>"
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


function main(){
  welcome

  action=$1

  if [ -z "$action" ]; then
    echo "Usage: $0 command [options]"
    echo "Commands:"
    echo "    $0 install                        # installs the prerequisites"
    echo "    $0 configure                      # configure backend"
    echo "    $0 start                          # start all services"
    echo "    $0 start <service>                # start specific service"
    echo "    $0 stop                           # stop all services"
    echo "    $0 stop <service>                 # stop specific service"
    echo "    $0 restart                        # restart all services"
    echo "    $0 restart <service>              # restart specific service"
    echo "    $0 status <service>               # get status of specific service"
    echo "    $0 logs <service>                 # get logs of specific service"
    echo ""
    echo "Available services:"
    echo "    admin, web, space, live, api, worker, beat-worker, caddy"
    exit 1
  fi

  case $action in
    "install")
      echo "Installing prerequisites"
      install_prerequisites
      if [ $? -ne 0 ]; then
        echo "Failed to install prerequisites"
        exit 1
      fi
      ;;
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
    "status")
      echo "Getting status of $2"
      service_status $2
      if [ $? -ne 0 ]; then
        echo "Failed to get status of $2"
        exit 1
      fi
      ;;
    "logs")
      echo "Getting logs of $2"
      service_logs $2
      if [ $? -ne 0 ]; then
        echo "Failed to get logs of $2"
        exit 1
      fi
      ;;
  esac
}

main "$@"
