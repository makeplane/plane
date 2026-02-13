# Claude Code Hooks

This directory contains hooks for Claude Code sessions.

## Hooks Overview

| Hook | Location | Description |
|------|----------|-------------|
| **Notifications** | `notifications/` | Multi-provider notification system (Telegram, Discord, Slack) |
| **Scout Block** | `scout-block.cjs` | Blocks heavy directories (node_modules, .git, etc.) |
| **Privacy Block** | `privacy-block.cjs` | Prevents access to sensitive files |
| **Modularization** | `modularization-hook.js` | Suggests code modularization for large files |
| **Session Init** | `session-init.cjs` | Session startup initialization |
| **Dev Rules** | `dev-rules-reminder.cjs` | Development rules injection |

## Notifications

Unified Node.js notification system with multi-provider support, smart throttling, and zero dependencies.

> **Note:** Notification hooks are NOT enabled by default. Follow the setup guide below to enable them.

### Supported Providers

| Provider | Env Variables Required | Setup Guide |
|----------|----------------------|-------------|
| **Telegram** | `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` | [telegram-hook-setup.md](../notifications/docs/telegram-hook-setup.md) |
| **Discord** | `DISCORD_WEBHOOK_URL` | [discord-hook-setup.md](../notifications/docs/discord-hook-setup.md) |
| **Slack** | `SLACK_WEBHOOK_URL` | [slack-hook-setup.md](../notifications/docs/slack-hook-setup.md) |

### Setup Guide

#### Step 1: Configure Environment Variables

Copy the example and add your credentials:

```bash
cp .claude/hooks/notifications/.env.example ~/.claude/.env
```

Edit `~/.claude/.env`:
```bash
# Telegram (get token from @BotFather, chat_id from getUpdates API)
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHAT_ID=987654321

# Discord (create webhook: Server Settings > Integrations > Webhooks)
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...

# Slack (create app at api.slack.com/apps, enable Incoming Webhooks)
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
```

Only configure the providers you want to use.

#### Step 2: Enable Notification Hooks

Add to your `.claude/settings.json` or `.claude/settings.local.json`:

```json
{
  "hooks": {
    "Stop": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "node .claude/hooks/notifications/notify.cjs"
          }
        ]
      }
    ],
    "SubagentStop": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "node .claude/hooks/notifications/notify.cjs"
          }
        ]
      }
    ],
    "Notification": [
      {
        "matcher": "*",
        "hooks": [
          {
            "type": "command",
            "command": "node .claude/hooks/notifications/notify.cjs"
          }
        ]
      }
    ]
  }
}
```

**Available Hook Events:**
- `Stop` - Main session completion
- `SubagentStop` - Subagent task completion
- `Notification` - Claude notification events (input prompts, etc.)

Choose only the events you want notifications for.

#### Step 3: Test Your Setup

```bash
echo '{"hook_event_name":"Stop","cwd":"'$(pwd)'","session_id":"test123"}' | node .claude/hooks/notifications/notify.cjs
```

Expected output (if Telegram and Discord configured):
```
[env-loader] Loaded: /home/user/.claude/.env
[notify] telegram: sent
[notify] discord: sent
[notify] Summary: 2/2 succeeded
```

### Features

- **Smart Throttling**: 5-minute quiet period after errors to prevent spam
- **Env Cascade**: `process.env` > `~/.claude/.env` > `.claude/.env`
- **Zero Dependencies**: Uses native Node.js fetch (Node 18+)
- **Cross-Platform**: Uses `path.basename()` for Windows compatibility
- **Non-Blocking**: Always exits 0 to never block Claude
- **Selective Providers**: Only configured providers receive notifications

### Architecture

```
notifications/
├── notify.cjs           # Main router - reads stdin, routes to providers
├── .env.example         # Environment template
├── docs/                # Provider setup guides
├── lib/
│   ├── env-loader.cjs   # Env cascade loader
│   └── sender.cjs       # HTTP sender with throttling
└── providers/
    ├── telegram.cjs     # Telegram Bot API
    ├── discord.cjs      # Discord webhooks with embeds
    └── slack.cjs        # Slack Block Kit format
```

## Scout Block Hook

Cross-platform hook blocking heavy directories to improve Claude performance.

**Blocked Patterns** (configured in `.claude/.ckignore`):
- `node_modules`, `__pycache__`, `.git`, `dist`, `build`

**Testing:**
```bash
echo '{"tool_input":{"command":"ls node_modules"}}' | node .claude/hooks/scout-block.cjs
```

## Security

1. **Never commit tokens** - Add `.env` to `.gitignore`
2. **Use environment variables** - Never hardcode credentials
3. **Rotate tokens regularly** - Regenerate periodically

## Troubleshooting

**No notifications received:**
- Verify env vars are set: `echo $TELEGRAM_BOT_TOKEN`
- Check throttle state: `cat /tmp/ck-noti-throttle.json`
- Test manually with echo pipe above

**Provider throttled:**
- Wait 5 minutes or delete `/tmp/ck-noti-throttle.json`

**Hooks not triggering:**
- Verify hooks are added to `.claude/settings.json`
- Check Claude Code is using correct settings file

---

**Last Updated:** 2025-12-21
