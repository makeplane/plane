#!/usr/bin/env node
'use strict';

/**
 * Claude Code statusline renderer — reads JSON from stdin, writes ANSI lines to stdout.
 * Rendering is config-driven via statuslineLayout in .ck.json.
 * When statuslineLayout is absent, output is IDENTICAL to pre-refactor behavior.
 */

const { stdin, env } = require('process');
const os = require('os');
const fs = require('fs');
const path = require('path');

const { setColorEnabled } = require('./hooks/lib/colors.cjs');
const { loadConfig, readSessionState } = require('./hooks/lib/ck-config-utils.cjs');
const { getGitInfo } = require('./hooks/lib/git-info-cache.cjs');
const { readActivitySnapshot } = require('./hooks/lib/statusline-session-cache.cjs');
const {
  readUsageCache,
  normalizeUtilization,
  isUsageCacheFresh,
  resolveQuotaDisplayEligibility
} = require('./hooks/lib/usage-limits-cache.cjs');
const { resolveLayout } = require('./hooks/lib/statusline-section-registry.cjs');
const { render, renderCompact, renderMinimal } = require('./hooks/lib/statusline-render-modes.cjs');
const { formatCountdown } = require('./hooks/lib/statusline-string-utils.cjs');

const AUTOCOMPACT_BUFFER = 40000;
const USAGE_CACHE_RENDER_TTL_MS = 300000;

// ============================================================================
// UTILITIES
// ============================================================================

function expandHome(filePath) {
  const homeDir = os.homedir();
  return filePath.startsWith(homeDir) ? filePath.replace(homeDir, '~') : filePath;
}

// Read stdin with optional inactivity timeout (CK_STATUSLINE_STDIN_TIMEOUT_MS)
async function readStdin() {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stdin.setEncoding('utf8');
    const parsedTimeout = Number.parseInt(env.CK_STATUSLINE_STDIN_TIMEOUT_MS || '', 10);
    const timeoutMs = Number.isFinite(parsedTimeout) && parsedTimeout > 0 ? parsedTimeout : 0;
    let timer = null;
    const clearTimer = () => { if (timer) { clearTimeout(timer); timer = null; } };
    const armTimer = () => {
      if (!timeoutMs) return;
      clearTimer();
      timer = setTimeout(() => reject(new Error(`stdin timeout after ${timeoutMs}ms`)), timeoutMs);
    };
    armTimer();
    stdin.on('data', chunk => { chunks.push(chunk); armTimer(); });
    stdin.on('end', () => { clearTimer(); resolve(chunks.join('')); });
    stdin.on('error', err => { clearTimer(); reject(err); });
  });
}

// Build usage window strings from cache (e.g. ["5h 20% (1h30m)", "wk 45% (4d)"])
function buildUsageWindows(cache) {
  if (!cache || cache.status !== 'available') return [];
  if (!isUsageCacheFresh(cache, USAGE_CACHE_RENDER_TTL_MS)) return [];
  const now = Date.now();
  // Prefer pre-calculated snapshot percentages (with reset countdown when available)
  const snap = [
    { label: '5h', percent: cache.snapshot?.fiveHourPercent, resetsAt: cache.data?.five_hour?.resets_at },
    { label: 'wk', percent: cache.snapshot?.weekPercent,     resetsAt: cache.data?.seven_day?.resets_at }
  ].map(({ label, percent, resetsAt }) => {
    if (percent == null) return null;
    let countdown = '';
    if (resetsAt) {
      const cd = formatCountdown(new Date(resetsAt).getTime() - now);
      if (cd) countdown = ` (${cd})`;
    }
    return `${label} ${percent}%${countdown}`;
  }).filter(Boolean);
  if (snap.length > 0) return snap;
  // Fall back to raw utilization values (no resets_at countdown in fallback path)
  return [
    { label: '5h', value: cache.data?.five_hour?.utilization },
    { label: 'wk', value: cache.data?.seven_day?.utilization }
  ].map(({ label, value }) => {
    const pct = normalizeUtilization(value);
    return pct == null ? null : `${label} ${pct}%`;
  }).filter(Boolean);
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  try {
    const input = await readStdin();
    if (!input.trim()) { console.error('No input provided'); process.exit(1); }

    const data = JSON.parse(input);

    // Directory
    let currentDir = data.workspace?.current_dir || data.cwd || 'unknown';
    currentDir = expandHome(currentDir);

    const modelName = data.model?.display_name || 'Claude';

    // Git info
    const gitInfo = getGitInfo(data.workspace?.current_dir || data.cwd || process.cwd());
    const gitBranch   = gitInfo?.branch   || '';
    const gitUnstaged = gitInfo?.unstaged || 0;
    const gitStaged   = gitInfo?.staged   || 0;
    const gitAhead    = gitInfo?.ahead    || 0;
    const gitBehind   = gitInfo?.behind   || 0;

    // Session state (active plan + activity snapshot)
    let activePlan = '';
    let transcript = { agents: [], todos: [], sessionStart: null };
    try {
      const sessionId = data.session_id;
      if (sessionId) {
        const session = readSessionState(sessionId);
        const planPath = session?.activePlan?.trim();
        if (planPath) {
          const match = planPath.match(/plans\/\d+-\d+-(.+?)(?:\/|$)/);
          activePlan = match ? match[1] : planPath.split('/').pop();
        }
        transcript = readActivitySnapshot(sessionId, readSessionState) || transcript;
      }
    } catch {}

    // Context window percentage
    const usage = data.context_window?.current_usage || {};
    const contextSize = data.context_window?.context_window_size || 0;
    let contextPercent = 0;
    let totalTokens = 0;
    if (contextSize > 0) {
      totalTokens = (usage.input_tokens ?? 0) + (usage.cache_creation_input_tokens ?? 0) + (usage.cache_read_input_tokens ?? 0);
      const preCalc = data.context_window?.used_percentage;
      if (typeof preCalc === 'number' && preCalc >= 0) {
        contextPercent = Math.round(preCalc);
      } else if (contextSize > AUTOCOMPACT_BUFFER) {
        contextPercent = Math.min(100, Math.round(((totalTokens + AUTOCOMPACT_BUFFER) / contextSize) * 100));
      }
    }

    // Persist context data for hooks
    const sessionId = data.session_id;
    if (sessionId && contextSize > 0) {
      try {
        const contextDataPath = path.join(os.tmpdir(), `ck-context-${sessionId}.json`);
        fs.writeFileSync(contextDataPath, JSON.stringify({
          percent: contextPercent,
          remaining: data.context_window?.remaining_percentage ?? (100 - contextPercent),
          tokens: totalTokens,
          size: contextSize,
          usage,
          timestamp: Date.now()
        }));
      } catch {}
    }

    // Config
    const config = loadConfig({ includeProject: false, includeAssertions: false, includeLocale: false });
    const statuslineMode = config.statusline || 'full';
    const usageWindows = config.statuslineQuota === false
      ? []
      : (resolveQuotaDisplayEligibility({ useCache: true }).eligible
          ? buildUsageWindows(readUsageCache())
          : []);

    // Cost + lines changed
    const billingMode = env.CLAUDE_BILLING_MODE || 'api';
    const costUSD = data.cost?.total_cost_usd;
    const costText = billingMode === 'api' && costUSD && /^\d+(\.\d+)?$/.test(String(costUSD))
      ? `$${parseFloat(costUSD).toFixed(4)}`
      : null;
    const linesAdded   = data.cost?.total_lines_added   || 0;
    const linesRemoved = data.cost?.total_lines_removed || 0;

    // Render context
    const ctx = {
      modelName, currentDir,
      gitBranch, gitUnstaged, gitStaged, gitAhead, gitBehind,
      activePlan, contextPercent, usageWindows,
      costText, linesAdded, linesRemoved,
      transcript
    };

    // Color config (NO_COLOR env var checked inside isColorEnabled() and always wins)
    if (config.statuslineColors === false) setColorEnabled(false);

    // Resolve layout — uses statuslineLayout from config when present, else defaults
    const layout = resolveLayout(config.statuslineLayout);

    // Dispatch to render mode
    switch (statuslineMode) {
      case 'none':    console.log(''); break;
      case 'minimal': renderMinimal(ctx, layout); break;
      case 'compact': renderCompact(ctx, layout); break;
      case 'full':
      default:        render(ctx, layout, false); break;
    }

  } catch {
    console.log('📁 ' + (process.cwd() || 'unknown'));
  }
}

main().catch(() => { console.log('📁 error'); process.exit(1); });
