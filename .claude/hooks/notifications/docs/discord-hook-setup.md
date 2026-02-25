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

## Legacy Bash Scripts (Deprecated)

The original bash scripts (`discord_notify.sh`, `telegram_notify.sh`) are **deprecated** due to jq PATH issues in Claude Code's subprocess environment. Use `notify.cjs` instead.

---

## Overview

The Discord hook (`send-discord.sh`) sends rich embedded messages to a Discord channel when Claude Code completes implementation tasks. Messages include session time, project info, and task summaries.

## Features

- Rich embedded messages with custom formatting
- Session timestamp tracking
- Project name and location display
- Custom message content
- Automatic .env file loading

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

### 4. Make Script Executable

```bash
chmod +x .claude/hooks/send-discord.sh
```

### 5. Verify Setup

Test the hook with a simple message:

```bash
./.claude/hooks/send-discord.sh 'Test notification from Claude Code'
```

**Expected output:**
```
Loading .env file...
✅ Environment loaded, DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/12...
✅ Discord notification sent
```

Check your Discord channel for the test message.

## Usage

### Manual Invocation

Send a notification with a custom message:

```bash
./.claude/hooks/send-discord.sh 'Task completed: Added user authentication feature'
```

**With multi-line messages:**
```bash
./.claude/hooks/send-discord.sh 'Implementation Complete

✅ Added user authentication
✅ Created login/signup forms
✅ Integrated JWT tokens
✅ All tests passing'
```

**Important:** Escape special characters:
```bash
./.claude/hooks/send-discord.sh 'Fixed bug in user'\''s profile page'
```

### Automated Usage (Claude Code Workflow)

Claude automatically calls this script when completing implementations. This is configured in `.claude/rules/development-rules.md`:

```markdown
- When you finish the implementation, send a full summary report to Discord channel
  with `./.claude/hooks/send-discord.sh 'Your message here'` script
```

Claude will automatically:
1. Complete the implementation task
2. Generate a summary report
3. Send it to Discord using this hook

### Integration Examples

**From bash scripts:**
```bash
#!/bin/bash
# deploy.sh

if npm run build && npm run test; then
    ./.claude/hooks/send-discord.sh '✅ Build and tests passed - ready to deploy'
else
    ./.claude/hooks/send-discord.sh '❌ Build or tests failed - deployment blocked'
fi
```

**From npm scripts (package.json):**
```json
{
  "scripts": {
    "deploy": "npm run build && npm run test && ./.claude/hooks/send-discord.sh '✅ Deployment successful'",
    "notify": "./.claude/hooks/send-discord.sh"
  }
}
```

## Message Format

Discord messages are sent as rich embeds with the following structure:

**Embed Components:**
- **Title:** 🤖 Claude Code Session Complete
- **Description:** Your custom message content
- **Color:** Purple (#57F287)
- **Timestamp:** Automatic UTC timestamp
- **Footer:** Project name and directory

**Embedded Fields:**
- ⏰ **Session Time:** Local time when notification sent
- 📂 **Project:** Current project directory name

**Example Discord Message:**
```
╔═══════════════════════════════╗
║ 🤖 Claude Code Session Complete
╠═══════════════════════════════╣
║ Implementation Complete
║
║ ✅ Added user authentication
║ ✅ Created login/signup forms
║ ✅ Integrated JWT tokens
║ ✅ All tests passing
╠═══════════════════════════════╣
║ ⏰ Session Time: 14:30:45
║ 📂 Project: claudekit-engineer
╠═══════════════════════════════╣
║ Project Name • claudekit-engineer
║ Today at 14:30
╚═══════════════════════════════╝
```

## Troubleshooting

### "DISCORD_WEBHOOK_URL not set"

**Cause:** Environment variable not loaded or `.env` file missing

**Solutions:**
1. Verify `.env` file exists in project root
2. Check `.env` contains `DISCORD_WEBHOOK_URL=...` line
3. Ensure no extra spaces around `=` sign
4. Verify `.env` file has read permissions

```bash
# Check if .env exists
ls -la .env

# Verify content
cat .env | grep DISCORD_WEBHOOK_URL
```

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

4. **Verify webhook permissions:**
   - Webhook must have permission to post in target channel
   - Check channel permissions in Discord

### Messages Not Appearing

**Cause:** Channel visibility or webhook configuration issues

**Solutions:**
1. Verify you have access to the target channel
2. Check channel is not muted or hidden
3. Confirm webhook is assigned to correct channel
4. Try sending to different channel

### Special Characters Breaking Messages

**Cause:** Unescaped quotes or shell special characters

**Solutions:**

**Use single quotes for outer string:**
```bash
./.claude/hooks/send-discord.sh 'Message with "double quotes" works fine'
```

**Escape single quotes inside single-quoted strings:**
```bash
./.claude/hooks/send-discord.sh 'User'\''s profile updated'
```

**Use double quotes and escape:**
```bash
./.claude/hooks/send-discord.sh "Message with \"escaped quotes\""
```

**For complex messages, use heredoc:**
```bash
./.claude/hooks/send-discord.sh "$(cat <<'EOF'
Multi-line message
With special characters: ' " $ `
All work fine here
EOF
)"
```

### Script Permission Denied

**Cause:** Script not executable

**Solution:**
```bash
chmod +x ./.claude/hooks/send-discord.sh
```

## Advanced Configuration

### Multiple Discord Channels

Send different notification types to different channels:

**.env file:**
```bash
DISCORD_WEBHOOK_SUCCESS=https://discord.com/api/webhooks/.../success-channel
DISCORD_WEBHOOK_ERROR=https://discord.com/api/webhooks/.../error-channel
DISCORD_WEBHOOK_INFO=https://discord.com/api/webhooks/.../info-channel
```

**Create wrapper scripts:**
```bash
# send-discord-success.sh
export DISCORD_WEBHOOK_URL="$DISCORD_WEBHOOK_SUCCESS"
./.claude/hooks/send-discord.sh "$1"

# send-discord-error.sh
export DISCORD_WEBHOOK_URL="$DISCORD_WEBHOOK_ERROR"
./.claude/hooks/send-discord.sh "$1"
```

### Custom Embed Colors

Edit `send-discord.sh` to change embed color:

```bash
# Line 33: "color": 5763719
# Change to:
"color": 15158332  # Red
"color": 3066993   # Green
"color": 15844367  # Yellow
"color": 3447003   # Blue
```

### Adding Custom Fields

Edit `send-discord.sh` to add more fields:

```bash
# After line 48, add:
{
    "name": "🔧 Environment",
    "value": "Production",
    "inline": true
},
{
    "name": "🌿 Branch",
    "value": "$(git branch --show-current)",
    "inline": true
}
```

### Conditional Notifications

Only send notifications for specific conditions:

```bash
#!/bin/bash
# deploy.sh

if npm run test; then
    if [[ "$ENVIRONMENT" == "production" ]]; then
        ./.claude/hooks/send-discord.sh '✅ Production deployment successful'
    fi
else
    # Always notify on failures
    ./.claude/hooks/send-discord.sh '❌ Tests failed - deployment aborted'
fi
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

4. **Limit webhook permissions:**
   - Only grant webhook access to necessary channels
   - Use read-only channels for notifications

5. **Monitor webhook usage:**
   - Check Discord audit log regularly
   - Look for unexpected webhook activity

6. **Use separate webhooks per environment:**
   ```bash
   # .env.development
   DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/.../dev-channel

   # .env.production
   DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/.../prod-channel
   ```

## Reference

**Script Location:** `.claude/hooks/send-discord.sh`

**Configuration File:** `.env` (project root)

**Required Environment Variable:** `DISCORD_WEBHOOK_URL`

**Supported Shell:** Bash

**Dependencies:**
- `curl` (pre-installed on macOS/Linux)
- `jq` (optional, for testing)

**Discord API Documentation:** https://discord.com/developers/docs/resources/webhook

**Claude Code Documentation:** https://docs.claude.com/claude-code

---

**Last Updated:** 2025-12-21
