#!/bin/bash

function printPlane {
    
}

function uninstall_docker {
    if ! [ -x "$(command -v docker)" ]; then
        echo "Docker is not installed."
    else
        sudo apt-get purge -y docker-engine docker docker.io docker-ce docker-ce-cli docker-compose-plugin
        sudo apt-get autoremove -y --purge docker-engine docker docker.io docker-ce docker-compose-plugin
    fi
}

# Check if docker is installed


