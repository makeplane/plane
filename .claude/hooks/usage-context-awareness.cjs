#!/usr/bin/env node
/**
 * Usage Cache Writer - UserPromptSubmit & PostToolUse Hook
 *
 * Fetches Claude Code usage limits from Anthropic OAuth API and writes to cache.
 * The cache is read by:
 * - statusline.cjs (for display)
 * - context-builder.cjs (for injection)
 *
 * Features:
 * - Cross-platform credential retrieval (macOS Keychain, file-based)
 * - API response caching (60s TTL)
 * - Throttled API calls (1 min for prompts, 5 mins for tool use)
 */

const fs = require("fs");
const path = require("path");
const os = require("os");
const { execSync } = require("child_process");
const { isHookEnabled } = require('./lib/ck-config-utils.cjs');

// Early exit if hook disabled in config
if (!isHookEnabled('usage-context-awareness')) {
  process.exit(0);
}

// Cache configuration
const USAGE_CACHE_FILE = path.join(os.tmpdir(), "ck-usage-limits-cache.json");
const CACHE_TTL_MS = 60000; // 60 seconds
const FETCH_INTERVAL_MS = 300000; // 5 minutes for PostToolUse
const FETCH_INTERVAL_PROMPT_MS = 60000; // 1 minute for UserPromptSubmit

/**
 * Get Claude OAuth credentials (cross-platform)
 */
function getClaudeCredentials() {
	// macOS: Try Keychain first
	if (os.platform() === "darwin") {
		try {
			const result = execSync('security find-generic-password -s "Claude Code-credentials" -w', {
				timeout: 5000,
				encoding: "utf-8",
				stdio: ["pipe", "pipe", "ignore"],
			}).trim();
			const parsed = JSON.parse(result);
			if (parsed.claudeAiOauth?.accessToken) {
				return parsed.claudeAiOauth.accessToken;
			}
		} catch {
			// Fallback to file-based
		}
	}

	// File-based credentials (Linux/Windows, or macOS fallback)
	const credPath = path.join(os.homedir(), ".claude", ".credentials.json");
	try {
		const content = fs.readFileSync(credPath, "utf-8");
		const parsed = JSON.parse(content);
		return parsed.claudeAiOauth?.accessToken || null;
	} catch {
		return null;
	}
}

/**
 * Check if we should fetch (throttled)
 */
function shouldFetch(isUserPrompt = false) {
	const interval = isUserPrompt ? FETCH_INTERVAL_PROMPT_MS : FETCH_INTERVAL_MS;

	try {
		if (fs.existsSync(USAGE_CACHE_FILE)) {
			const cache = JSON.parse(fs.readFileSync(USAGE_CACHE_FILE, "utf-8"));
			if (Date.now() - cache.timestamp < interval) {
				return false;
			}
		}
	} catch {}
	return true;
}

/**
 * Write cache with status (available or unavailable)
 */
function writeCache(status, data = null) {
	fs.writeFileSync(
		USAGE_CACHE_FILE,
		JSON.stringify({
			timestamp: Date.now(),
			status,
			data,
		})
	);
}

/**
 * Fetch usage limits from Anthropic OAuth API and write to cache
 * Always writes status to cache (available or unavailable) for statusline fallback
 */
async function fetchAndCacheUsageLimits() {
	const token = getClaudeCredentials();
	if (!token) {
		writeCache("unavailable");
		return false;
	}

	try {
		const response = await fetch("https://api.anthropic.com/api/oauth/usage", {
			method: "GET",
			headers: {
				Accept: "application/json",
				"Content-Type": "application/json",
				Authorization: `Bearer ${token}`,
				"anthropic-beta": "oauth-2025-04-20",
				"User-Agent": "claudekit-engineer/1.0",
			},
		});

		if (!response.ok) {
			writeCache("unavailable");
			return false;
		}

		const data = await response.json();
		writeCache("available", data);
		return true;
	} catch {
		writeCache("unavailable");
		return false;
	}
}

/**
 * Main hook execution - just fetch and cache, no injection
 */
async function main() {
	// Always allow operation to continue
	const result = { continue: true };

	try {
		// Read hook input
		let inputStr = "";
		try {
			inputStr = fs.readFileSync(0, "utf-8");
		} catch {}

		const input = JSON.parse(inputStr || "{}");

		// Detect hook type
		const isUserPrompt = typeof input.prompt === "string";

		// Check if we should fetch (throttled)
		if (shouldFetch(isUserPrompt)) {
			await fetchAndCacheUsageLimits();
		}
	} catch {}

	// Output result (no injection, just continue)
	console.log(JSON.stringify(result));
}

main().catch(() => {
	console.log(JSON.stringify({ continue: true }));
	process.exit(0);
});
