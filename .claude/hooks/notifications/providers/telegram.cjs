/**
 * Telegram notification provider
 * Ported from telegram_notify.sh - uses Telegram Bot API
 */
'use strict';

const path = require('path');
const { send } = require('../lib/sender.cjs');

/**
 * Format timestamp as YYYY-MM-DD HH:MM:SS
 * @returns {string}
 */
function getTimestamp() {
  const now = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())} ` +
         `${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
}

/**
 * Format message based on hook event type
 * Matches bash script output format exactly
 * @param {Object} input - Hook input with snake_case fields
 * @returns {string} Markdown-formatted message
 */
function formatMessage(input) {
  const hookType = input.hook_event_name || 'unknown';
  const projectDir = input.cwd || '';
  const sessionId = input.session_id || '';
  const projectName = projectDir ? path.basename(projectDir) : 'unknown';
  const timestamp = getTimestamp();
  const sessionDisplay = sessionId ? `${sessionId.slice(0, 8)}...` : 'N/A';

  switch (hookType) {
    case 'Stop':
      return `🚀 *Project Task Completed*

📅 *Time:* ${timestamp}
📁 *Project:* ${projectName}
🆔 *Session:* ${sessionDisplay}

📍 *Location:* \`${projectDir}\``;

    case 'SubagentStop': {
      const agentType = input.agent_type || 'unknown';
      return `🤖 *Project Subagent Completed*

📅 *Time:* ${timestamp}
📁 *Project:* ${projectName}
🔧 *Agent Type:* ${agentType}
🆔 *Session:* ${sessionDisplay}

Specialized agent completed its task.

📍 *Location:* \`${projectDir}\``;
    }

    case 'AskUserPrompt':
      return `💬 *User Input Needed*

📅 *Time:* ${timestamp}
📁 *Project:* ${projectName}
🆔 *Session:* ${sessionDisplay}

Claude is waiting for your input.

📍 *Location:* \`${projectDir}\``;

    default:
      return `📝 *Project Code Event*

📅 *Time:* ${timestamp}
📁 *Project:* ${projectName}
📋 *Event:* ${hookType}
🆔 *Session:* ${sessionDisplay}

📍 *Location:* \`${projectDir}\``;
  }
}

module.exports = {
  name: 'telegram',

  /**
   * Check if Telegram provider is enabled
   * @param {Object} env - Environment variables
   * @returns {boolean}
   */
  isEnabled: (env) => !!(env.TELEGRAM_BOT_TOKEN && env.TELEGRAM_CHAT_ID),

  /**
   * Send notification to Telegram
   * @param {Object} input - Hook input data (snake_case fields)
   * @param {Object} env - Environment variables
   * @returns {Promise<{success: boolean, error?: string, throttled?: boolean}>}
   */
  send: async (input, env) => {
    const message = formatMessage(input);
    const url = `https://api.telegram.org/bot${env.TELEGRAM_BOT_TOKEN}/sendMessage`;

    return send('telegram', url, {
      chat_id: env.TELEGRAM_CHAT_ID,
      text: message,
      parse_mode: 'Markdown',
      disable_web_page_preview: true
    });
  }
};
