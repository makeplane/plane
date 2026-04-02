#!/usr/bin/env node
'use strict';

/**
 * Git Info Cache - Cross-platform git information batching
 *
 * Problem: 5-6 git process spawns per statusline render are slow on Windows (CreateProcess overhead)
 * Solution: Cache git query results for 3 seconds — subsequent renders read cache (zero processes)
 *
 * Performance: 5 spawns per render → event-driven refresh + 30s TTL fallback
 * Cross-platform: No bash-only syntax (no 2>/dev/null), windowsHide on all exec calls
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Cache TTL — long fallback for external changes (git checkout outside Claude)
// Active invalidation happens via PostToolUse hooks after Edit/Write/Bash
const CACHE_TTL = 30000;
const CACHE_MISS = Symbol('cache_miss');
const CACHE_SKIP = Symbol('cache_skip');

function isTimeoutError(error) {
  if (!error) return false;
  if (error.killed) return true;
  if (error.signal === 'SIGTERM') return true;
  return /timed out|etimedout/i.test(String(error.message || ''));
}

function getExecTimeoutMs() {
  const parsed = Number.parseInt(process.env.CK_GIT_TIMEOUT_MS || '', 10);
  if (Number.isFinite(parsed) && parsed > 0) return parsed;
  return 3000;
}

/**
 * Safe command execution wrapper with optional cwd
 * Timeout prevents hangs on slow/network-mounted repos
 */
function execIn(cmd, cwd) {
  try {
    return {
      output: execSync(cmd, {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'ignore'],
        windowsHide: true,
        cwd: cwd || undefined,
        timeout: getExecTimeoutMs()
      }).trim(),
      timedOut: false
    };
  } catch (error) {
    return {
      output: '',
      timedOut: isTimeoutError(error)
    };
  }
}

/**
 * Get cache file path for current working directory
 */
function getCachePath(cwd) {
  const hash = require('crypto')
    .createHash('md5')
    .update(cwd)
    .digest('hex')
    .slice(0, 8);
  return path.join(os.tmpdir(), `ck-git-cache-${hash}.json`);
}

/**
 * Read cache if valid (not expired). Returns CACHE_MISS on miss.
 * No existsSync check (TOCTOU race) — just try read and catch.
 */
function readCache(cachePath, options = {}) {
  const { allowStale = false } = options;
  try {
    const cache = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
    if (Date.now() - cache.timestamp < CACHE_TTL || allowStale) {
      return cache.data; // Can be null (non-git dir) or object (git info)
    }
  } catch {
    // File missing, corrupted, or expired — all treated as cache miss
  }
  return CACHE_MISS;
}

/**
 * Write cache atomically (temp file + rename to avoid partial reads on Windows)
 */
function writeCache(cachePath, data) {
  const tmpPath = cachePath + '.tmp';
  try {
    fs.writeFileSync(tmpPath, JSON.stringify({ timestamp: Date.now(), data }));
    fs.renameSync(tmpPath, cachePath);
  } catch {
    try { fs.unlinkSync(tmpPath); } catch {}
  }
}

/**
 * Count non-empty lines in a newline-delimited string
 */
function countLines(str) {
  if (!str) return 0;
  return str.split('\n').filter(l => l.trim()).length;
}

/**
 * Fetch git info directly in-process
 * The cache is what eliminates redundant spawns — not subprocess wrapping
 * @param {string} cwd - Directory to run git commands in
 * Returns: { branch, unstaged, staged, ahead, behind } or null if not git repo
 */
function fetchGitInfo(cwd) {
  // Check if git repo (fast check) — run in target cwd, not process.cwd()
  const repoCheck = execIn('git rev-parse --git-dir', cwd);
  if (repoCheck.timedOut) return CACHE_SKIP;
  if (!repoCheck.output) {
    return null;
  }

  const branchPrimary = execIn('git branch --show-current', cwd);
  const branchFallback = execIn('git rev-parse --short HEAD', cwd);
  const unstagedResult = execIn('git diff --name-only', cwd);
  const stagedResult = execIn('git diff --cached --name-only', cwd);
  const aheadBehindResult = execIn('git rev-list --left-right --count @{u}...HEAD', cwd);

  if (
    branchPrimary.timedOut ||
    branchFallback.timedOut ||
    unstagedResult.timedOut ||
    stagedResult.timedOut ||
    aheadBehindResult.timedOut
  ) {
    return CACHE_SKIP;
  }

  const branch = branchPrimary.output || branchFallback.output;
  const unstaged = countLines(unstagedResult.output);
  const staged = countLines(stagedResult.output);

  // Ahead/behind — no 2>/dev/null (invalid on Windows cmd.exe)
  let ahead = 0;
  let behind = 0;
  if (aheadBehindResult.output) {
    const parts = aheadBehindResult.output.split(/\s+/);
    behind = parseInt(parts[0], 10) || 0;
    ahead = parseInt(parts[1], 10) || 0;
  }

  return { branch, unstaged, staged, ahead, behind };
}

/**
 * Get git info with caching
 * Main export function used by statusline
 */
function getGitInfo(cwd = process.cwd()) {
  const cachePath = getCachePath(cwd);

  // Try cache first (includes cached null for non-git dirs)
  const cached = readCache(cachePath);
  if (cached !== CACHE_MISS) return cached;

  // Cache miss or expired, fetch fresh data in target cwd
  const data = fetchGitInfo(cwd);
  if (data === CACHE_SKIP) {
    // Timeout/transient failures should not poison cache as non-git.
    // Prefer last known value (even stale) if available.
    const stale = readCache(cachePath, { allowStale: true });
    return stale === CACHE_MISS ? null : stale;
  }

  // Cache both positive and null results (avoids re-spawning git in non-git dirs)
  writeCache(cachePath, data);

  return data;
}

/**
 * Invalidate cache for a directory (call after file changes to trigger fresh git query)
 */
function invalidateCache(cwd = process.cwd()) {
  try { fs.unlinkSync(getCachePath(cwd)); } catch {}
}

module.exports = { getGitInfo, invalidateCache };
