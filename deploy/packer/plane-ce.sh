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

  echo "Updating $ENV_FILE with $KEY=$VALUE"
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

function configure_backend(){
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
