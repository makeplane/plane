#! /bin/bash

function welcome() {
  echo "Welcome to the Plane CE setup script"
}

function install_nvm(){
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
  . $HOME/.nvm/nvm.sh
  nvm install 20
  corepack enable yarn
  yarn --version
  node --version
}

function install_python(){
  sudo apt-get update
  sudo apt-get install -y software-properties-common cloud-init rsyslog debian-keyring debian-archive-keyring apt-transport-https curl
  sudo add-apt-repository -y ppa:deadsnakes/ppa
  sudo apt-get update
  sudo apt-get install -y python3.12 python3.12-venv python3.12-dev python3-pip
  sudo update-alternatives --install /usr/bin/python3 python3 /usr/bin/python3.12 1
  python3 --version
}

function install_caddy(){
}

function install_dependencies() {
  echo "Installing dependencies"
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
}

