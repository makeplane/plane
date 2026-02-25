/**
 * HTTP sender with smart throttling
 * Uses native fetch (Node 18+) - zero dependencies
 */
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');

const THROTTLE_FILE = path.join(os.tmpdir(), 'ck-noti-throttle.json');
const THROTTLE_DURATION_MS = 5 * 60 * 1000; // 5 minutes

/**
 * Load throttle state from temp file
 * @returns {Object} Provider -> last error timestamp map
 */
function loadThrottleState() {
  try {
    if (fs.existsSync(THROTTLE_FILE)) {
      const content = fs.readFileSync(THROTTLE_FILE, 'utf8');
      return JSON.parse(content);
    }
  } catch (err) {
    // Corrupted file - start fresh
    console.error(`[sender] Throttle file corrupted, resetting: ${err.message}`);
  }
  return {};
}

/**
 * Save throttle state to temp file
 * @param {Object} state - Provider -> timestamp map
 */
function saveThrottleState(state) {
  try {
    fs.writeFileSync(THROTTLE_FILE, JSON.stringify(state, null, 2), 'utf8');
  } catch (err) {
    console.error(`[sender] Failed to save throttle state: ${err.message}`);
  }
}

/**
 * Check if provider is currently throttled
 * @param {string} provider - Provider name
 * @returns {boolean} True if throttled
 */
function isThrottled(provider) {
  const state = loadThrottleState();
  const lastError = state[provider];

  if (!lastError) return false;

  const elapsed = Date.now() - lastError;
  return elapsed < THROTTLE_DURATION_MS;
}

/**
 * Record an error for throttling
 * @param {string} provider - Provider name
 */
function recordError(provider) {
  const state = loadThrottleState();
  state[provider] = Date.now();
  saveThrottleState(state);
}

/**
 * Clear throttle for a provider (on success)
 * @param {string} provider - Provider name
 */
function clearThrottle(provider) {
  const state = loadThrottleState();
  if (state[provider]) {
    delete state[provider];
    saveThrottleState(state);
  }
}

/**
 * Send HTTP POST request with throttling
 * @param {string} provider - Provider name for throttling
 * @param {string} url - Target URL
 * @param {Object} body - JSON body to send
 * @param {Object} [headers] - Additional headers
 * @returns {Promise<{success: boolean, error?: string, throttled?: boolean}>}
 */
async function send(provider, url, body, headers = {}) {
  // Check throttle first
  if (isThrottled(provider)) {
    return { success: false, throttled: true };
  }

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...headers,
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      const errorMsg = `HTTP ${response.status}: ${errorText.slice(0, 100)}`;

      // Record error for throttling
      recordError(provider);
      console.error(`[sender] ${provider} failed: ${errorMsg}`);

      return { success: false, error: errorMsg };
    }

    // Success - clear any previous throttle
    clearThrottle(provider);
    return { success: true };

  } catch (err) {
    // Network error - record for throttling
    recordError(provider);
    console.error(`[sender] ${provider} network error: ${err.message}`);

    return { success: false, error: err.message };
  }
}

module.exports = { send, isThrottled };
