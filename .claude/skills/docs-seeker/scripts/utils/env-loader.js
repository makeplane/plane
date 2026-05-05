#!/usr/bin/env node

/**
 * Environment variable loader for docs-seeker skill
 * Respects order: process.env > skill/.env > skills/.env > .claude/.env
 */

const fs = require('fs');
const path = require('path');

/**
 * Parse .env file content into key-value pairs
 * @param {string} content - .env file content
 * @returns {Object} Parsed environment variables
 */
function parseEnvFile(content) {
  const env = {};
  const lines = content.split('\n');

  for (const line of lines) {
    // Skip comments and empty lines
    if (!line || line.trim().startsWith('#')) continue;

    const match = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/);
    if (match) {
      const key = match[1];
      let value = match[2].trim();

      // Remove quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) ||
          (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }

      env[key] = value;
    }
  }

  return env;
}

/**
 * Load environment variables from .env files in priority order
 * Priority: process.env > skill/.env > skills/.env > .claude/.env
 * @returns {Object} Merged environment variables
 */
function loadEnv() {
  const skillDir = path.resolve(__dirname, '../..');
  const skillsDir = path.resolve(skillDir, '..');
  const claudeDir = path.resolve(skillsDir, '..');

  const envPaths = [
    path.join(claudeDir, '.env'),      // Lowest priority
    path.join(skillsDir, '.env'),
    path.join(skillDir, '.env'),       // Highest priority (file)
  ];

  let mergedEnv = {};

  // Load .env files in order (lowest to highest priority)
  for (const envPath of envPaths) {
    if (fs.existsSync(envPath)) {
      try {
        const content = fs.readFileSync(envPath, 'utf8');
        const parsed = parseEnvFile(content);
        mergedEnv = { ...mergedEnv, ...parsed };
      } catch (error) {
        // Silently skip unreadable files
      }
    }
  }

  // process.env has highest priority
  mergedEnv = { ...mergedEnv, ...process.env };

  return mergedEnv;
}

/**
 * Get environment variable with fallback
 * @param {string} key - Environment variable key
 * @param {string} defaultValue - Default value if not found
 * @returns {string} Environment variable value
 */
function getEnv(key, defaultValue = '') {
  const env = loadEnv();
  return env[key] || defaultValue;
}

module.exports = {
  loadEnv,
  getEnv,
  parseEnvFile,
};
