/**
 * Environment loader with cascade: process.env > ~/.claude/.env > .claude/.env
 * Zero dependencies - manual .env parsing
 */
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

/**
 * Parse a .env file content into key-value pairs
 * Supports: comments (#), quoted values, empty lines
 * @param {string} content - File content
 * @returns {Object} Parsed environment variables
 */
function parseEnvContent(content) {
  const result = {};
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith('#')) continue;

    // Find first = sign
    const eqIndex = trimmed.indexOf('=');
    if (eqIndex === -1) continue;

    const key = trimmed.slice(0, eqIndex).trim();
    let value = trimmed.slice(eqIndex + 1).trim();

    // Handle quoted values (single or double quotes)
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    // Handle inline comments (only if not quoted)
    if (!trimmed.slice(eqIndex + 1).trim().startsWith('"') &&
        !trimmed.slice(eqIndex + 1).trim().startsWith("'")) {
      const commentIndex = value.indexOf('#');
      if (commentIndex !== -1) {
        value = value.slice(0, commentIndex).trim();
      }
    }

    if (key) {
      result[key] = value;
    }
  }

  return result;
}

/**
 * Load .env file if it exists
 * @param {string} filePath - Path to .env file
 * @returns {Object} Parsed env or empty object
 */
function loadEnvFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf8');
      const parsed = parseEnvContent(content);
      if (Object.keys(parsed).length > 0) {
        console.error(`[env-loader] Loaded: ${filePath}`);
      }
      return parsed;
    }
  } catch (err) {
    console.error(`[env-loader] Failed to read ${filePath}: ${err.message}`);
  }
  return {};
}

/**
 * Load environment with cascade priority
 * Priority: process.env > ~/.claude/.env > .claude/.env
 * @param {string} [cwd] - Current working directory (defaults to process.cwd())
 * @returns {Object} Merged environment variables
 */
function loadEnv(cwd = process.cwd()) {
  const envFiles = [
    // Lowest priority first (will be overwritten)
    path.join(cwd, '.claude', '.env'),
    path.join(os.homedir(), '.claude', '.env'),
  ];

  // Start with empty object, layer on each source
  let merged = {};

  for (const filePath of envFiles) {
    const fileEnv = loadEnvFile(filePath);
    merged = { ...merged, ...fileEnv };
  }

  // process.env has highest priority
  merged = { ...merged, ...process.env };

  return merged;
}

module.exports = { loadEnv, parseEnvContent };
