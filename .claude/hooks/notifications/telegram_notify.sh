#!/bin/bash

# ┌─────────────────────────────────────────────────────────────────────────┐
# │ DEPRECATED: This script is no longer maintained                         │
# │                                                                         │
# │ Use notify.cjs instead - zero dependencies, works everywhere:           │
# │   node .claude/hooks/notifications/notify.cjs                           │
# │                                                                         │
# │ In your settings.json:                                                  │
# │   "Stop": [{"matcher": "*", "hooks": [{"type": "command",               │
# │     "command": "node .claude/hooks/notifications/notify.cjs"}]}]        │
# └─────────────────────────────────────────────────────────────────────────┘

echo "⚠️  DEPRECATED: telegram_notify.sh is no longer maintained" >&2
echo "   Use: node .claude/hooks/notifications/notify.cjs" >&2
echo "   See: .claude/hooks/notifications/docs/" >&2
exit 1

# --- LEGACY CODE BELOW (kept for reference) ---

# Load environment variables with priority: process.env > .claude/.env > .claude/hooks/.env
load_env() {
    # 1. Start with lowest priority: .claude/hooks/.env
    if [[ -f "$(dirname "$0")/.env" ]]; then
        set -a
        source "$(dirname "$0")/.env"
        set +a
    fi

    # 2. Override with .claude/.env
    if [[ -f .claude/.env ]]; then
        set -a
        source .claude/.env
        set +a
    fi

    # 3. Process env (already loaded) has highest priority - no action needed
    # Variables already in process.env will not be overwritten by 'source'
}

load_env

# Read JSON input from stdin
INPUT=$(cat)

# Extract relevant information from the hook input
# Note: Claude Code hooks use snake_case field names
HOOK_TYPE=$(echo "$INPUT" | jq -r '.hook_event_name // "unknown"')
PROJECT_DIR=$(echo "$INPUT" | jq -r '.cwd // ""')
TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')
SESSION_ID=$(echo "$INPUT" | jq -r '.session_id // ""')
PROJECT_NAME=$(basename "$PROJECT_DIR")

# Configuration - these will be set via environment variables
TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-}"
TELEGRAM_CHAT_ID="${TELEGRAM_CHAT_ID:-}"

# Validate required environment variables
if [[ -z "$TELEGRAM_BOT_TOKEN" ]]; then
    echo "Error: TELEGRAM_BOT_TOKEN environment variable not set" >&2
    exit 1
fi

if [[ -z "$TELEGRAM_CHAT_ID" ]]; then
    echo "Error: TELEGRAM_CHAT_ID environment variable not set" >&2
    exit 1
fi

# Function to send Telegram message
send_telegram_message() {
    local message="$1"
    local url="https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage"
    
    # Escape special characters for JSON
    local escaped_message=$(echo "$message" | jq -Rs .)
    
    local payload=$(cat <<EOF
{
    "chat_id": "${TELEGRAM_CHAT_ID}",
    "text": ${escaped_message},
    "parse_mode": "Markdown",
    "disable_web_page_preview": true
}
EOF
)
    
    curl -s -X POST \
        -H "Content-Type: application/json" \
        -d "$payload" \
        "$url" > /dev/null
}

# Generate summary based on hook type
# Note: Stop/SubagentStop hooks do not include tool usage data
case "$HOOK_TYPE" in
    "Stop")
        # Build summary message
        MESSAGE="🚀 *Project Task Completed*

📅 *Time:* ${TIMESTAMP}
📁 *Project:* ${PROJECT_NAME}
🆔 *Session:* ${SESSION_ID:0:8}...

📍 *Location:* \`${PROJECT_DIR}\`"
        ;;
        
    "SubagentStop")
        SUBAGENT_TYPE=$(echo "$INPUT" | jq -r '.agent_type // "unknown"')
        MESSAGE="🤖 *Project Subagent Completed*

📅 *Time:* ${TIMESTAMP}
📁 *Project:* ${PROJECT_NAME}
🔧 *Agent Type:* ${SUBAGENT_TYPE}
🆔 *Session:* ${SESSION_ID:0:8}...

Specialized agent completed its task.

📍 *Location:* \`${PROJECT_DIR}\`"
        ;;
        
    *)
        MESSAGE="📝 *Project Code Event*

📅 *Time:* ${TIMESTAMP}
📁 *Project:* ${PROJECT_NAME}
📋 *Event:* ${HOOK_TYPE}
🆔 *Session:* ${SESSION_ID:0:8}...

📍 *Location:* \`${PROJECT_DIR}\`"
        ;;
esac

# Send the notification
send_telegram_message "$MESSAGE"

# Log the notification (optional)
echo "Telegram notification sent for $HOOK_TYPE event in project $PROJECT_NAME" >&2