#!/bin/bash

# Setup a new machine that imports our tarball Docker images
set -e

MIN_DOCKER_VERSION=24
# set the default directory as $HOME/plane
DEFAULT_SETUP_DIR="$HOME/planeairgapped"
DEFAULT_APP_DOMAIN="127.0.0.1"
SETUP_DIR=$DEFAULT_SETUP_DIR

sed_handler(){
  if [[ "$OSTYPE" == "darwin"* ]]; then
    sed -i '' "$1" "$2"
  else
    sed -i "$1" "$2"
  fi
}

update_env(){
  file=$1
  key=$2
  value=$3
  sed_handler 's|^'$key'=.*|'$key'='$value'|' $file
}

# check docker version 24+
docker_version=$(docker version --format '{{.Server.Version}}')
if [ $? -ne 0 ]; then
  echo "Failed to check docker version"
  exit 1
fi
if [[ $docker_version < $MIN_DOCKER_VERSION ]]; then
  echo "Docker version must be $MIN_DOCKER_VERSION or higher"
  exit 1
fi

# Ensure Docker is installed and running
if ! docker info > /dev/null 2>&1; then
  echo "Docker is not running"
fi


# check docker-compose or `docker compose` is installed
COMPOSE_CMD="docker-compose"
if docker-compose version > /dev/null 2>&1; then
  COMPOSE_CMD="docker-compose"
elif docker compose version > /dev/null 2>&1; then
  COMPOSE_CMD="docker compose"
else
  echo "docker-compose or docker compose is not installed"
  exit 1
fi

# check docker-compose version
docker_compose_version=$($COMPOSE_CMD version)
if [ $? -ne 0 ]; then
  echo "Failed to check docker-compose version"
  exit 1
fi

echo "**********************************************************"
echo "You are about to install/upgrade Plane as airgapped setup"
echo ""
echo "Pre-requisites:"
echo "  - Docker installed and running"
echo "  - Docker version 24 or higher"
echo "  - docker-compose or docker compose installed"
echo "  - A tarball of all the images"
echo "  - A docker-compose.yml file (docker-compose.yml)"
echo "  - A plane.env file (plane.env)"
echo "**********************************************************"

INSTALLATION_TYPE="New"

echo ""
read -p "Enter the directory to install Plane (default: $DEFAULT_SETUP_DIR):" SETUP_DIR

if [ -z "$SETUP_DIR" ]; then
  SETUP_DIR=$DEFAULT_SETUP_DIR
fi

# if SETUP_DIR exists and not empty
if [ -d "$SETUP_DIR" ] && [ -n "$(ls -A $SETUP_DIR)" ]; then
  echo ""
  echo "Current installation is found in $SETUP_DIR and it is not empty"
  echo ""
  read -p "Are you sure you want to proceed with UPGRADE the current installation? (y/n):" confirm
  if [ "$confirm" != "y" ]; then
    echo "Installation cancelled"
    exit 1
  fi

  # check `docker compose ls` for `plane-airgapped` and if it is running, exit
  if $COMPOSE_CMD ls | grep "plane-airgapped" | grep "running" > /dev/null; then
    echo "Currently installed instance is running. Please stop the instance before upgrading"
    exit 1
  fi

  INSTALLATION_TYPE="Upgrade"
  # backup current plane.env
  # check if plane.env exists
  if [ -f "$SETUP_DIR/plane.env" ]; then
    cp $SETUP_DIR/plane.env $SETUP_DIR/plane.env.backup || true
    # read DOMAIN_NAME from plane.env
    APP_DOMAIN=$(grep "^DOMAIN_NAME=" $SETUP_DIR/plane.env | cut -d '=' -f 2)
  else
    echo "plane.env not found in $SETUP_DIR. It will be created during the upgrade"
    INSTALLATION_TYPE="New"
  fi
fi

if [[ "$INSTALLATION_TYPE" == "New" ]]; then
  # ask for domain or ip address for new
  echo ""
  read -p "Enter the domain or ip address to access Plane (default: $DEFAULT_APP_DOMAIN):" APP_DOMAIN
  if [ -z "$APP_DOMAIN" ]; then
    APP_DOMAIN=$DEFAULT_APP_DOMAIN
  fi
fi

# Display the final configuration
echo ""
echo "**********************************************************"
echo "Verify the final configuration:"
echo "  - Setup Directory: $SETUP_DIR"
echo "  - App Domain: $APP_DOMAIN"
echo "  - Installation Type: $INSTALLATION_TYPE"
echo "**********************************************************"
# ask for confirmation before proceeding
echo ""
read -p "Confirm to proceed with setup? (y/n):" confirm
if [ "$confirm" != "y" ]; then
  echo "Installation cancelled"
  exit 1
fi

mkdir -p $SETUP_DIR
# if error creating directory, exit
if [ $? -ne 0 ]; then
  echo "Failed to create $SETUP_DIR"
  exit 1
fi

# move docker-compose.yml, plane.env
cp $(dirname $0)/docker-compose.yml $SETUP_DIR/docker-compose.yml
if [ $? -ne 0 ]; then
  echo "Failed to move docker-compose.yml"
  exit 1
fi

cp $(dirname $0)/plane.env $SETUP_DIR/plane.env
if [ $? -ne 0 ]; then
  echo "Failed to move plane.env"
  exit 1
fi

# create data, logs directories
mkdir -p $SETUP_DIR/data
mkdir -p $SETUP_DIR/logs


# update plane.env for MACHINE_SIGNATURE with uuid
MACHINE_SIGNATURE=$(uuidgen)

# consider it as fresh install if the plane.env.backup does not exist

if [[ "$INSTALLATION_TYPE" == "Upgrade" ]] && [[ -f "$SETUP_DIR/plane.env.backup" ]]; then
  # read the backup and update all the plane.env.bak key values from backup to plane.env
  # loop through all the keys in plane.env.bak and update the plane.env
  while IFS='=' read -r line; do
    # trim spaces
    line=$(echo "$line" | xargs)

    # if line starts with # or empty, skip
    if [[ "$line" == "#"* ]] || [[ -z "$line" ]]; then
      continue
    fi

    # if line contains =, then update the env
    if [[ "$line" == *"="* ]]; then
        key=$(echo "$line" | cut -d '=' -f 1)
        value=$(echo "$line" | cut -d '=' -f 2)
    else
        key="$line"
        value=""
    fi

    if [[ "$key" == "APP_RELEASE_VERSION" ]]; then
      continue
    fi

    # echo "$key=$value"
    update_env "$SETUP_DIR/plane.env" "$key" "$value"
  done < "$SETUP_DIR/plane.env.backup"
elif [[ ! -f "$SETUP_DIR/plane.env.backup" ]]; then 
  sed_handler 's/^MACHINE_SIGNATURE=.*/MACHINE_SIGNATURE='$MACHINE_SIGNATURE'/' $SETUP_DIR/plane.env
  sed_handler 's/^DOMAIN_NAME=.*/DOMAIN_NAME='$APP_DOMAIN'/' $SETUP_DIR/plane.env
  sed_handler 's/^SITE_ADDRESS=.*/SITE_ADDRESS=:80/' $SETUP_DIR/plane.env
  sed_handler 's/^WEB_URL=.*/WEB_URL=http:\/\/'$APP_DOMAIN'/' $SETUP_DIR/plane.env
  sed_handler 's/^CORS_ALLOWED_ORIGINS=.*/CORS_ALLOWED_ORIGINS=http:\/\/'$APP_DOMAIN'/' $SETUP_DIR/plane.env
  sed_handler 's|^INSTALL_DIR=.*|INSTALL_DIR='$SETUP_DIR'|' $SETUP_DIR/plane.env
else
  echo "Invalid installation type"
  exit 1
fi

# Load the images into Docker
echo "Loading images into Docker"

# find all the images in the tarball
tarfiles=$(find . -name "*.tar")
# loop through all the images in the tarball and load them into Docker
for tarfile in $tarfiles; do
  echo "Loading $tarfile"
  docker load -i $tarfile
  if [ $? -ne 0 ]; then
    echo "Failed to load $tarfile"
    exit 1
  fi
done

echo "Images loaded successfully"

echo ""
echo "**********************************************************"
echo "Plane Setup is ready to configure and start"
echo ""
echo "Use below commands to configure and start Plane"
echo ""
echo "Switch to the setup directory"
echo -e "    \033[94mcd $SETUP_DIR\033[0m"
echo ""
echo "Start the services"
echo -e "    \033[94m$COMPOSE_CMD -f docker-compose.yml --env-file plane.env up -d\033[0m" 
echo ""
echo "Check logs of migrator service and wait for it to finish using below command"
echo -e "    \033[94m$COMPOSE_CMD logs -f migrator\033[0m"
echo ""
echo "Check logs of api service and wait for it to start using below command"
echo -e "    \033[94m$COMPOSE_CMD logs -f api\033[0m"
echo ""
echo "Once the api service is started, you can access Plane at http://$APP_DOMAIN"
echo ""
echo "**********************************************************"

echo "Installation completed successfully"
echo ""
echo -e "You can access Plane at \033[94mhttp://$APP_DOMAIN\033[0m"
echo ""
