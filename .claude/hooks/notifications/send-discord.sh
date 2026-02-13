#!/bin/bash

# Usage: ./send-discord.sh 'Your message here'
# Note: Remember to escape the string

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

message="$1"
    
if [[ -z "$DISCORD_WEBHOOK_URL" ]]; then
    echo "⚠️  Discord notification skipped: DISCORD_WEBHOOK_URL not set"
    exit 1
fi

# Prepare message for Discord (Discord markdown supports \n)
discord_message="$message"

# Discord embeds for richer formatting
payload=$(cat <<EOF
{
"embeds": [{
    "title": "🤖 Claude Code Session Complete",
    "description": "$discord_message",
    "color": 5763719,
    "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%S.000Z)",
    "footer": {
        "text": "Project Name • $(basename "$(pwd)")"
    },
    "fields": [
        {
            "name": "⏰ Session Time",
            "value": "$(date '+%H:%M:%S')",
            "inline": true
        },
        {
            "name": "📂 Project",
            "value": "$(basename "$(pwd)")",
            "inline": true
        }
    ]
}]
}
EOF
)

curl -s -X POST "$DISCORD_WEBHOOK_URL" \
    -H "Content-Type: application/json" \
    -d "$payload" >/dev/null 2>&1

if [[ $? -eq 0 ]]; then
    echo "✅ Discord notification sent"
else
    echo "❌ Failed to send Discord notification"
    exit 1
fi