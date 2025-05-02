#! /bin/bash

DEBIAN_FRONTEND=noninteractive

function welcome() {
  echo "Welcome to the Plane CE setup script"
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
}

function install_caddy(){
  sudo apt-get install -y debian-keyring debian-archive-keyring apt-transport-https curl
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | sudo gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg
  curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | sudo tee /etc/apt/sources.list.d/caddy-stable.list
  sudo apt-get update
  sudo apt-get install caddy
}

function create_services(){
  sudo cp /opt/plane/svc/*.service /etc/systemd/system/
  sudo systemctl enable rsyslog
  sudo systemctl enable cloud-init
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

}

install_prerequisites
if [ $? -ne 0 ]; then
  echo "Failed to install prerequisites"
  exit 1
fi

