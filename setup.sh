#!/bin/bash
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "$0")" && pwd)"
COMPOSE_FILE_PATH="${REPO_ROOT}/docker-compose.yml"
ROOT_ENV_PATH="${REPO_ROOT}/.env"
ROOT_ENV_EXAMPLE_PATH="${REPO_ROOT}/.env.example"
PLANE_ENV_PATH="${REPO_ROOT}/plane.env"
API_ENV_PATH="${REPO_ROOT}/apps/api/.env"
API_ENV_EXAMPLE_PATH="${REPO_ROOT}/apps/api/.env.example"
MAIL_STACK_DIR="${REPO_ROOT}/mail-stack"
MAIL_COMPOSE_FILE_PATH="${MAIL_STACK_DIR}/docker-compose.yml"
MAIL_ENV_PATH="${MAIL_STACK_DIR}/.env"
MAIL_ENV_EXAMPLE_PATH="${MAIL_STACK_DIR}/.env.example"
FORGEJO_STACK_DIR="${REPO_ROOT}/forgejo-stack"
FORGEJO_COMPOSE_FILE_PATH="${FORGEJO_STACK_DIR}/docker-compose.yml"
FORGEJO_ENV_PATH="${FORGEJO_STACK_DIR}/.env"
FORGEJO_ENV_EXAMPLE_PATH="${FORGEJO_STACK_DIR}/.env.example"
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

function run_compose_in_dir() {
    local workdir="$1"
    shift

    pushd "$workdir" >/dev/null
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
    if command -v openssl >/dev/null 2>&1; then
        openssl rand -hex 32
        return
    fi

    local secret=""
    while [[ ${#secret} -lt 50 ]]; do
        secret+=$(LC_ALL=C tr -dc 'a-z0-9' </dev/urandom | head -c $((50 - ${#secret})) || true)
    done

    printf '%s' "$secret"
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

function mail_compose_args() {
    echo "-f ${MAIL_COMPOSE_FILE_PATH} --env-file ${ROOT_ENV_PATH} --env-file ${MAIL_ENV_PATH}"
}

function forgejo_compose_args() {
    echo "-f ${FORGEJO_COMPOSE_FILE_PATH} --env-file ${ROOT_ENV_PATH} --env-file ${FORGEJO_ENV_PATH}"
}

function ensure_shared_docker_resources() {
    if ! docker network inspect plane_default >/dev/null 2>&1; then
        echo "Creating shared Docker network: plane_default"
        docker network create plane_default >/dev/null
    fi

    if ! docker volume inspect plane_caddy-data >/dev/null 2>&1; then
        echo "Creating shared Docker volume: plane_caddy-data"
        docker volume create plane_caddy-data >/dev/null
    fi
}

function initialize_mail_env_files() {
    initialize_local_env_files

    if [[ ! -f "$MAIL_COMPOSE_FILE_PATH" ]]; then
        echo "ERROR: mail-stack/docker-compose.yml not found at ${MAIL_COMPOSE_FILE_PATH}"
        exit 1
    fi

    if [[ ! -f "$MAIL_ENV_PATH" ]]; then
        if [[ -f "$MAIL_ENV_EXAMPLE_PATH" ]]; then
            cp "$MAIL_ENV_EXAMPLE_PATH" "$MAIL_ENV_PATH"
            echo "Created mail-stack/.env from mail-stack/.env.example"
        else
            echo "ERROR: mail-stack/.env does not exist and mail-stack/.env.example was not found"
            exit 1
        fi
    fi

    local mail_domain
    mail_domain=$(get_env_value "MAIL_DOMAIN" "$MAIL_ENV_PATH")
    if [[ -z "$mail_domain" ]]; then
        mail_domain=$(get_env_value "MAIL_DOMAIN" "$ROOT_ENV_PATH")
        if [[ -n "$mail_domain" ]]; then
            update_env_file "MAIL_DOMAIN" "$mail_domain" "$MAIL_ENV_PATH"
        fi
    fi

    mail_domain=$(get_env_value "MAIL_DOMAIN" "$MAIL_ENV_PATH")
    if [[ -z "$mail_domain" ]]; then
        echo "ERROR: MAIL_DOMAIN is not set. Set it in .env and mail-stack/.env before starting the mail stack."
        exit 1
    fi
}

function initialize_forgejo_env_files() {
    initialize_local_env_files

    if [[ ! -f "$FORGEJO_COMPOSE_FILE_PATH" ]]; then
        echo "ERROR: forgejo-stack/docker-compose.yml not found at ${FORGEJO_COMPOSE_FILE_PATH}"
        exit 1
    fi

    if [[ ! -f "$FORGEJO_ENV_PATH" ]]; then
        if [[ -f "$FORGEJO_ENV_EXAMPLE_PATH" ]]; then
            cp "$FORGEJO_ENV_EXAMPLE_PATH" "$FORGEJO_ENV_PATH"
            echo "Created forgejo-stack/.env from forgejo-stack/.env.example"
        else
            echo "ERROR: forgejo-stack/.env does not exist and forgejo-stack/.env.example was not found"
            exit 1
        fi
    fi

    local postgres_password
    postgres_password=$(get_env_value "POSTGRES_PASSWORD" "$FORGEJO_ENV_PATH")
    if [[ -z "$postgres_password" || "$postgres_password" == replace_with_* ]]; then
        postgres_password=$(new_secret_key)
        update_env_file "POSTGRES_PASSWORD" "$postgres_password" "$FORGEJO_ENV_PATH"
        echo "Generated POSTGRES_PASSWORD in forgejo-stack/.env"
    fi

    local forgejo_db_password
    forgejo_db_password=$(get_env_value "FORGEJO_DB_PASSWORD" "$FORGEJO_ENV_PATH")
    if [[ -z "$forgejo_db_password" || "$forgejo_db_password" == replace_with_* ]]; then
        update_env_file "FORGEJO_DB_PASSWORD" "$postgres_password" "$FORGEJO_ENV_PATH"
        echo "Set FORGEJO_DB_PASSWORD to match POSTGRES_PASSWORD in forgejo-stack/.env"
    elif [[ "$forgejo_db_password" != "$postgres_password" ]]; then
        echo "WARNING: FORGEJO_DB_PASSWORD differs from POSTGRES_PASSWORD. Forgejo may not be able to connect to its database."
    fi

    local smtp_password
    smtp_password=$(get_env_value "SMTP_PASSWORD" "$FORGEJO_ENV_PATH")
    if [[ -z "$smtp_password" || "$smtp_password" == replace_with_* ]]; then
        echo "WARNING: SMTP_PASSWORD is not configured in forgejo-stack/.env. Forgejo can start, but mail notifications will fail until git@MAIL_DOMAIN exists in the mail stack."
    fi

    local git_domain
    git_domain=$(get_env_value "GIT_DOMAIN" "$ROOT_ENV_PATH")
    if [[ -z "$git_domain" ]]; then
        echo "ERROR: GIT_DOMAIN is not set in .env."
        exit 1
    fi

    mkdir -p "${FORGEJO_STACK_DIR}/data/forgejo" "${FORGEJO_STACK_DIR}/data/postgres" "${FORGEJO_STACK_DIR}/backups"
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

function start_mail_services() {
    initialize_mail_env_files
    ensure_shared_docker_resources

    echo "Starting mail stack..."
    run_compose_in_dir "$MAIL_STACK_DIR" $(mail_compose_args) up -d --build
    if [[ $LAST_COMPOSE_EXIT_CODE -ne 0 ]]; then
        exit $LAST_COMPOSE_EXIT_CODE
    fi

    echo "   Mail stack started"
    echo "   SMTP:    mail.$(get_env_value "MAIL_DOMAIN" "$MAIL_ENV_PATH"):587"
    echo "   IMAPS:   mail.$(get_env_value "MAIL_DOMAIN" "$MAIL_ENV_PATH"):993"
    echo "   Webmail: https://webmail.$(get_env_value "MAIL_DOMAIN" "$MAIL_ENV_PATH")"
    echo ""
}

function start_git_services() {
    initialize_forgejo_env_files
    ensure_shared_docker_resources

    echo "Starting Forgejo git stack..."
    run_compose_in_dir "$FORGEJO_STACK_DIR" $(forgejo_compose_args) up -d
    if [[ $LAST_COMPOSE_EXIT_CODE -ne 0 ]]; then
        exit $LAST_COMPOSE_EXIT_CODE
    fi

    echo "   Git stack started"
    echo "   Web: https://git.$(get_env_value "GIT_DOMAIN" "$ROOT_ENV_PATH")"
    echo "   SSH: git@git.$(get_env_value "GIT_DOMAIN" "$ROOT_ENV_PATH"):2222"
    echo ""
}

function start_all_services() {
    start_services
    start_mail_services
    start_git_services
}

function stop_services() {
    initialize_local_env_files
    run_compose $(compose_base_args) down
}

function stop_mail_services() {
    initialize_mail_env_files
    run_compose_in_dir "$MAIL_STACK_DIR" $(mail_compose_args) down
}

function stop_git_services() {
    initialize_forgejo_env_files
    run_compose_in_dir "$FORGEJO_STACK_DIR" $(forgejo_compose_args) down
}

function stop_all_services() {
    stop_git_services
    stop_mail_services
    stop_services
}

function restart_services() {
    stop_services
    start_services
}

function restart_mail_services() {
    stop_mail_services
    start_mail_services
}

function restart_git_services() {
    stop_git_services
    start_git_services
}

function restart_all_services() {
    stop_all_services
    start_all_services
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

function view_stack_logs() {
    local stack="$1"
    local service_name="${2:-}"

    case "$stack" in
        plane)
            if [[ -n "$service_name" ]]; then
                view_logs "$service_name"
            else
                run_compose $(compose_base_args) logs -f
            fi
            ;;
        mail)
            initialize_mail_env_files
            if [[ -n "$service_name" ]]; then
                run_compose_in_dir "$MAIL_STACK_DIR" $(mail_compose_args) logs -f "$service_name"
            else
                run_compose_in_dir "$MAIL_STACK_DIR" $(mail_compose_args) logs -f
            fi
            ;;
        git|forgejo)
            initialize_forgejo_env_files
            if [[ -n "$service_name" ]]; then
                run_compose_in_dir "$FORGEJO_STACK_DIR" $(forgejo_compose_args) logs -f "$service_name"
            else
                run_compose_in_dir "$FORGEJO_STACK_DIR" $(forgejo_compose_args) logs -f
            fi
            ;;
        all)
            echo "Streaming Plane logs. Open another terminal for mail/git logs if needed."
            run_compose $(compose_base_args) logs -f
            ;;
        *)
            echo "INVALID STACK NAME SUPPLIED"
            ;;
    esac
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

function show_mail_status() {
    initialize_mail_env_files
    run_compose_in_dir "$MAIL_STACK_DIR" $(mail_compose_args) ps
}

function show_git_status() {
    initialize_forgejo_env_files
    run_compose_in_dir "$FORGEJO_STACK_DIR" $(forgejo_compose_args) ps
}

function show_all_status() {
    echo ""
    echo "Plane:"
    show_status
    echo ""
    echo "Mail:"
    show_mail_status
    echo ""
    echo "Git:"
    show_git_status
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

function normalize_target() {
    local target="${1:-plane}"
    target=$(echo "$target" | tr '[:upper:]' '[:lower:]')

    case "$target" in
        ""|plane) echo "plane" ;;
        mail|email|smtp) echo "mail" ;;
        git|forgejo|gitea) echo "git" ;;
        all|full) echo "all" ;;
        *) echo "$target" ;;
    esac
}

function start_target() {
    local target
    target=$(normalize_target "${1:-plane}")

    case "$target" in
        plane) start_services ;;
        mail) start_mail_services ;;
        git) start_git_services ;;
        all) start_all_services ;;
        *) echo "INVALID TARGET SUPPLIED. Use: plane, mail, git, all" ;;
    esac
}

function stop_target() {
    local target
    target=$(normalize_target "${1:-plane}")

    case "$target" in
        plane) stop_services ;;
        mail) stop_mail_services ;;
        git) stop_git_services ;;
        all) stop_all_services ;;
        *) echo "INVALID TARGET SUPPLIED. Use: plane, mail, git, all" ;;
    esac
}

function restart_target() {
    local target
    target=$(normalize_target "${1:-plane}")

    case "$target" in
        plane) restart_services ;;
        mail) restart_mail_services ;;
        git) restart_git_services ;;
        all) restart_all_services ;;
        *) echo "INVALID TARGET SUPPLIED. Use: plane, mail, git, all" ;;
    esac
}

function status_target() {
    local target
    target=$(normalize_target "${1:-plane}")

    case "$target" in
        plane) show_status ;;
        mail) show_mail_status ;;
        git) show_git_status ;;
        all) show_all_status ;;
        *) echo "INVALID TARGET SUPPLIED. Use: plane, mail, git, all" ;;
    esac
}

function ask_for_action() {
    local default_action="${1:-}"
    local action=""

    if [[ -z "$default_action" ]]; then
        echo ""
        echo "Select a Action you want to perform:"
        echo "   1) Install / Build local images"
        echo "   2) Start all (Plane + mail + git)"
        echo "   3) Start Plane only"
        echo "   4) Start mail server only"
        echo "   5) Start git server only"
        echo "   6) Stop all"
        echo "   7) Stop Plane only"
        echo "   8) Stop mail server only"
        echo "   9) Stop git server only"
        echo "   10) Restart all"
        echo "   11) Restart Plane only"
        echo "   12) Restart mail server only"
        echo "   13) Restart git server only"
        echo "   14) Rebuild Plane images without cache"
        echo "   15) View Logs"
        echo "   16) Backup Plane Data"
        echo "   17) Status"
        echo "   18) Exit"
        echo ""

        read -p "Action [3]: " action

        while [[ -n "$action" && ( ! "$action" =~ ^[0-9]+$ || "$action" -lt 1 || "$action" -gt 18 ) ]]; do
            echo "${action}: invalid selection."
            read -p "Action [3]: " action
        done

        if [[ -z "$action" ]]; then
            action="3"
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
        2)
            start_target all
            ;;
        3|start|up)
            start_target "${2:-plane}"
            ;;
        4)
            start_target mail
            ;;
        5)
            start_target git
            ;;
        6)
            stop_target all
            ;;
        7|stop|down)
            stop_target "${2:-plane}"
            ;;
        8)
            stop_target mail
            ;;
        9)
            stop_target git
            ;;
        10)
            restart_target all
            ;;
        11|restart)
            restart_target "${2:-plane}"
            ;;
        12)
            restart_target mail
            ;;
        13)
            restart_target git
            ;;
        14|rebuild)
            rebuild_services
            ;;
        15|logs)
            if [[ -n "${2:-}" ]]; then
                local log_target
                log_target=$(normalize_target "$2")
                if [[ "$log_target" == "plane" || "$log_target" == "mail" || "$log_target" == "git" || "$log_target" == "all" ]]; then
                    view_stack_logs "$log_target" "${3:-}"
                else
                    view_logs "$2"
                fi
            else
                view_logs
            fi
            ;;
        16|backup)
            backup_data
            ;;
        17|status|ps)
            status_target "${2:-plane}"
            ;;
        18)
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
