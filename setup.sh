#!/bin/bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")" && pwd)"
COMPOSE_FILE_PATH="${REPO_ROOT}/docker-compose.yml"
ROOT_ENV_PATH="${REPO_ROOT}/.env"
ROOT_ENV_EXAMPLE_PATH="${REPO_ROOT}/.env.example"
PLANE_ENV_PATH="${REPO_ROOT}/plane.env"
API_ENV_PATH="${REPO_ROOT}/apps/api/.env"
API_ENV_EXAMPLE_PATH="${REPO_ROOT}/apps/api/.env.example"
BACKUP_ROOT="${REPO_ROOT}/backup"

COMPOSE_CMD=""
LAST_COMPOSE_EXIT_CODE=0

function detect_compose() {
    if command -v docker-compose &>/dev/null; then
        COMPOSE_CMD="docker-compose"
    else
        COMPOSE_CMD="docker compose"
    fi
}

function print_header() {
    clear 2>/dev/null || true
    cat <<'EOF'
--------------------------------------------
 ____  _                          ///////// 
|  _ \| | __ _ _ __   ___         ///////// 
| |_) | |/ _` | '_ \ / _ \   /////    ///// 
|  __/| | (_| | | | |  __/   /////    ///// 
|_|   |_|\__,_|_| |_|\___|        ////      
                                  ////      
--------------------------------------------
Local Plane build from this repository
--------------------------------------------
EOF
}

function run_compose() {
    pushd "$REPO_ROOT" >/dev/null
    if [[ "$COMPOSE_CMD" == "docker compose" ]]; then
        docker compose "$@"
    else
        docker-compose "$@"
    fi
    LAST_COMPOSE_EXIT_CODE=$?
    popd >/dev/null
}

function get_env_value() {
    local key="$1"
    local file="$2"

    if [[ ! -f "$file" ]]; then
        echo ""
        return
    fi

    local line
    line=$(grep -m1 "^${key}=" "$file" 2>/dev/null || true)
    if [[ -z "$line" ]]; then
        echo ""
        return
    fi

    local value="${line#*=}"
    # Remove surrounding quotes if present
    value="${value#\"}"
    value="${value%\"}"
    value="${value#\'}"
    value="${value%\'}"
    echo "$value"
}

function update_env_file() {
    local key="$1"
    local value="$2"
    local file="$3"

    if [[ ! -f "$file" ]]; then
        echo "File not found: $file"
        return 1
    fi

    if grep -q "^${key}=" "$file" 2>/dev/null; then
        # Escape special sed characters in value
        local escaped_value
        escaped_value=$(printf '%s\n' "$value" | sed -e 's/[&/\]/\\&/g')
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s|^${key}=.*|${key}=${escaped_value}|g" "$file"
        else
            sed -i "s|^${key}=.*|${key}=${escaped_value}|g" "$file"
        fi
    else
        echo "${key}=${value}" >> "$file"
    fi
}

function new_secret_key() {
    LC_ALL=C tr -dc 'a-z0-9' </dev/urandom | head -c 50
}

function initialize_local_env_files() {
    if [[ ! -f "$COMPOSE_FILE_PATH" ]]; then
        echo "ERROR: docker-compose.yml not found at ${COMPOSE_FILE_PATH}"
        exit 1
    fi

    if [[ ! -f "$ROOT_ENV_PATH" ]]; then
        if [[ -f "$PLANE_ENV_PATH" ]]; then
            cp "$PLANE_ENV_PATH" "$ROOT_ENV_PATH"
            echo "Created .env from plane.env"
        elif [[ -f "$ROOT_ENV_EXAMPLE_PATH" ]]; then
            cp "$ROOT_ENV_EXAMPLE_PATH" "$ROOT_ENV_PATH"
            echo "Created .env from .env.example"
        else
            echo "ERROR: Neither .env, plane.env, nor .env.example exists in ${REPO_ROOT}"
            exit 1
        fi
    fi

    if [[ ! -f "$API_ENV_PATH" ]]; then
        if [[ -f "$API_ENV_EXAMPLE_PATH" ]]; then
            cp "$API_ENV_EXAMPLE_PATH" "$API_ENV_PATH"
            echo "Created apps/api/.env from apps/api/.env.example"
        else
            echo "ERROR: apps/api/.env does not exist and apps/api/.env.example was not found"
            exit 1
        fi
    fi

    local secret_key
    secret_key=$(get_env_value "SECRET_KEY" "$API_ENV_PATH")
    if [[ -z "$secret_key" ]]; then
        echo "SECRET_KEY=$(new_secret_key)" >> "$API_ENV_PATH"
        echo "Added SECRET_KEY to apps/api/.env"
    fi

    local live_secret_key
    live_secret_key=$(get_env_value "LIVE_SERVER_SECRET_KEY" "$API_ENV_PATH")
    if [[ -z "$live_secret_key" ]]; then
        echo "LIVE_SERVER_SECRET_KEY=$(new_secret_key)" >> "$API_ENV_PATH"
        echo "Added LIVE_SERVER_SECRET_KEY to apps/api/.env"
    fi
}

function compose_base_args() {
    echo "-f ${COMPOSE_FILE_PATH} --env-file ${ROOT_ENV_PATH}"
}

function build_local_images() {
    export DOCKER_BUILDKIT=1

    local builds=(
        "proxy|plane-proxy|${REPO_ROOT}/apps/proxy|${REPO_ROOT}/apps/proxy/Dockerfile.ce"
        "backend|plane-api plane-worker plane-beat-worker plane-migrator|${REPO_ROOT}/apps/api|${REPO_ROOT}/apps/api/Dockerfile.api"
        "web|plane-web|${REPO_ROOT}|${REPO_ROOT}/apps/web/Dockerfile.web"
        "admin|plane-admin|${REPO_ROOT}|${REPO_ROOT}/apps/admin/Dockerfile.admin"
        "space|plane-space|${REPO_ROOT}|${REPO_ROOT}/apps/space/Dockerfile.space"
        "live|plane-live|${REPO_ROOT}|${REPO_ROOT}/apps/live/Dockerfile.live"
    )

    local no_cache=""
    if [[ "${1:-}" == "true" ]]; then
        no_cache="--no-cache"
    fi

    for entry in "${builds[@]}"; do
        IFS='|' read -r name tags context dockerfile <<< "$entry"

        echo ""
        echo "***** BUILDING ${name} *****"

        local tag_args=()
        for tag in $tags; do
            tag_args+=("-t" "$tag")
        done

        docker build --progress=plain --build-arg DOCKER_BUILDKIT=1 $no_cache "${tag_args[@]}" -f "$dockerfile" "$context"

        if [[ $? -ne 0 ]]; then
            echo "Local Docker image build failed for '${name}'."
            exit 1
        fi
    done
}

function install_plane() {
    echo "Building Plane Docker images from the current repository..."
    echo "Repository: ${REPO_ROOT}"
    echo ""

    initialize_local_env_files
    build_local_images false

    echo ""
    echo "Local Plane images were built successfully."
    echo "Start the project with: ./setup.sh start"
    echo ""
}

function start_services() {
    initialize_local_env_files
    build_local_images false

    run_compose $(compose_base_args) up -d --no-build --force-recreate
    if [[ $LAST_COMPOSE_EXIT_CODE -ne 0 ]]; then
        exit $LAST_COMPOSE_EXIT_CODE
    fi

    local migrator_container_id
    migrator_container_id=$(docker container ls -aq -f "name=plane-migrator" | head -n1)

    if [[ -n "$migrator_container_id" ]]; then
        local idx=0
        while docker inspect --format='{{.State.Status}}' "$migrator_container_id" 2>/dev/null | grep -q "running"; do
            local dots
            dots=$(printf '%*s' "$idx" | tr ' ' '.')
            printf "\r>> Waiting for Data Migration to finish%s" "$dots"
            ((idx++))
            sleep 1
        done

        printf "\r%*s\r" 60 ""

        local migrator_exit_code
        migrator_exit_code=$(docker inspect --format='{{.State.ExitCode}}' "$migrator_container_id")
        if [[ "$migrator_exit_code" != "0" ]]; then
            echo "Plane Server failed to start"
            echo ""
            echo "Please check the logs for the migrator service and resolve the issue."
            echo "Logs: ./setup.sh logs migrator"
            exit 1
        fi

        echo "   Data Migration completed successfully"
    fi

    local api_container_id
    api_container_id=$(docker container ls -q -f "name=api" | head -n1)

    if [[ -z "$api_container_id" ]]; then
        echo "   API container was not found. Check service status with: ./setup.sh status"
        exit 1
    fi

    local api_ready=true
    local max_wait_time=300
    local start_time
    start_time=$(date +%s)
    local idx=0

    echo "   Waiting for API Service to be ready..."
    while ! docker exec "$api_container_id" python3 -c "import urllib.request; urllib.request.urlopen('http://localhost:8000/', timeout=3)" >/dev/null 2>&1; do
        local current_time
        current_time=$(date +%s)
        local elapsed_time=$((current_time - start_time))

        if [[ $elapsed_time -gt $max_wait_time ]]; then
            echo ""
            echo "   API Service health check timed out after 5 minutes."
            api_ready=false
            break
        fi

        local dots
        dots=$(printf '%*s' "$idx" | tr ' ' '.')
        printf "\r>> Waiting for API Service to Start (%ss)%s" "$elapsed_time" "$dots"
        ((idx++))
        sleep 1
    done

    printf "\r%*s\r" 60 ""

    if [[ "$api_ready" == true ]]; then
        echo "   API Service started successfully"
    else
        echo "   API Service did not respond to health-check - please verify manually."
    fi

    echo "   Plane Server started successfully"
    echo ""
    echo "   Web:   http://localhost"
    echo "   API:   http://localhost:8000"
    echo ""
}

function stop_services() {
    initialize_local_env_files
    run_compose $(compose_base_args) down
}

function restart_services() {
    stop_services
    start_services
}

function rebuild_services() {
    initialize_local_env_files
    echo "Rebuilding local images without cache..."
    build_local_images true
}

function view_specific_logs() {
    local service_name="$1"
    initialize_local_env_files
    run_compose $(compose_base_args) logs -f "$service_name"
}

function view_logs() {
    local service_name="${1:-}"

    if [[ -z "$service_name" ]]; then
        echo ""
        echo "Select a Service you want to view the logs for:"
        echo "   1) Web"
        echo "   2) Space"
        echo "   3) API"
        echo "   4) Worker"
        echo "   5) Beat-Worker"
        echo "   6) Migrator"
        echo "   7) Proxy"
        echo "   8) Redis"
        echo "   9) Postgres"
        echo "   10) Minio"
        echo "   11) RabbitMQ"
        echo "   0) Back to Main Menu"
        echo ""

        read -p "Service: " selection

        while [[ -z "$selection" || ! "$selection" =~ ^[0-9]+$ || "$selection" -lt 0 || "$selection" -gt 11 ]]; do
            echo "Invalid selection. Please enter a number between 0 and 11."
            read -p "Service: " selection
        done

        case "$selection" in
            1) view_specific_logs "web" ;;
            2) view_specific_logs "space" ;;
            3) view_specific_logs "api" ;;
            4) view_specific_logs "worker" ;;
            5) view_specific_logs "beat-worker" ;;
            6) view_specific_logs "migrator" ;;
            7) view_specific_logs "proxy" ;;
            8) view_specific_logs "plane-redis" ;;
            9) view_specific_logs "plane-db" ;;
            10) view_specific_logs "plane-minio" ;;
            11) view_specific_logs "plane-mq" ;;
            0) ask_for_action ;;
            *) echo "INVALID SERVICE NAME SUPPLIED" ;;
        esac
    else
        service_name=$(echo "$service_name" | tr '[:upper:]' '[:lower:]')
        case "$service_name" in
            web) view_specific_logs "web" ;;
            space) view_specific_logs "space" ;;
            api) view_specific_logs "api" ;;
            worker) view_specific_logs "worker" ;;
            beat-worker) view_specific_logs "beat-worker" ;;
            migrator) view_specific_logs "migrator" ;;
            proxy) view_specific_logs "proxy" ;;
            redis) view_specific_logs "plane-redis" ;;
            postgres) view_specific_logs "plane-db" ;;
            minio) view_specific_logs "plane-minio" ;;
            rabbitmq) view_specific_logs "plane-mq" ;;
            *) echo "INVALID SERVICE NAME SUPPLIED" ;;
        esac
    fi
}

function show_status() {
    initialize_local_env_files
    run_compose $(compose_base_args) ps
}

function backup_container_dir() {
    local backup_folder="$1"
    local container_name="$2"
    local container_data_dir="$3"
    local service_folder="$4"

    echo "Backing up ${container_name} data..."
    local container_id
    container_id=$(run_compose $(compose_base_args) ps -q "$container_name" | head -n1)

    if [[ -z "$container_id" ]]; then
        echo "Error: ${container_name} container not found. Make sure the services are running."
        return 1
    fi

    local service_backup_path="${backup_folder}/${service_folder}"
    mkdir -p "$service_backup_path"

    echo "Copying ${container_name} data directory..."
    if ! docker cp "${container_id}:${container_data_dir}/." "$service_backup_path/"; then
        echo "Error: Failed to copy ${service_folder} data"
        rm -rf "$service_backup_path"
        return 1
    fi

    pushd "$backup_folder" >/dev/null
    if tar -czf "${service_folder}.tar.gz" "$service_folder/"; then
        rm -rf "$service_backup_path"
    fi
    popd >/dev/null

    echo "Successfully backed up ${service_folder} data"
}

function backup_data() {
    local datetime
    datetime=$(date +"%Y%m%d-%H%M")
    local backup_folder="${BACKUP_ROOT}/${datetime}"
    mkdir -p "$backup_folder"

    if ! backup_container_dir "$backup_folder" "plane-db" "/var/lib/postgresql/data" "pgdata"; then exit 1; fi
    if ! backup_container_dir "$backup_folder" "plane-minio" "/export" "uploads"; then exit 1; fi
    if ! backup_container_dir "$backup_folder" "plane-mq" "/var/lib/rabbitmq" "rabbitmq_data"; then exit 1; fi
    if ! backup_container_dir "$backup_folder" "plane-redis" "/data" "redisdata"; then exit 1; fi

    echo ""
    echo "Backup completed successfully. Backup files are stored in ${backup_folder}"
    echo ""
}

function ask_for_action() {
    local default_action="${1:-}"
    local action=""

    if [[ -z "$default_action" ]]; then
        echo ""
        echo "Select a Action you want to perform:"
        echo "   1) Install / Build local images"
        echo "   2) Start"
        echo "   3) Stop"
        echo "   4) Restart"
        echo "   5) Rebuild without cache"
        echo "   6) View Logs"
        echo "   7) Backup Data"
        echo "   8) Status"
        echo "   9) Exit"
        echo ""

        read -p "Action [2]: " action

        while [[ -n "$action" && ! "$action" =~ ^[1-9]$ ]]; do
            echo "${action}: invalid selection."
            read -p "Action [2]: " action
        done

        if [[ -z "$action" ]]; then
            action="2"
        fi

        echo ""
    fi

    local resolved_action="$action"
    if [[ -z "$resolved_action" && -n "$default_action" ]]; then
        resolved_action="$default_action"
    fi

    case "$resolved_action" in
        1|install|build)
            install_plane
            ;;
        2|start|up)
            start_services
            ;;
        3|stop|down)
            stop_services
            ;;
        4|restart)
            restart_services
            ;;
        5|rebuild)
            rebuild_services
            ;;
        6|logs)
            if [[ -n "${2:-}" ]]; then
                view_logs "$2"
            else
                view_logs
            fi
            ;;
        7|backup)
            backup_data
            ;;
        8|status|ps)
            show_status
            ;;
        9)
            exit 0
            ;;
        *)
            echo "INVALID ACTION SUPPLIED"
            ;;
    esac
}

# Initialize
detect_compose
print_header

# Allow passing arguments directly, e.g. ./setup.sh start
if [[ $# -gt 0 ]]; then
    ask_for_action "$@"
else
    ask_for_action
fi
