# Telegram Notification Hook Setup

Get Telegram notifications when Claude Code sessions complete.

## Quick Start

### 1. Set Environment Variables

Add to `~/.claude/.env` (global) or `.claude/.env` (project):

```env
TELEGRAM_BOT_TOKEN=your_bot_token
TELEGRAM_CHAT_ID=your_chat_id
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

Telegram notifications are sent via `notify.cjs` + `providers/telegram.cjs`. The bash script (`telegram_notify.sh`) has been **removed** — only the CJS approach is supported.

## Features

- Automatic notifications on session completion
- Subagent completion tracking
- Tool usage statistics
- File modification tracking
- Rich Markdown formatting
- Real-time session monitoring

## Setup Instructions

### 1. Create Telegram Bot

1. Open Telegram and search for **@BotFather**
2. Send `/newbot` command
3. Follow the prompts:
   ```
   BotFather: Alright, a new bot. How are we going to call it?
   You: Claude Code Notifier

   BotFather: Good. Now let's choose a username for your bot.
   You: claudecode_notifier_bot
   ```
4. BotFather will respond with your bot token:
   ```
   Done! Congratulations on your new bot...
   Use this token to access the HTTP API:
   123456789:ABCdefGHIjklMNOpqrsTUVwxyz
   ```
5. **Copy and save the bot token** (format: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)

### 2. Get Chat ID

You need a chat ID to specify where notifications should be sent.

#### Option A: Direct Message (Personal Notifications)

1. Search for your bot in Telegram (use the username you created)
2. Click **"Start"** or send any message to your bot
3. Open this URL in your browser (replace `<YOUR_BOT_TOKEN>`):
   ```
   https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates
   ```
4. Look for the `"chat"` object in the JSON response:
   ```json
   {
     "ok": true,
     "result": [{
       "update_id": 123456789,
       "message": {
         "chat": {
           "id": 987654321,
           "first_name": "Your Name",
           "type": "private"
         }
       }
     }]
   }
   ```
5. Copy the chat ID (e.g., `987654321`)

#### Option B: Group Chat (Team Notifications)

1. Create a new Telegram group or use existing one
2. Add your bot to the group:
   - Click group name → "Add Members"
   - Search for your bot username
   - Add the bot
3. Send a message in the group mentioning the bot:
   ```
   @your_bot_username Hello!
   ```
4. Open this URL in your browser:
   ```
   https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates
   ```
5. Look for the `"chat"` object with `"type": "group"` or `"type": "supergroup"`:
   ```json
   {
     "ok": true,
     "result": [{
       "message": {
         "chat": {
           "id": -100123456789,
           "title": "Dev Team",
           "type": "supergroup"
         }
       }
     }]
   }
   ```
6. Copy the chat ID (negative number for groups, e.g., `-100123456789`)

**Quick Command to Get Chat ID:**
```bash
curl -s "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates" | jq '.result[-1].message.chat.id'
```

### 3. Configure Environment Variables

Environment variables are loaded with this priority (highest to lowest):
1. **process.env** - System/shell environment variables
2. **.claude/.env** - Project-level Claude configuration
3. **.claude/hooks/.env** - Hook-specific configuration

Choose one configuration method:

#### Option A: Global Configuration (All Projects)

Best for personal use across multiple projects.

Add to your shell profile (`~/.bash_profile`, `~/.bashrc`, or `~/.zshrc`):

```bash
export TELEGRAM_BOT_TOKEN="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
export TELEGRAM_CHAT_ID="987654321"
```

**Reload shell:**
```bash
source ~/.bash_profile  # or ~/.bashrc or ~/.zshrc
```

**Verify:**
```bash
echo $TELEGRAM_BOT_TOKEN
echo $TELEGRAM_CHAT_ID
```

#### Option B: Project Root `.env` (Recommended)

Best for team projects or different notification channels per project.

Create `.env` file in project root:

```bash
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHAT_ID=987654321
```

**Secure the file:**
```bash
# Add to .gitignore
echo ".env" >> .gitignore
echo ".env.*" >> .gitignore
```

#### Option C: `.claude/.env` (Project-Level Override)

For project-specific Claude configuration:

```bash
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHAT_ID=987654321
```

#### Option D: `.claude/hooks/.env` (Hook-Specific)

For hook-only configuration:

```bash
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHAT_ID=987654321
```

See `.env.example` files in each location for templates.

### 4. Configure Claude Code Hook

Hooks are configured in `.claude/settings.local.json`:

```json
{
  "hooks": {
    "Stop": [{
      "hooks": [{
        "type": "command",
        "command": "node ${CLAUDE_PROJECT_DIR}/.claude/hooks/notifications/notify.cjs"
      }]
    }],
    "SubagentStop": [{
      "hooks": [{
        "type": "command",
        "command": "node ${CLAUDE_PROJECT_DIR}/.claude/hooks/notifications/notify.cjs"
      }]
    }]
  }
}
```

**Configuration Options:**

- `"Stop"`: Triggers when main Claude Code session ends
- `"SubagentStop"`: Triggers when specialized subagents complete (planner, tester, etc.)
- `${CLAUDE_PROJECT_DIR}`: Environment variable for project directory path

### 5. Verify Setup

Test the hook with a mock event:

```bash
echo '{
  "hook_event_name": "Stop",
  "cwd": "'"$(pwd)"'",
  "session_id": "test-session-123"
}' | node .claude/hooks/notifications/notify.cjs
```

> **Note:** Claude Code hooks use snake_case field names. The `Stop` hook does not include tool usage data.

Check your Telegram chat for the test notification.

## Hook Triggers

### Stop Event

**Triggered when:** Main Claude Code session ends (user stops Claude or task completes)

**Includes:**
- Total tool operations count
- Tool usage breakdown (with counts)
- List of modified files
- Session timestamp
- Session ID
- Project name and location

**Example notification:**
```
🚀 Project Task Completed

📅 Time: 2025-10-22 14:30:45
📁 Project: claudekit-engineer
🔧 Total Operations: 15
🆔 Session: abc12345...

Tools Used:
```
   5 Edit
   3 Read
   2 Bash
   2 Write
   1 TodoWrite
   1 Grep
   1 Glob
```

Files Modified:
• src/auth/service.ts
• src/utils/validation.ts
• tests/auth.test.ts

📍 Location: `/Users/user/projects/claudekit-engineer`
```

### SubagentStop Event

**Triggered when:** Specialized subagent completes its task

**Subagent Types:**
- `planner` - Implementation planning
- `tester` - Test execution and analysis
- `debugger` - Log collection and debugging
- `code-reviewer` - Code quality review
- `docs-manager` - Documentation updates
- `git-manager` - Git operations
- `project-manager` - Progress tracking

**Example notification:**
```
🤖 Project Subagent Completed

📅 Time: 2025-10-22 14:35:20
📁 Project: claudekit-engineer
🔧 Agent Type: planner
🆔 Session: abc12345...

Specialized agent completed its task.

📍 Location: `/Users/user/projects/claudekit-engineer`
```

## Notification Examples

### Basic Implementation Task
```
🚀 Project Task Completed

📅 Time: 2025-10-22 10:15:30
📁 Project: api-server
🔧 Total Operations: 8
🆔 Session: a1b2c3d4...

Tools Used:
```
   3 Edit
   2 Read
   2 Bash
   1 Write
```

Files Modified:
• src/routes/auth.ts
• src/middleware/jwt.ts

📍 Location: `/Users/user/projects/api-server`
```

### Complex Feature Development
```
🚀 Project Task Completed

📅 Time: 2025-10-22 15:45:22
📁 Project: frontend-app
🔧 Total Operations: 24
🆔 Session: e5f6g7h8...

Tools Used:
```
  12 Edit
   6 Read
   3 Write
   2 Bash
   1 TodoWrite
```

Files Modified:
• components/Auth/LoginForm.tsx
• components/Auth/SignupForm.tsx
• hooks/useAuth.ts
• pages/login.tsx
• pages/signup.tsx
• styles/auth.module.css
• tests/components/LoginForm.test.tsx

📍 Location: `/Users/user/projects/frontend-app`
```

### Subagent Completion
```
🤖 Project Subagent Completed

📅 Time: 2025-10-22 11:20:15
📁 Project: microservice
🔧 Agent Type: tester
🆔 Session: i9j0k1l2...

Specialized agent completed its task.

📍 Location: `/Users/user/projects/microservice`
```

## Troubleshooting

### "TELEGRAM_BOT_TOKEN environment variable not set"

**Cause:** Environment variable not configured or not loaded

**Solutions:**

1. **Verify environment variables:**
   ```bash
   echo $TELEGRAM_BOT_TOKEN
   echo $TELEGRAM_CHAT_ID
   ```

2. **If using global config, reload shell:**
   ```bash
   source ~/.bash_profile  # or ~/.bashrc or ~/.zshrc
   ```

3. **If using project `.env`, verify file exists:**
   ```bash
   ls -la .env
   cat .env | grep TELEGRAM_
   ```

4. **Check for typos in variable names:**
   - Must be `TELEGRAM_BOT_TOKEN` (not `TELEGRAM_TOKEN` or `BOT_TOKEN`)
   - Must be `TELEGRAM_CHAT_ID` (not `TELEGRAM_ID` or `CHAT_ID`)

### "TELEGRAM_CHAT_ID environment variable not set"

**Cause:** Chat ID not configured

**Solutions:**

1. Follow "Get Chat ID" steps in setup section
2. Verify chat ID is a number without quotes:
   ```bash
   # Correct
   export TELEGRAM_CHAT_ID="123456789"

   # Incorrect
   export TELEGRAM_CHAT_ID='"123456789"'
   ```

### No Messages Received in Telegram

**Cause:** Bot not started, chat ID incorrect, or bot blocked

**Solutions:**

1. **Ensure bot conversation started:**
   - For DM: Send any message to bot first
   - For group: Add bot and send message mentioning it

2. **Verify bot token is correct:**
   ```bash
   curl -s "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/getMe"
   ```
   Should return bot info. If error, token is invalid.

3. **Verify chat ID is correct:**
   ```bash
   curl -s "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
     -d "chat_id=$TELEGRAM_CHAT_ID" \
     -d "text=Test message"
   ```

4. **Check if bot is blocked:**
   - In Telegram, find bot conversation
   - Look for "Restart" button (indicates bot was blocked)
   - Click "Restart" to unblock

5. **For groups, verify bot is member:**
   - Open group → Members
   - Search for your bot username
   - If not found, re-add the bot

### "jq: command not found"

**Cause:** `jq` JSON processor not installed

**Solutions:**

**macOS:**
```bash
brew install jq
```

**Ubuntu/Debian:**
```bash
sudo apt-get update
sudo apt-get install jq
```

**CentOS/RHEL:**
```bash
sudo yum install jq
```

**Verify installation:**
```bash
jq --version
```

### Hook Not Triggering

**Cause:** Claude Code hook configuration incorrect

**Solutions:**

1. **Verify `.claude/settings.local.json` exists and is valid JSON:**
   ```bash
   cat .claude/settings.local.json | node -e "process.stdin.resume();let d='';process.stdin.on('data',c=>d+=c);process.stdin.on('end',()=>console.log(JSON.parse(d)))"
   ```

2. **Check hook configuration references `notify.cjs`** (not the old bash script)

3. **Test hook manually (see "Verify Setup" section)**

### Messages Showing Escaped Markdown

**Cause:** Telegram parse mode or escaping issues

**Solutions:**

1. **Verify Telegram bot supports Markdown:**
   - All bots support basic Markdown

2. **Test with simple message via curl:**
   ```bash
   curl -s "https://api.telegram.org/bot$TELEGRAM_BOT_TOKEN/sendMessage" \
     -H "Content-Type: application/json" \
     -d "{\"chat_id\": \"$TELEGRAM_CHAT_ID\", \"text\": \"*bold* _italic_\", \"parse_mode\": \"Markdown\"}"
   ```

## Advanced Configuration

### Multiple Notification Channels

Send notifications to different chats based on event type:

**.env file:**
```bash
TELEGRAM_BOT_TOKEN=123456789:ABCdefGHIjklMNOpqrsTUVwxyz
TELEGRAM_CHAT_ID=123456789          # Default
TELEGRAM_CHAT_ID_SUCCESS=123456789  # Success notifications
TELEGRAM_CHAT_ID_ERROR=987654321    # Error notifications
```

**Set per-event env vars in `.env`:**
```bash
TELEGRAM_CHAT_ID_SUCCESS=123456789  # Success notifications
TELEGRAM_CHAT_ID_ERROR=987654321    # Error notifications
```

### Filtering Notifications

Filtering logic lives in `providers/telegram.cjs`. Edit that file to add custom filtering rules (e.g., skip small operations, off-hours throttling).

### Different Bots for Different Projects

Use different bots per project for better organization:

**Project A `.env`:**
```bash
TELEGRAM_BOT_TOKEN=111111111:AAA_ProjectA_Bot_Token
TELEGRAM_CHAT_ID=123456789
```

**Project B `.env`:**
```bash
TELEGRAM_BOT_TOKEN=222222222:BBB_ProjectB_Bot_Token
TELEGRAM_CHAT_ID=987654321
```

### Testing with Mock Data

Test different hook scenarios:

**Stop event:**
```bash
echo '{
  "hook_event_name": "Stop",
  "cwd": "'"$(pwd)"'",
  "session_id": "test-123"
}' | node .claude/hooks/notifications/notify.cjs
```

**SubagentStop event:**
```bash
echo '{
  "hook_event_name": "SubagentStop",
  "cwd": "'"$(pwd)"'",
  "session_id": "test-456",
  "agent_type": "planner"
}' | node .claude/hooks/notifications/notify.cjs
```

> **Note:** Claude Code hooks use snake_case field names per the official API.

## Security Best Practices

1. **Never commit bot tokens:**
   ```bash
   # .gitignore
   .env
   .env.*
   .env.local
   .env.production
   ```

2. **Use environment variables:** Never hardcode tokens in scripts

3. **Rotate bot tokens regularly:**
   - Go to @BotFather in Telegram
   - Send `/mybots`
   - Select your bot → API Token → Revoke current token
   - Generate new token
   - Update configuration

4. **Limit bot permissions:**
   - Bots only need send message permission
   - Don't make bot admin in groups unless necessary

5. **Use separate bots per environment:**
   ```bash
   # Development bot
   TELEGRAM_BOT_TOKEN_DEV=111111111:DEV_Token

   # Production bot
   TELEGRAM_BOT_TOKEN_PROD=222222222:PROD_Token
   ```

6. **Monitor bot activity:**
   - Check @BotFather for bot statistics
   - Review message history regularly
   - Look for unexpected activity

7. **Secure chat IDs:**
   - Don't share chat IDs publicly
   - Use private groups for sensitive notifications
   - Remove bot from groups when no longer needed

## Reference

**Implementation:** `.claude/hooks/notifications/notify.cjs` + `providers/telegram.cjs`

**Configuration:** `.claude/settings.local.json`

**Environment Variables:**
- `TELEGRAM_BOT_TOKEN` (required)
- `TELEGRAM_CHAT_ID` (required)

**Supported Events:**
- `Stop` - Main session completion
- `SubagentStop` - Subagent completion

**Dependencies:** Node.js only (no `bash`, `curl`, or `jq` required)

**Telegram Bot API:** https://core.telegram.org/bots/api

**Claude Code Hooks:** https://docs.claude.com/claude-code/hooks

---

**Last Updated:** 2025-12-21
