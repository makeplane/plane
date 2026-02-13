/**
 * Discord notification provider
 * Sends rich embed messages to Discord webhooks
 */
'use strict';

const path = require('path');
const { send } = require('../lib/sender.cjs');

// Discord embed colors
const COLORS = {
  Stop: 5763719,         // Green
  SubagentStop: 3447003, // Blue
  AskUserPrompt: 15844367, // Yellow
  default: 10070709,     // Gray
};

/**
 * Get project name from cwd path
 * @param {string} cwd - Working directory path
 * @returns {string} Project name
 */
function getProjectName(cwd) {
  if (!cwd) return 'Unknown';
  return path.basename(cwd) || 'Unknown';
}

/**
 * Format timestamp for display
 * @returns {string} Formatted timestamp
 */
function formatTimestamp() {
  const now = new Date();
  return now.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
}

/**
 * Truncate session ID for display
 * @param {string} sessionId - Full session ID
 * @returns {string} Truncated session ID
 */
function truncateSessionId(sessionId) {
  if (!sessionId) return 'N/A';
  return sessionId.length > 8 ? `${sessionId.slice(0, 8)}...` : sessionId;
}

/**
 * Build embed for Stop event
 * @param {Object} input - Hook input
 * @returns {Object} Discord embed
 */
function buildStopEmbed(input) {
  const cwd = input.cwd || '';
  const sessionId = input.session_id || '';
  const projectName = getProjectName(cwd);

  return {
    title: 'Claude Code Session Complete',
    description: 'Session completed successfully',
    color: COLORS.Stop,
    timestamp: new Date().toISOString(),
    footer: { text: `Project • ${projectName}` },
    fields: [
      { name: '⏰ Time', value: formatTimestamp(), inline: true },
      { name: '🆔 Session', value: `\`${truncateSessionId(sessionId)}\``, inline: true },
      { name: '📍 Location', value: `\`${cwd || 'Unknown'}\``, inline: false },
    ],
  };
}

/**
 * Build embed for SubagentStop event
 * @param {Object} input - Hook input
 * @returns {Object} Discord embed
 */
function buildSubagentStopEmbed(input) {
  const cwd = input.cwd || '';
  const sessionId = input.session_id || '';
  const agentType = input.agent_type || 'unknown';
  const projectName = getProjectName(cwd);

  return {
    title: 'Claude Code Subagent Complete',
    description: 'Specialized agent completed its task',
    color: COLORS.SubagentStop,
    timestamp: new Date().toISOString(),
    footer: { text: `Project • ${projectName}` },
    fields: [
      { name: '⏰ Time', value: formatTimestamp(), inline: true },
      { name: '🔧 Agent Type', value: agentType, inline: true },
      { name: '🆔 Session', value: `\`${truncateSessionId(sessionId)}\``, inline: true },
      { name: '📍 Location', value: `\`${cwd || 'Unknown'}\``, inline: false },
    ],
  };
}

/**
 * Build embed for AskUserPrompt event
 * @param {Object} input - Hook input
 * @returns {Object} Discord embed
 */
function buildAskUserPromptEmbed(input) {
  const cwd = input.cwd || '';
  const sessionId = input.session_id || '';
  const projectName = getProjectName(cwd);

  return {
    title: 'Claude Code Needs Input',
    description: 'Claude is waiting for user input',
    color: COLORS.AskUserPrompt,
    timestamp: new Date().toISOString(),
    footer: { text: `Project • ${projectName}` },
    fields: [
      { name: '⏰ Time', value: formatTimestamp(), inline: true },
      { name: '🆔 Session', value: `\`${truncateSessionId(sessionId)}\``, inline: true },
      { name: '📍 Location', value: `\`${cwd || 'Unknown'}\``, inline: false },
    ],
  };
}

/**
 * Build embed for generic/unknown events
 * @param {Object} input - Hook input
 * @returns {Object} Discord embed
 */
function buildDefaultEmbed(input) {
  const hookType = input.hook_event_name || 'unknown';
  const cwd = input.cwd || '';
  const sessionId = input.session_id || '';
  const projectName = getProjectName(cwd);

  return {
    title: 'Claude Code Event',
    description: 'Claude Code event triggered',
    color: COLORS.default,
    timestamp: new Date().toISOString(),
    footer: { text: `Project • ${projectName}` },
    fields: [
      { name: '⏰ Time', value: formatTimestamp(), inline: true },
      { name: '📋 Event', value: hookType, inline: true },
      { name: '🆔 Session', value: `\`${truncateSessionId(sessionId)}\``, inline: true },
      { name: '📍 Location', value: `\`${cwd || 'Unknown'}\``, inline: false },
    ],
  };
}

/**
 * Format embed based on hook event type
 * @param {Object} input - Hook input with snake_case fields
 * @returns {Object} Discord embed object
 */
function formatEmbed(input) {
  // Use CORRECT snake_case field names (fixed from bash script's camelCase bug)
  const hookType = input.hook_event_name || 'unknown';

  switch (hookType) {
    case 'Stop':
      return buildStopEmbed(input);
    case 'SubagentStop':
      return buildSubagentStopEmbed(input);
    case 'AskUserPrompt':
      return buildAskUserPromptEmbed(input);
    default:
      return buildDefaultEmbed(input);
  }
}

module.exports = {
  name: 'discord',

  /**
   * Check if Discord provider is enabled
   * @param {Object} env - Environment variables
   * @returns {boolean} True if DISCORD_WEBHOOK_URL is set
   */
  isEnabled: (env) => !!env.DISCORD_WEBHOOK_URL,

  /**
   * Send notification to Discord
   * @param {Object} input - Hook input (snake_case fields)
   * @param {Object} env - Environment variables
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  send: async (input, env) => {
    if (!env.DISCORD_WEBHOOK_URL) {
      return { success: false, error: 'DISCORD_WEBHOOK_URL not configured' };
    }

    const embed = formatEmbed(input);
    return send('discord', env.DISCORD_WEBHOOK_URL, { embeds: [embed] });
  },
};
