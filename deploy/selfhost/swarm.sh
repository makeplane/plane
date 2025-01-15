#!/bin/bash

BRANCH=preview
SERVICE_FOLDER=plane-app
PLANE_INSTALL_DIR=$PWD/$SERVICE_FOLDER
export APP_RELEASE="stable"
export DOCKERHUB_USER=makeplane

export GH_REPO=makeplane/plane
export RELEASE_DOWNLOAD_URL="https://github.com/$GH_REPO/releases/download"
export FALLBACK_DOWNLOAD_URL="https://raw.githubusercontent.com/$GH_REPO/$BRANCH/deploy/selfhost"

OS_NAME=$(uname)

# Create necessary directories
mkdir -p $PLANE_INSTALL_DIR/archive

DOCKER_FILE_PATH=$PLANE_INSTALL_DIR/swarm-compose.yml
DOCKER_ENV_PATH=$PLANE_INSTALL_DIR/plane.env

function print_header() {
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
Project management tool from the future
--------------------------------------------
EOF
}

function checkLatestRelease(){
    echo "Checking for the latest release..." >&2
    local latest_release=$(curl -s https://api.github.com/repos/$GH_REPO/releases/latest |  grep -o '"tag_name": "[^"]*"' | sed 's/"tag_name": "//;s/"//g')
    if [ -z "$latest_release" ]; then
        echo "Failed to check for the latest release. Exiting..." >&2
        exit 1
    fi

    echo $latest_release    
}


# Function to read stack name from env file
function readStackName() {
    if [ -f "$DOCKER_ENV_PATH" ]; then
        local saved_stack_name=$(grep "^STACK_NAME=" "$DOCKER_ENV_PATH" | cut -d'=' -f2)
        if [ -n "$saved_stack_name" ]; then
            stack_name=$saved_stack_name
            return 1
        fi
    fi
    return 0
}

# Function to get stack name (either from env or user input)
function getStackName() {
    read -p "Enter stack name [plane]: " input_stack_name
    if [ -z "$input_stack_name" ]; then
        input_stack_name="plane"
    fi
    stack_name=$input_stack_name
    updateEnvFile "STACK_NAME" "$stack_name" "$DOCKER_ENV_PATH"
    echo "Using stack name: $stack_name"
}

function syncEnvFile(){
    echo "Syncing environment variables..." >&2
    if [ -f "$PLANE_INSTALL_DIR/plane.env.bak" ]; then        
        # READ keys of plane.env and update the values from plane.env.bak
        while IFS= read -r line
        do
            # ignore if the line is empty or starts with #
            if [ -z "$line" ] || [[ $line == \#* ]]; then
                continue
            fi
            key=$(echo "$line" | cut -d'=' -f1)
            value=$(getEnvValue "$key" "$PLANE_INSTALL_DIR/plane.env.bak")
            if [ -n "$value" ]; then
                updateEnvFile "$key" "$value" "$DOCKER_ENV_PATH"
            fi
        done < "$DOCKER_ENV_PATH"

        value=$(getEnvValue "STACK_NAME" "$PLANE_INSTALL_DIR/plane.env.bak")
        if [ -n "$value" ]; then
            updateEnvFile "STACK_NAME" "$value" "$DOCKER_ENV_PATH"
        fi
    fi
    echo "Environment variables synced successfully" >&2
    rm -f $PLANE_INSTALL_DIR/plane.env.bak
}

function getEnvValue() {
    local key=$1
    local file=$2

    if [ -z "$key" ] || [ -z "$file" ]; then
        echo "Invalid arguments supplied"
        exit 1
    fi

    if [ -f "$file" ]; then
        grep -q "^$key=" "$file"
        if [ $? -eq 0 ]; then
            local value
            value=$(grep "^$key=" "$file" | cut -d'=' -f2)
            echo "$value"
        else
            echo ""
        fi
    fi
}

function updateEnvFile() {
    local key=$1
    local value=$2
    local file=$3

    if [ -z "$key" ] || [ -z "$value" ] || [ -z "$file" ]; then
        echo "Invalid arguments supplied"
        exit 1
    fi

    if [ -f "$file" ]; then
        # check if key exists in the file
        grep -q "^$key=" "$file"
        if [ $? -ne 0 ]; then
            echo "$key=$value" >> "$file"
            return
        else 
            if [ "$OS_NAME" == "Darwin" ]; then
                value=$(echo "$value" | sed 's/|/\\|/g')
                sed -i '' "s|^$key=.*|$key=$value|g" "$file"
            else
                sed -i "s/^$key=.*/$key=$value/g" "$file"
            fi
        fi
    else
        echo "File not found: $file"
        exit 1
    fi
}

function download() {

    if [ ! -f "$DOCKER_FILE_PATH" ]; then
        echo "Downloading configuration files..."
        curl -L https://raw.githubusercontent.com/${GH_REPO}/refs/heads/${BRANCH}/deploy/selfhost/docker-compose.yml -o $DOCKER_FILE_PATH
        curl -L https://raw.githubusercontent.com/${GH_REPO}/refs/heads/${BRANCH}/deploy/selfhost/variables.env -o $DOCKER_ENV_PATH
        echo "Configuration files downloaded successfully"
        echo ""
        # Get stack name before updating variables
        getStackName
    else
        readStackName
    fi
}


function deployStack() {   
    # Check if docker compose file and env file exist
    if [ ! -f "$DOCKER_FILE_PATH" ] || [ ! -f "$DOCKER_ENV_PATH" ]; then
        echo "Configuration files not found"
        echo "Downloading it now......"
        download
    fi
    if [ -z "$stack_name" ]; then
        getStackName
    fi
    echo "Starting ${stack_name} stack..."

    # Pull envs 
    set -o allexport; source $DOCKER_ENV_PATH; set +o allexport;

    # Deploy the stack
    docker stack deploy -c $DOCKER_FILE_PATH $stack_name

    echo "Waiting for services to be deployed..."
    sleep 10

    # Check migrator service
    local migrator_service=$(docker service ls --filter name=${stack_name}_migrator -q)
    if [ -n "$migrator_service" ]; then
        echo ">> Waiting for Data Migration to finish"
        while docker service ls --filter name=${stack_name}_migrator | grep -q "running"; do
            echo -n "."
            sleep 1
        done
        echo ""
        
        # Get the most recent container for the migrator service
        local migrator_container=$(docker ps -a --filter name=${stack_name}_migrator --latest -q)
        
        if [ -n "$migrator_container" ]; then
            # Get the exit code of the container
            local exit_code=$(docker inspect --format='{{.State.ExitCode}}' $migrator_container)
            
            if [ "$exit_code" != "0" ]; then
                echo "Server failed to start ❌"
                echo "Migration failed with exit code: $exit_code"
                echo "Please check the logs for the 'migrator' service and resolve the issue(s)."
                echo "Stop the services by running the command: ./swarm.sh stop"
                exit 1
            else
                echo "   Data Migration completed successfully ✅"
            fi
        else
            echo "Warning: Could not find migrator container to check exit status"
        fi
    fi

    # Check API service
    local api_service=$(docker service ls --filter name=${stack_name}_api -q)
    while docker service ls --filter name=${stack_name}_api | grep -q "running"; do
        local running_container=$(docker ps --filter "name=${stack_name}_api" --filter "status=running" -q)
        if [ -n "$running_container" ]; then
            if docker container logs $running_container 2>/dev/null | grep -q "Application Startup Complete"; then
                break
            fi
        fi
        sleep 2
    done

    if [ -z "$api_service" ]; then
        echo "Plane Server failed to start ❌"
        echo "Please check the logs for the 'api' service and resolve the issue(s)."
        echo "Stop the services by running the command: ./swarm.sh stop"
        exit 1
    fi
    echo "   Plane Server started successfully ✅"
    echo ""
    echo "   You can access the application at $WEB_URL"
    echo ""
}

# Update other functions to use $stack_name
function removeStack() {
    if [ -z "$stack_name" ]; then
        echo "Stack name not found"
        exit 1
    fi
    echo "Removing ${stack_name} stack..."
    docker stack rm "$stack_name"
    echo "Waiting for services to be removed..."
    while docker stack ls | grep -q "$stack_name"; do
        sleep 1
    done
    echo "Services stopped successfully ✅"
}

function viewSpecificLogs() {
    local service=$1
    
    # Input validation
    if [ -z "$service" ]; then
        echo "Error: Please specify a service name"
        return 1
    fi

    # Main loop for service logs
    while true; do
        # Get all running containers for the service
        local running_containers=$(docker ps --filter "name=${stack_name}_${service}" --filter "status=running" -q)

        # If no running containers found, try service logs
        if [ -z "$running_containers" ]; then
            echo "No running containers found for ${stack_name}_${service}, checking service logs..."
            if docker service inspect ${stack_name}_${service} >/dev/null 2>&1; then
                echo "Press Ctrl+C or 'q' to exit logs"
                docker service logs ${stack_name}_${service} -f
                break
            else
                echo "Error: No running containers or services found for ${stack_name}_${service}"
                return 1
            fi
            return
        fi

        # If multiple containers are running, let user choose
        if [ $(echo "$running_containers" | grep -v '^$' | wc -l) -gt 1 ]; then
            clear
            echo "Multiple containers found for ${stack_name}_${service}:"
            local i=1
            # Use regular arrays instead of associative arrays
            container_ids=()
            container_names=()
            
            while read -r container_id; do
                if [ -n "$container_id" ]; then
                    local container_name=$(docker inspect --format '{{.Name}}' "$container_id" | sed 's/\///')
                    container_ids[$i]=$container_id
                    container_names[$i]=$container_name
                    echo "[$i] ${container_names[$i]} (${container_ids[$i]})"
                    i=$((i+1))
                fi
            done <<< "$running_containers"
            
            echo -e "\nPlease select a container number:"
            read -r selection

            if [[ "$selection" =~ ^[0-9]+$ ]] && [ -n "${container_ids[$selection]}" ]; then
                local selected_container=${container_ids[$selection]}
                clear
                echo "Showing logs for container: ${container_names[$selection]}"
                echo "Press Ctrl+C or 'q' to return to container selection"
                
                # Start watching logs in the background
                docker container logs -f "$selected_container" &
                local log_pid=$!
                
                while true; do
                    read -r -n 1 input
                    if [[ $input == "q" ]]; then
                        kill $log_pid 2>/dev/null
                        wait $log_pid 2>/dev/null
                        break
                    fi
                done
                clear
            else
                echo "Error: Invalid selection"
                sleep 2
            fi
        else
            # Single container case
            local container_name=$(docker inspect --format '{{.Name}}' "$running_containers" | sed 's/\///')
            echo "Showing logs for container: $container_name"
            echo "Press Ctrl+C or 'q' to exit logs"
            docker container logs -f "$running_containers" &
            local log_pid=$!
            
            while true; do
                read -r -n 1 input
                if [[ $input == "q" ]]; then
                    kill $log_pid 2>/dev/null
                    wait $log_pid 2>/dev/null
                    break
                fi
            done
            break
        fi
    done
}

function viewLogs() {
    if [ -z "$stack_name" ]; then
        echo "Stack name not found"
        exit 1
    fi
    echo "Select a service to view logs:"
    echo "   1) API"
    echo "   2) Worker"
    echo "   3) Beat"
    echo "   4) Web"
    echo "   5) Proxy"
    echo "   6) Space"
    echo "   7) Back to Menu"
    echo 
    read -p "Service [1]: " SERVICE

    until [[ -z "$SERVICE" || "$SERVICE" =~ ^[1-7]$ ]]; do
        echo "$SERVICE: invalid selection."
        read -p "Service [1]: " SERVICE
    done
    
    if [ -z "$SERVICE" ]; then
        SERVICE=1
    fi

    if [ "$SERVICE" == "1" ]; then
        viewSpecificLogs "api"
    elif [ "$SERVICE" == "2" ]; then
        viewSpecificLogs "worker"
    elif [ "$SERVICE" == "3" ]; then
        viewSpecificLogs "beat"
    elif [ "$SERVICE" == "4" ]; then
        viewSpecificLogs "web"
    elif [ "$SERVICE" == "5" ]; then
        viewSpecificLogs "proxy"
    elif [ "$SERVICE" == "6" ]; then
        viewSpecificLogs "space"
    elif [ "$SERVICE" == "7" ]; then
        askForAction
    fi
}

function viewStatus() {
    echo "Checking status of ${stack_name} stack..."
    if [ -z "$stack_name" ]; then
        echo "Stack name not found"
        exit 1
    fi
    docker stack ps "$stack_name"
}

function upgrade() {
    
    local latest_release="stable"

    echo ""
    echo "Current release: $APP_RELEASE"

    if [ "$latest_release" == "$APP_RELEASE" ]; then
        echo ""
        echo "You are already using the latest release"
        exit 0
    fi

    echo "Latest release: $latest_release"
    echo ""

    # Check for confirmation to upgrade
    echo "Do you want to upgrade to the latest release ($latest_release)?"
    read -p "Continue? [y/N]: " confirm

    if [[ ! "$confirm" =~ ^[Yy]$ ]]; then
        echo "Exiting..."
        exit 0
    fi

    echo "Upgrading ${stack_name} stack..."

    # check env file and take backup
    if [ -f "$DOCKER_ENV_PATH" ]; then
        cp "$DOCKER_ENV_PATH" "${DOCKER_ENV_PATH}.bak"
    fi

    # fetch new env file
    curl -L https://raw.githubusercontent.com/${GH_REPO}/refs/heads/${BRANCH}/deploy/selfhost/docker-compose.yml -o $DOCKER_FILE_PATH
    curl -L https://raw.githubusercontent.com/${GH_REPO}/refs/heads/${BRANCH}/deploy/selfhost/variables.env -o $DOCKER_ENV_PATH
    echo "Configuration files downloaded successfully"
    echo ""

    NEW_VERSION_NAME=$(getEnvValue "APP_RELEASE" "$DOCKER_ENV_PATH")
    syncEnvFile
    updateEnvFile "APP_RELEASE" "$NEW_VERSION_NAME" "$DOCKER_ENV_PATH"
    if [ -z "$stack_name" ]; then
        readStackName
    fi
    removeStack
    deployStack
}

function askForAction() {
    # Rest of askForAction remains the same but use $stack_name instead of $STACK_NAME
    local DEFAULT_ACTION=$1

    if [ -z "$DEFAULT_ACTION" ]; then
        echo
        echo "Select an Action you want to perform:"
        echo "   1) Deploy Stack"
        echo "   2) Remove Stack"
        echo "   3) View Stack Status"
        echo "   4) View Logs"
        echo "   5) Upgrade"
        echo "   6) Exit"
        echo 
        read -p "Action [3]: " ACTION
        until [[ -z "$ACTION" || "$ACTION" =~ ^[1-6]$ ]]; do
            echo "$ACTION: invalid selection."
            read -p "Action [3]: " ACTION
        done

        if [ -z "$ACTION" ]; then
            ACTION=3
        fi
        echo
    fi

    if [ "$ACTION" == "1" ] || [ "$DEFAULT_ACTION" == "deploy" ]; then
        deployStack
    elif [ "$ACTION" == "2" ] || [ "$DEFAULT_ACTION" == "remove" ]; then
        removeStack
    elif [ "$ACTION" == "3" ] || [ "$DEFAULT_ACTION" == "status" ]; then
        viewStatus
    elif [ "$ACTION" == "4" ] || [ "$DEFAULT_ACTION" == "logs" ]; then
        viewLogs
    elif [ "$ACTION" == "5" ] || [ "$DEFAULT_ACTION" == "upgrade" ]; then
        upgrade
    elif [ "$ACTION" == "6" ] || [ "$DEFAULT_ACTION" == "exit" ]; then
        exit 0
    else
        echo "INVALID ACTION SUPPLIED"
    fi
}

# Initialize stack name at script start

if [ -z "$stack_name" ]; then
    readStackName
fi


# Main execution
print_header
askForAction "$@"
