# Discord Notification Hook Setup

Get Discord notifications when Claude Code sessions complete.

## Quick Start

### 1. Set Environment Variable

Add to `~/.claude/.env` (global) or `.claude/.env` (project):

```env
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/xxx/yyy
```

### 2. Add Hook to settings.json

Add to your `.claude/settings.json` (project) or `~/.claude/settings.json` (global):

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
    ]
  }
}
```

### 3. Test

```bash
echo '{"hook_event_name":"Stop","cwd":"'"$(pwd)"'","session_id":"test123"}' | \
  node .claude/hooks/notifications/notify.cjs
```

---

## Overview

Discord notifications are sent via `notify.cjs` + `providers/discord.cjs`. The bash scripts (`discord_notify.sh`, `send-discord.sh`) have been **removed** — only the CJS approach is supported.

## Features

- Rich embedded messages with custom formatting
- Session timestamp tracking
- Project name and location display
- Automatic .env file loading
- No external dependencies (`jq`, `curl` not required)

## Setup Instructions

### 1. Create Discord Webhook

1. Open your Discord server
2. Navigate to **Server Settings** → **Integrations** → **Webhooks**
3. Click **"New Webhook"**
4. Configure webhook:
   - **Name:** `Claude Code Bot` (or your preference)
   - **Channel:** Select your target notification channel
5. Click **"Copy Webhook URL"**
   - Format: `https://discord.com/api/webhooks/WEBHOOK_ID/WEBHOOK_TOKEN`

### 2. Configure Environment Variables

Environment variables are loaded with this priority (highest to lowest):
1. **process.env** - System/shell environment variables
2. **.claude/.env** - Project-level Claude configuration
3. **.claude/hooks/.env** - Hook-specific configuration

**Option A: Project Root `.env`** (recommended):
```bash
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_WEBHOOK_TOKEN
```

**Option B: `.claude/.env`** (project-level override):
```bash
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_WEBHOOK_TOKEN
```

**Option C: `.claude/hooks/.env`** (hook-specific):
```bash
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/YOUR_WEBHOOK_ID/YOUR_WEBHOOK_TOKEN
```

**Example:**
```bash
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/1234567890/AbCdEfGhIjKlMnOpQrStUvWxYz
```

See `.env.example` files for templates.

### 3. Secure Your Configuration

Add `.env` to `.gitignore` to prevent committing webhook URLs:

```bash
# .gitignore
.env
.env.*
```

## Troubleshooting

### "DISCORD_WEBHOOK_URL not set"

**Cause:** Environment variable not loaded or `.env` file missing

**Solutions:**
1. Verify `.env` file exists in project root
2. Check `.env` contains `DISCORD_WEBHOOK_URL=...` line
3. Ensure no extra spaces around `=` sign
4. Verify `.env` file has read permissions

### "Failed to send Discord notification"

**Cause:** Network error, invalid webhook, or webhook deleted

**Solutions:**

1. **Verify webhook URL is active:**
   - Open Discord → Server Settings → Integrations → Webhooks
   - Confirm webhook still exists
   - If deleted, create new webhook and update `.env`

2. **Test webhook directly:**
   ```bash
   curl -X POST "YOUR_WEBHOOK_URL" \
     -H "Content-Type: application/json" \
     -d '{"content": "Test message"}'
   ```

3. **Check network connectivity:**
   ```bash
   ping discord.com
   ```

## Security Best Practices

1. **Never commit webhook URLs:**
   ```bash
   # .gitignore
   .env
   .env.*
   .env.local
   ```

2. **Use environment variables:** Never hardcode webhooks in scripts

3. **Rotate webhooks regularly:**
   - Delete old webhook in Discord
   - Create new webhook
   - Update `.env` file

4. **Use separate webhooks per environment:**
   ```bash
   # .env.development
   DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/.../dev-channel

   # .env.production
   DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/.../prod-channel
   ```

## Reference

**Implementation:** `.claude/hooks/notifications/notify.cjs` + `providers/discord.cjs`

**Configuration File:** `.env` (project root)

**Required Environment Variable:** `DISCORD_WEBHOOK_URL`

**Dependencies:** Node.js only (no `jq` or `curl` required)

**Discord API Documentation:** https://discord.com/developers/docs/resources/webhook

**Claude Code Documentation:** https://docs.claude.com/claude-code

---

**Last Updated:** 2025-12-21
