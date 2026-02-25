#!/usr/bin/env node
'use strict';

/**
 * ANSI Terminal Colors - Cross-platform color support for statusline
 * Supports NO_COLOR, FORCE_COLOR, COLORTERM auto-detection
 * @module colors
 */

// ANSI escape codes (8-color basic palette)
const RESET = '\x1b[0m';
const DIM = '\x1b[2m';
const RED = '\x1b[31m';
const GREEN = '\x1b[32m';
const YELLOW = '\x1b[33m';
const MAGENTA = '\x1b[35m';
const CYAN = '\x1b[36m';

// Detect color support at module load (cached)
// Claude Code statusline runs via pipe but output displays in TTY - default to true
const shouldUseColor = (() => {
  if (process.env.NO_COLOR) return false;
  if (process.env.FORCE_COLOR) return true;
  // Default true for statusline context (Claude Code handles TTY display)
  return true;
})();

// Detect 256-color support via COLORTERM
const has256Color = (() => {
  const ct = process.env.COLORTERM;
  return ct === 'truecolor' || ct === '24bit' || ct === '256color';
})();

/**
 * Wrap text with ANSI color code
 * @param {string} text - Text to colorize
 * @param {string} code - ANSI escape code
 * @returns {string} Colorized text or plain text if colors disabled
 */
function colorize(text, code) {
  if (!shouldUseColor) return String(text);
  return `${code}${text}${RESET}`;
}

function green(text) { return colorize(text, GREEN); }
function yellow(text) { return colorize(text, YELLOW); }
function red(text) { return colorize(text, RED); }
function cyan(text) { return colorize(text, CYAN); }
function magenta(text) { return colorize(text, MAGENTA); }
function dim(text) { return colorize(text, DIM); }

/**
 * Get color code based on context percentage threshold
 * @param {number} percent - Context usage percentage (0-100)
 * @returns {string} ANSI color code
 */
function getContextColor(percent) {
  if (percent >= 85) return RED;
  if (percent >= 70) return YELLOW;
  return GREEN;
}

/**
 * Generate colored progress bar for context window
 * Uses ▰▱ characters (smooth horizontal rectangles) for consistent rendering
 * @param {number} percent - Usage percentage (0-100)
 * @param {number} width - Bar width in characters (default 12)
 * @returns {string} Unicode progress bar with threshold-based colors
 */
function coloredBar(percent, width = 12) {
  const clamped = Math.max(0, Math.min(100, percent));
  const filled = Math.round((clamped / 100) * width);
  const empty = width - filled;

  if (!shouldUseColor) {
    return '▰'.repeat(filled) + '▱'.repeat(empty);
  }

  const color = getContextColor(percent);
  return `${color}${'▰'.repeat(filled)}${DIM}${'▱'.repeat(empty)}${RESET}`;
}

module.exports = {
  RESET,
  green,
  yellow,
  red,
  cyan,
  magenta,
  dim,
  getContextColor,
  coloredBar,
  shouldUseColor,
  has256Color
};
