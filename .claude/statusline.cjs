#!/usr/bin/env node
'use strict';

/**
 * Custom Claude Code statusline for Node.js - Multi-line Edition
 * Cross-platform support: Windows, macOS, Linux
 * Features: ANSI colors, tool/agent/todo tracking, context window, session timer
 * No external dependencies - uses only Node.js built-in modules
 */

const { stdin, env } = require('process');
const { execSync } = require('child_process');
const os = require('os');
const fs = require('fs');
const path = require('path');

// Import modular components
const { green, yellow, red, cyan, magenta, dim, coloredBar, RESET, shouldUseColor } = require('./hooks/lib/colors.cjs');
const { parseTranscript } = require('./hooks/lib/transcript-parser.cjs');
const { countConfigs } = require('./hooks/lib/config-counter.cjs');
const { loadConfig } = require('./hooks/lib/ck-config-utils.cjs');

// Buffer constant matching /context output (22.5% of 200k)
const AUTOCOMPACT_BUFFER = 45000;

/**
 * Safe command execution wrapper
 */
function exec(cmd) {
  try {
    return execSync(cmd, {
      encoding: 'utf8',
      stdio: ['pipe', 'pipe', 'ignore'],
      windowsHide: true
    }).trim();
  } catch {
    return '';
  }
}

/**
 * Expand home directory to ~
 */
function expandHome(filePath) {
  const homeDir = os.homedir();
  return filePath.startsWith(homeDir) ? filePath.replace(homeDir, '~') : filePath;
}

/**
 * Get terminal width with fallback chain
 * Piped context (statusline) needs alternative detection
 */
function getTerminalWidth() {
  // Try multiple sources - stderr might still be TTY even when stdout is piped
  if (process.stderr.columns) return process.stderr.columns;
  if (env.COLUMNS) {
    const parsed = parseInt(env.COLUMNS, 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  // Subprocess fallback
  const tputCols = exec('tput cols');
  if (tputCols && /^\d+$/.test(tputCols)) return parseInt(tputCols, 10);
  return 120; // Safe default
}

/**
 * Calculate visible string length (strip ANSI codes, account for emoji width)
 * Emojis typically render as 2 columns in terminals
 */
function visibleLength(str) {
  if (!str || typeof str !== 'string') return 0;
  // Strip ANSI escape codes
  const noAnsi = str.replace(/\x1b\[[0-9;]*m/g, '');
  // Count emojis (they render as ~2 cols) - common emoji ranges
  const emojiMatches = noAnsi.match(/[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}]/gu) || [];
  return noAnsi.length + emojiMatches.length; // +1 per emoji (base length + 1 = 2 cols)
}

/**
 * Format elapsed time from start to end (or now)
 */
function formatElapsed(startTime, endTime) {
  if (!startTime) return '0s';
  const start = startTime instanceof Date ? startTime.getTime() : new Date(startTime).getTime();
  if (isNaN(start)) return '0s';
  const end = endTime ? (endTime instanceof Date ? endTime.getTime() : new Date(endTime).getTime()) : Date.now();
  if (isNaN(end)) return '0s';
  const ms = end - start;
  if (ms < 0 || ms < 1000) return '<1s';
  if (ms < 60000) return `${Math.round(ms / 1000)}s`;
  const mins = Math.floor(ms / 60000);
  const secs = Math.round((ms % 60000) / 1000);
  return `${mins}m ${secs}s`;
}

/**
 * Read stdin asynchronously
 */
async function readStdin() {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stdin.setEncoding('utf8');
    stdin.on('data', chunk => chunks.push(chunk));
    stdin.on('end', () => resolve(chunks.join('')));
    stdin.on('error', reject);
  });
}

// ============================================================================
// LINE RENDERERS
// ============================================================================

/**
 * Build usage time string with optional percentage
 * @returns {string|null} Formatted usage string or null if unavailable
 */
function buildUsageString(ctx) {
  if (!ctx.sessionText || ctx.sessionText === 'N/A') return null;
  let str = ctx.sessionText.replace(' until reset', ' left');
  if (ctx.usagePercent != null) str += ` (${Math.round(ctx.usagePercent)}%)`;
  return str;
}

/**
 * Render session lines with multi-level responsive wrapping
 * Combines parts based on content length vs terminal width
 * Tries to minimize lines while keeping content readable
 */
function renderSessionLines(ctx) {
  const lines = [];
  const termWidth = getTerminalWidth();
  const threshold = Math.floor(termWidth * 0.85);

  // Build all atomic parts for flexible composition (no colors on static text)
  const dirPart = `📁 ${ctx.currentDir}`;

  let branchPart = '';
  if (ctx.gitBranch) {
    branchPart = `🌿 ${ctx.gitBranch}`;
    // Build git status indicators: (unstaged, +staged, ahead↑, behind↓)
    const gitIndicators = [];
    if (ctx.gitUnstaged > 0) gitIndicators.push(`${ctx.gitUnstaged}`);
    if (ctx.gitStaged > 0) gitIndicators.push(`+${ctx.gitStaged}`);
    if (ctx.gitAhead > 0) gitIndicators.push(`${ctx.gitAhead}↑`);
    if (ctx.gitBehind > 0) gitIndicators.push(`${ctx.gitBehind}↓`);
    if (gitIndicators.length > 0) {
      branchPart += ` ${yellow(`(${gitIndicators.join(', ')})`)}`;
    }
  }

  // Active plan indicator (disabled for now - code preserved)
  // const planPart = ctx.activePlan ? `📋 ${ctx.activePlan}` : '';
  const planPart = '';

  // Combined location (dir + branch + plan)
  let locationPart = branchPart ? `${dirPart}  ${branchPart}` : dirPart;
  if (planPart) locationPart += `  ${planPart}`;

  // Build session part: 🤖 model  contextBar%  ⌛ time left (usage%)
  let sessionPart = `🤖 ${ctx.modelName}`;
  if (ctx.contextPercent > 0) {
    sessionPart += `  ${coloredBar(ctx.contextPercent, 12)} ${ctx.contextPercent}%`;
  }
  // Add usage/reset info to session part (stays on line 1 with model - Claude Code only reads line 1)
  const usageStr = buildUsageString(ctx);
  if (usageStr) {
    sessionPart += `  ⌛ ${usageStr.replace(/\)$/, ' used)')}`;
  }

  // Build stats part (only lines changed now)
  const statsItems = [];
  // if (ctx.costText) statsItems.push(`💵 ${ctx.costText.replace(/(\.\d{2})\d+/, '$1')}`);
  if (ctx.linesAdded > 0 || ctx.linesRemoved > 0) {
    statsItems.push(`📝 ${green(`+${ctx.linesAdded}`)} ${red(`-${ctx.linesRemoved}`)}`);
  }
  const statsPart = statsItems.join('  ');

  // Calculate lengths for layout decisions
  const locationLen = visibleLength(locationPart);
  const sessionLen = visibleLength(sessionPart);
  const statsLen = visibleLength(statsPart);

  // Layout priority: SESSION FIRST (Claude Code only reads line 1)
  // Line 1: model + context + usage (most important for Claude Code)
  // Line 2+: location, git, stats
  const allOneLine = `${sessionPart}  ${locationPart}  ${statsPart}`;
  const sessionLocation = `${sessionPart}  ${locationPart}`;
  const sessionStats = `${sessionPart}  ${statsPart}`;

  if (visibleLength(allOneLine) <= threshold && statsLen > 0) {
    // Ultra-wide: everything on one line (session first)
    lines.push(allOneLine);
  } else if (visibleLength(sessionLocation) <= threshold) {
    // Wide: session+location on line 1 | stats on line 2
    lines.push(sessionLocation);
    if (statsLen > 0) lines.push(statsPart);
  } else if (sessionLen <= threshold) {
    // Medium: session on line 1 | location on line 2 | stats on line 3
    lines.push(sessionPart);
    lines.push(locationPart);
    if (statsLen > 0) lines.push(statsPart);
  } else {
    // Narrow: session | dir | branch | stats (each on own line)
    lines.push(sessionPart);
    lines.push(dirPart);
    if (branchPart) lines.push(branchPart);
    if (planPart) lines.push(planPart);
    if (statsLen > 0) lines.push(statsPart);
  }

  return lines;
}

/**
 * Safe date parsing - returns epoch ms or 0 for invalid dates
 */
function safeGetTime(dateValue) {
  if (!dateValue) return 0;
  const time = new Date(dateValue).getTime();
  return isNaN(time) ? 0 : time;
}

/**
 * Render agents lines as compact chronological flow with duplicate collapsing
 * Format: ○ type ×N → ● type (N done)
 *         ▸ description (elapsed)
 * @returns {string[]} Array of lines (flow line + optional task line)
 */
function renderAgentsLines(transcript) {
  const { agents } = transcript;
  if (!agents || agents.length === 0) return [];

  const running = agents.filter(a => a.status === 'running');
  const completed = agents.filter(a => a.status === 'completed');

  // Sort all by startTime (safe NaN handling)
  const allAgents = [...running, ...completed];
  allAgents.sort((a, b) => safeGetTime(a.startTime) - safeGetTime(b.startTime));

  if (allAgents.length === 0) return [];

  // Collapse consecutive duplicate types FIRST (before slicing)
  const collapsed = [];
  for (const agent of allAgents) {
    const type = agent.type || 'agent'; // fallback for missing type
    const last = collapsed[collapsed.length - 1];
    if (last && last.type === type && last.status === agent.status) {
      last.count++;
      last.agents.push(agent);
    } else {
      collapsed.push({ type, status: agent.status, count: 1, agents: [agent] });
    }
  }

  // THEN slice to show last 4 collapsed groups
  const toShow = collapsed.slice(-4);

  // Build compact flow line with dots and ×N for duplicates
  const flowParts = toShow.map(group => {
    const icon = group.status === 'running' ? yellow('●') : dim('○');
    const suffix = group.count > 1 ? ` ×${group.count}` : '';
    return `${icon} ${group.type}${suffix}`;
  });

  const lines = [];
  const completedCount = agents.filter(a => a.status === 'completed').length;
  const flowSuffix = completedCount > 2 ? ` ${dim(`(${completedCount} done)`)}` : '';
  lines.push(flowParts.join(' → ') + flowSuffix);

  // Add indented task description for running agent, or last completed if none running
  const runningAgent = running[0];
  const lastCompleted = completed[completed.length - 1];
  const detailAgent = runningAgent || lastCompleted;

  if (detailAgent && detailAgent.description) {
    const desc = detailAgent.description.length > 50
      ? detailAgent.description.slice(0, 47) + '...'
      : detailAgent.description;
    const elapsed = formatElapsed(detailAgent.startTime, detailAgent.endTime);
    const icon = detailAgent.status === 'running' ? yellow('▸') : dim('▸');
    lines.push(`   ${icon} ${desc} ${dim(`(${elapsed})`)}`);
  }

  return lines;
}

/**
 * Render todos line (if todos exist)
 * In-progress task with activeForm + detailed progress (done/pending)
 */
function renderTodosLine(transcript) {
  const { todos } = transcript;
  if (!todos || todos.length === 0) return null;

  const inProgress = todos.find(t => t.status === 'in_progress');
  const completedCount = todos.filter(t => t.status === 'completed').length;
  const pendingCount = todos.filter(t => t.status === 'pending').length;
  const total = todos.length;

  if (!inProgress) {
    if (completedCount === total && total > 0) {
      return `${green('✓')} All ${total} todos complete`;
    }
    // Show pending if no in_progress
    if (pendingCount > 0) {
      const nextPending = todos.find(t => t.status === 'pending');
      const nextTask = nextPending?.content || 'Next task';
      const display = nextTask.length > 40 ? nextTask.slice(0, 37) + '...' : nextTask;
      return `${dim('○')} Next: ${display} ${dim(`(${completedCount} done, ${pendingCount} pending)`)}`;
    }
    return null;
  }

  // Show activeForm (present continuous) if available, else content
  const displayText = inProgress.activeForm || inProgress.content;
  const display = displayText.length > 50 ? displayText.slice(0, 47) + '...' : displayText;
  return `${yellow('▸')} ${display} ${dim(`(${completedCount} done, ${pendingCount} pending)`)}`;
}

/**
 * Render minimal mode - single line with emojis, no progress bar
 * Format: "🤖 opus 4.5  🔋 50%  ⏰ 2h 16m (38%)  🌿 branch  📁 ~/path"
 */
function renderMinimal(ctx) {
  const parts = [`🤖 ${ctx.modelName}`];
  if (ctx.contextPercent > 0) {
    const batteryIcon = ctx.contextPercent > 70 ? red('🔋') : '🔋';
    parts.push(`${batteryIcon} ${ctx.contextPercent}%`);
  }
  const usageStr = buildUsageString(ctx);
  if (usageStr) parts.push(`⏰ ${usageStr}`);
  if (ctx.gitBranch) parts.push(`🌿 ${ctx.gitBranch}`);
  parts.push(`📁 ${ctx.currentDir}`);
  console.log(parts.join('  '));
}

/**
 * Render compact mode - 2 lines: session info + location (branch + dir)
 */
function renderCompact(ctx) {
  // Line 1: Session info (model + context + usage)
  let line1 = `🤖 ${ctx.modelName}`;
  if (ctx.contextPercent > 0) {
    line1 += `  ${coloredBar(ctx.contextPercent, 12)} ${ctx.contextPercent}%`;
  }
  const usageStr = buildUsageString(ctx);
  if (usageStr) line1 += `  ⌛ ${usageStr}`;
  console.log(line1.replace(/ /g, '\u00A0'));

  // Line 2: Location (branch + directory)
  let line2 = `📁 ${ctx.currentDir}`;
  if (ctx.gitBranch) line2 += `  🌿 ${ctx.gitBranch}`;
  console.log(line2.replace(/ /g, '\u00A0'));
}

/**
 * Main render function - outputs all lines
 * Falls back to single line if multi-line fails
 */
function render(ctx, singleLineMode = false) {
  const lines = [];

  // Session lines (cleaner multi-line layout)
  const sessionLines = renderSessionLines(ctx);
  lines.push(...sessionLines);

  if (!singleLineMode) {
    // Agents lines (one per agent for clarity)
    const agentsLines = renderAgentsLines(ctx.transcript);
    lines.push(...agentsLines);

    // Todos line (if exist)
    const todosLine = renderTodosLine(ctx.transcript);
    if (todosLine) lines.push(todosLine);
  }

  // Output all lines with non-breaking spaces for alignment
  for (const line of lines) {
    const outputLine = shouldUseColor ? `${RESET}${line.replace(/ /g, '\u00A0')}` : line;
    console.log(outputLine);
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  try {
    const input = await readStdin();
    if (!input.trim()) {
      console.error('No input provided');
      process.exit(1);
    }

    const data = JSON.parse(input);

    // Extract basic information
    let currentDir = data.workspace?.current_dir || data.cwd || 'unknown';
    currentDir = expandHome(currentDir);

    const modelName = data.model?.display_name || 'Claude';

    // Git detection
    let gitBranch = '';
    let gitUnstaged = 0;
    let gitStaged = 0;
    let gitAhead = 0;
    let gitBehind = 0;
    if (exec('git rev-parse --git-dir')) {
      gitBranch = exec('git branch --show-current') || exec('git rev-parse --short HEAD');
      const unstagedOutput = exec('git diff --name-only');
      if (unstagedOutput) gitUnstaged = unstagedOutput.split('\n').filter(l => l.trim()).length;
      // Staged files count
      const stagedOutput = exec('git diff --cached --name-only');
      if (stagedOutput) gitStaged = stagedOutput.split('\n').filter(l => l.trim()).length;
      // Ahead/behind upstream
      const aheadBehind = exec('git rev-list --left-right --count @{u}...HEAD 2>/dev/null');
      if (aheadBehind) {
        const parts = aheadBehind.split(/\s+/);
        gitBehind = parseInt(parts[0], 10) || 0;
        gitAhead = parseInt(parts[1], 10) || 0;
      }
    }

    // Active plan detection - read from session temp file
    let activePlan = '';
    try {
      const sessionId = data.session_id;
      if (sessionId) {
        const sessionPath = path.join(os.tmpdir(), `ck-session-${sessionId}.json`);
        if (fs.existsSync(sessionPath)) {
          const session = JSON.parse(fs.readFileSync(sessionPath, 'utf8'));
          const planPath = session.activePlan?.trim();
          if (planPath) {
            // Extract slug from path like "plans/260106-1554-statusline-visual"
            const match = planPath.match(/plans\/\d+-\d+-(.+?)(?:\/|$)/);
            activePlan = match ? match[1] : planPath.split('/').pop();
          }
        }
      }
    } catch {}

    // Context window - use current_usage fields with AUTOCOMPACT_BUFFER
    const usage = data.context_window?.current_usage || {};
    const contextSize = data.context_window?.context_window_size || 0;
    let contextPercent = 0;
    let totalTokens = 0;

    if (contextSize > 0 && contextSize > AUTOCOMPACT_BUFFER) {
      totalTokens = (usage.input_tokens ?? 0) +
                    (usage.cache_creation_input_tokens ?? 0) +
                    (usage.cache_read_input_tokens ?? 0);

      // Add buffer to match /context calculation
      contextPercent = Math.min(100, Math.round(((totalTokens + AUTOCOMPACT_BUFFER) / contextSize) * 100));
    }

    // Write context data to temp file for hooks to read
    const sessionId = data.session_id;
    if (sessionId && contextSize > 0) {
      try {
        const contextDataPath = path.join(os.tmpdir(), `ck-context-${sessionId}.json`);
        fs.writeFileSync(contextDataPath, JSON.stringify({
          percent: contextPercent,
          tokens: totalTokens,
          size: contextSize,
          usage: usage,
          timestamp: Date.now()
        }));
      } catch {}
    }

    // Session timer - read actual reset time from usage limits cache
    let sessionText = '';
    const transcriptPath = data.transcript_path;

    // Parse transcript for tools/agents/todos
    const transcript = transcriptPath ? await parseTranscript(transcriptPath) : { tools: [], agents: [], todos: [], sessionStart: null };

    // Read actual reset time and utilization from usage limits cache (written by usage-context-awareness hook)
    let usagePercent = null;
    try {
      const usageCachePath = path.join(os.tmpdir(), 'ck-usage-limits-cache.json');
      if (fs.existsSync(usageCachePath)) {
        const cache = JSON.parse(fs.readFileSync(usageCachePath, 'utf8'));

        // Check status flag for fallback (non-OAuth scenarios)
        if (cache.status === 'unavailable') {
          sessionText = 'N/A';
        } else {
          const fiveHour = cache.data?.five_hour;
          usagePercent = fiveHour?.utilization ?? null;
          const resetAt = fiveHour?.resets_at;
          if (resetAt) {
            const resetTime = new Date(resetAt);
            const remaining = Math.floor(resetTime.getTime() / 1000) - Math.floor(Date.now() / 1000);
            if (remaining > 0 && remaining < 18000) {
              const rh = Math.floor(remaining / 3600);
              const rm = Math.floor((remaining % 3600) / 60);
              sessionText = `${rh}h ${rm}m until reset`;
            }
          }
        }
      }
    } catch {}

    // Cost and lines changed
    const billingMode = env.CLAUDE_BILLING_MODE || 'api';
    const costUSD = data.cost?.total_cost_usd;
    const costText = billingMode === 'api' && costUSD && /^\d+(\.\d+)?$/.test(String(costUSD))
      ? `$${parseFloat(costUSD).toFixed(4)}`
      : null;
    const linesAdded = data.cost?.total_lines_added || 0;
    const linesRemoved = data.cost?.total_lines_removed || 0;

    // Config counts
    const rawDir = data.workspace?.current_dir || data.cwd || process.cwd();
    const configs = countConfigs(rawDir);

    // Build render context
    const ctx = {
      modelName,
      currentDir,
      gitBranch,
      gitUnstaged,
      gitStaged,
      gitAhead,
      gitBehind,
      activePlan,
      contextPercent,
      sessionText,
      usagePercent,
      costText,
      linesAdded,
      linesRemoved,
      configs,
      transcript
    };

    // Load config and get statusline mode
    const config = loadConfig({ includeProject: false, includeAssertions: false, includeLocale: false });
    const statuslineMode = config.statusline || 'full';

    // Render based on mode
    switch (statuslineMode) {
      case 'none':
        console.log('');
        break;
      case 'minimal':
        renderMinimal(ctx);
        break;
      case 'compact':
        renderCompact(ctx);
        break;
      case 'full':
      default:
        render(ctx, false);
        break;
    }

  } catch (err) {
    // Fallback: output minimal single line on any error
    console.log('📁 ' + (process.cwd() || 'unknown'));
  }
}

main().catch(() => {
  console.log('📁 error');
  process.exit(1);
});
