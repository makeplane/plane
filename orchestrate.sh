#!/usr/bin/env bash
set -euo pipefail

# ─────────────────────────────────────────────────────────────────────────────
# Plane Orchestrator — TUI for managing Docker Compose services
# ─────────────────────────────────────────────────────────────────────────────

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
COMPOSE_FILE="$SCRIPT_DIR/docker-compose.yml"
COMPOSE_LOCAL="$SCRIPT_DIR/docker-compose-local.yml"
ENV_FILE="$SCRIPT_DIR/.env"

# ── Colors & Formatting ─────────────────────────────────────────────────────
BOLD='\033[1m'
DIM='\033[2m'
UNDERLINE='\033[4m'
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
NC='\033[0m'

# ── Service Definitions ─────────────────────────────────────────────────────
# Group services by category for the TUI
APP_SERVICES=("web" "admin" "space" "live")
API_SERVICES=("api" "worker" "beat-worker" "migrator")
INFRA_SERVICES=("plane-db" "plane-redis" "plane-mq" "plane-minio" "proxy")
ALL_SERVICES=("${INFRA_SERVICES[@]}" "${API_SERVICES[@]}" "${APP_SERVICES[@]}")

# ── State ────────────────────────────────────────────────────────────────────
COMPOSE_CMD=""
ACTIVE_COMPOSE=""

detect_compose() {
    if command -v docker &>/dev/null && docker compose version &>/dev/null 2>&1; then
        COMPOSE_CMD="docker compose"
    elif command -v docker-compose &>/dev/null; then
        COMPOSE_CMD="docker-compose"
    else
        echo -e "${RED}Error: Neither 'docker compose' nor 'docker-compose' found.${NC}"
        echo -e "Please install Docker with Compose support."
        exit 1
    fi
}

select_compose_file() {
    if [ -n "$ACTIVE_COMPOSE" ]; then
        return
    fi
    if [ -f "$COMPOSE_LOCAL" ] && [ -f "$COMPOSE_FILE" ]; then
        ACTIVE_COMPOSE="$COMPOSE_FILE"
    elif [ -f "$COMPOSE_FILE" ]; then
        ACTIVE_COMPOSE="$COMPOSE_FILE"
    elif [ -f "$COMPOSE_LOCAL" ]; then
        ACTIVE_COMPOSE="$COMPOSE_LOCAL"
    else
        echo -e "${RED}Error: No docker-compose file found.${NC}"
        exit 1
    fi
}

compose() {
    $COMPOSE_CMD -f "$ACTIVE_COMPOSE" "$@"
}

# ── TUI Drawing ──────────────────────────────────────────────────────────────

clear_screen() {
    printf '\033[2J\033[H'
}

draw_header() {
    local width=64
    local mode_label="production"
    if [ "$ACTIVE_COMPOSE" = "$COMPOSE_LOCAL" ]; then
        mode_label="local dev"
    fi
    echo -e "${BOLD}${BLUE}"
    echo "  ┌──────────────────────────────────────────────────────────────┐"
    echo "  │              ✈  Plane Service Orchestrator                   │"
    printf "  │              %-47s │\n" "mode: $mode_label"
    echo "  └──────────────────────────────────────────────────────────────┘"
    echo -e "${NC}"
}

draw_separator() {
    echo -e "${DIM}  ────────────────────────────────────────────────────────────────${NC}"
}

# ── Service Status ───────────────────────────────────────────────────────────

get_service_status() {
    local service=$1
    local status
    status=$(compose ps --format '{{.State}}' "$service" 2>/dev/null || echo "stopped")
    if [ -z "$status" ]; then
        echo "stopped"
    else
        echo "$status"
    fi
}

print_status_badge() {
    local status=$1
    case "$status" in
        running)  echo -e "${GREEN}● running ${NC}" ;;
        exited)   echo -e "${RED}● exited  ${NC}" ;;
        created)  echo -e "${YELLOW}● created ${NC}" ;;
        *)        echo -e "${DIM}○ stopped ${NC}" ;;
    esac
}

show_service_status() {
    echo -e "\n  ${BOLD}${WHITE}Service Status${NC}\n"

    echo -e "  ${UNDERLINE}Infrastructure${NC}"
    for svc in "${INFRA_SERVICES[@]}"; do
        local status
        status=$(get_service_status "$svc")
        local badge
        badge=$(print_status_badge "$status")
        printf "    %-20s %s\n" "$svc" "$badge"
    done

    echo ""
    echo -e "  ${UNDERLINE}API & Workers${NC}"
    for svc in "${API_SERVICES[@]}"; do
        local status
        status=$(get_service_status "$svc")
        local badge
        badge=$(print_status_badge "$status")
        printf "    %-20s %s\n" "$svc" "$badge"
    done

    echo ""
    echo -e "  ${UNDERLINE}Frontend Apps${NC}"
    for svc in "${APP_SERVICES[@]}"; do
        local status
        status=$(get_service_status "$svc")
        local badge
        badge=$(print_status_badge "$status")
        printf "    %-20s %s\n" "$svc" "$badge"
    done
    echo ""
}

# ── Menu Actions ─────────────────────────────────────────────────────────────

action_start_all() {
    echo -e "\n  ${CYAN}Starting all services...${NC}\n"
    compose up -d
    echo -e "\n  ${GREEN}All services started.${NC}"
    press_enter
}

action_stop_all() {
    echo -e "\n  ${CYAN}Stopping all services...${NC}\n"
    compose down
    echo -e "\n  ${GREEN}All services stopped.${NC}"
    press_enter
}

action_restart_all() {
    echo -e "\n  ${CYAN}Restarting all services...${NC}\n"
    compose restart
    echo -e "\n  ${GREEN}All services restarted.${NC}"
    press_enter
}

action_start_infra() {
    echo -e "\n  ${CYAN}Starting infrastructure services...${NC}\n"
    compose up -d "${INFRA_SERVICES[@]}"
    echo -e "\n  ${GREEN}Infrastructure services started.${NC}"
    press_enter
}

action_start_api() {
    echo -e "\n  ${CYAN}Starting API & worker services...${NC}\n"
    compose up -d "${API_SERVICES[@]}"
    echo -e "\n  ${GREEN}API services started.${NC}"
    press_enter
}

action_start_apps() {
    echo -e "\n  ${CYAN}Starting frontend app services...${NC}\n"
    compose up -d "${APP_SERVICES[@]}"
    echo -e "\n  ${GREEN}Frontend app services started.${NC}"
    press_enter
}

action_stop_service() {
    echo -e "\n  ${BOLD}Select a service to stop:${NC}\n"
    local i=1
    for svc in "${ALL_SERVICES[@]}"; do
        printf "    ${WHITE}%2d)${NC} %s\n" "$i" "$svc"
        ((i++))
    done
    echo ""
    read -rp "  Enter number (or 0 to cancel): " choice
    if [ "$choice" -gt 0 ] 2>/dev/null && [ "$choice" -le "${#ALL_SERVICES[@]}" ]; then
        local svc="${ALL_SERVICES[$((choice - 1))]}"
        echo -e "\n  ${CYAN}Stopping $svc...${NC}"
        compose stop "$svc"
        echo -e "  ${GREEN}$svc stopped.${NC}"
    fi
    press_enter
}

action_start_service() {
    echo -e "\n  ${BOLD}Select a service to start:${NC}\n"
    local i=1
    for svc in "${ALL_SERVICES[@]}"; do
        printf "    ${WHITE}%2d)${NC} %s\n" "$i" "$svc"
        ((i++))
    done
    echo ""
    read -rp "  Enter number (or 0 to cancel): " choice
    if [ "$choice" -gt 0 ] 2>/dev/null && [ "$choice" -le "${#ALL_SERVICES[@]}" ]; then
        local svc="${ALL_SERVICES[$((choice - 1))]}"
        echo -e "\n  ${CYAN}Starting $svc...${NC}"
        compose up -d "$svc"
        echo -e "  ${GREEN}$svc started.${NC}"
    fi
    press_enter
}

action_logs() {
    echo -e "\n  ${BOLD}Select a service for logs (or 0 for all):${NC}\n"
    local i=1
    for svc in "${ALL_SERVICES[@]}"; do
        printf "    ${WHITE}%2d)${NC} %s\n" "$i" "$svc"
        ((i++))
    done
    echo ""
    read -rp "  Enter number (or 0 for all): " choice
    if [ "$choice" -eq 0 ] 2>/dev/null; then
        compose logs --tail=50 -f
    elif [ "$choice" -gt 0 ] 2>/dev/null && [ "$choice" -le "${#ALL_SERVICES[@]}" ]; then
        local svc="${ALL_SERVICES[$((choice - 1))]}"
        compose logs --tail=50 -f "$svc"
    fi
    press_enter
}

action_rebuild() {
    echo -e "\n  ${BOLD}Select a service to rebuild (or 0 for all):${NC}\n"
    local i=1
    for svc in "${ALL_SERVICES[@]}"; do
        printf "    ${WHITE}%2d)${NC} %s\n" "$i" "$svc"
        ((i++))
    done
    echo ""
    read -rp "  Enter number (or 0 for all): " choice
    if [ "$choice" -eq 0 ] 2>/dev/null; then
        echo -e "\n  ${CYAN}Rebuilding all services...${NC}\n"
        compose build
    elif [ "$choice" -gt 0 ] 2>/dev/null && [ "$choice" -le "${#ALL_SERVICES[@]}" ]; then
        local svc="${ALL_SERVICES[$((choice - 1))]}"
        echo -e "\n  ${CYAN}Rebuilding $svc...${NC}\n"
        compose build "$svc"
    fi
    echo -e "\n  ${GREEN}Build complete.${NC}"
    press_enter
}

action_destroy() {
    echo -e "\n  ${RED}${BOLD}WARNING: This will stop all containers and remove volumes.${NC}"
    read -rp "  Are you sure? (y/N): " confirm
    if [[ "$confirm" =~ ^[Yy]$ ]]; then
        echo -e "\n  ${CYAN}Destroying all services and volumes...${NC}\n"
        compose down -v
        echo -e "\n  ${GREEN}All services and volumes destroyed.${NC}"
    else
        echo -e "  ${DIM}Cancelled.${NC}"
    fi
    press_enter
}

action_switch_mode() {
    if [ "$ACTIVE_COMPOSE" = "$COMPOSE_FILE" ]; then
        if [ -f "$COMPOSE_LOCAL" ]; then
            ACTIVE_COMPOSE="$COMPOSE_LOCAL"
            echo -e "\n  ${GREEN}Switched to local dev mode.${NC}"
        else
            echo -e "\n  ${RED}No local compose file found.${NC}"
        fi
    else
        ACTIVE_COMPOSE="$COMPOSE_FILE"
        echo -e "\n  ${GREEN}Switched to production mode.${NC}"
    fi
    press_enter
}

action_setup() {
    echo -e "\n  ${CYAN}Running project setup...${NC}\n"
    bash "$SCRIPT_DIR/src/setup.sh"
    press_enter
}

# ── TUI Helpers ──────────────────────────────────────────────────────────────

press_enter() {
    echo ""
    read -rp "  Press Enter to continue..." _
}

# ── Main Menu ────────────────────────────────────────────────────────────────

main_menu() {
    while true; do
        clear_screen
        draw_header
        show_service_status
        draw_separator
        echo -e "  ${BOLD}${WHITE}Actions${NC}\n"
        echo -e "    ${WHITE} 1)${NC} Start all services"
        echo -e "    ${WHITE} 2)${NC} Stop all services"
        echo -e "    ${WHITE} 3)${NC} Restart all services"
        echo -e ""
        echo -e "    ${WHITE} 4)${NC} Start infrastructure only  ${DIM}(db, redis, mq, minio, proxy)${NC}"
        echo -e "    ${WHITE} 5)${NC} Start API & workers         ${DIM}(api, worker, beat, migrator)${NC}"
        echo -e "    ${WHITE} 6)${NC} Start frontend apps          ${DIM}(web, admin, space, live)${NC}"
        echo -e ""
        echo -e "    ${WHITE} 7)${NC} Start a single service"
        echo -e "    ${WHITE} 8)${NC} Stop a single service"
        echo -e "    ${WHITE} 9)${NC} View logs"
        echo -e "    ${WHITE}10)${NC} Rebuild service(s)"
        echo -e ""
        echo -e "    ${WHITE}11)${NC} Switch mode ${DIM}(production ↔ local dev)${NC}"
        echo -e "    ${WHITE}12)${NC} Run initial setup"
        echo -e "    ${WHITE}13)${NC} Destroy all ${DIM}(stop + remove volumes)${NC}"
        echo -e ""
        echo -e "    ${WHITE} q)${NC} Quit"
        echo ""
        draw_separator
        echo ""
        read -rp "  Select an option: " choice

        case "$choice" in
            1)  action_start_all ;;
            2)  action_stop_all ;;
            3)  action_restart_all ;;
            4)  action_start_infra ;;
            5)  action_start_api ;;
            6)  action_start_apps ;;
            7)  action_start_service ;;
            8)  action_stop_service ;;
            9)  action_logs ;;
            10) action_rebuild ;;
            11) action_switch_mode ;;
            12) action_setup ;;
            13) action_destroy ;;
            q|Q) echo -e "\n  ${DIM}Goodbye.${NC}\n"; exit 0 ;;
            *)  echo -e "\n  ${RED}Invalid option.${NC}"; press_enter ;;
        esac
    done
}

# ── Entrypoint ───────────────────────────────────────────────────────────────

detect_compose
select_compose_file
main_menu
