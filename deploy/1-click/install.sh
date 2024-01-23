#!/bin/bash

function install_docker {
    if ! [ -x "$(command -v docker)" ]; then
        echo "Docker is not installed. Please install docker first."

        # Install docker
        sudo curl -o- https://get.docker.com | bash -

        # check the user is root 
        if [ "$EUID" -ne 0 ]; then
            dockerd-rootless-setuptool.sh install
        fi
    fi
}
