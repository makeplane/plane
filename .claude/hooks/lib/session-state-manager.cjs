/**
 * Session State Manager - Persist/restore session progress across sessions
 * Storage: project .claude/session-state/ → fallback ~/.claude/session-states/{hash}/
 * Safety: Zero deps, fail-open, atomic writes, 7-day auto-expire
 * @module session-state-manager
 */
'use strict';

const fs = require('fs');
const path = require('path');
const os = require('os');
const crypto = require('crypto');

const MAX_ARCHIVES = 5;
const EXPIRY_DAYS = 7;
const EXEC_TIMEOUT_MS = 3000;
const STATE_FILENAME = 'latest.md';
const ARCHIVE_DIR = 'archive';

/** Resolve state dir: project-level preferred, global fallback for non-CK projects */
function getStateDir(cwd) {
  try {
    const projectDir = path.join(cwd, '.claude', 'session-state');
    if (fs.existsSync(path.join(cwd, '.claude'))) {
      if (!fs.existsSync(projectDir)) fs.mkdirSync(projectDir, { recursive: true });
      return projectDir;
    }
    const hash = crypto.createHash('md5').update(cwd).digest('hex').slice(0, 12);
    const globalDir = path.join(os.homedir(), '.claude', 'session-states', hash);
    if (!fs.existsSync(globalDir)) fs.mkdirSync(globalDir, { recursive: true });
    return globalDir;
  } catch { return null; }
}

/** Load previous session state. Returns null if missing or expired (>7 days) */
function loadState(cwd) {
  try {
    const stateDir = getStateDir(cwd);
    if (!stateDir) return null;
    const statePath = path.join(stateDir, STATE_FILENAME);
    if (!fs.existsSync(statePath)) return null;
    const content = fs.readFileSync(statePath, 'utf8');
    const tsMatch = content.match(/<!-- Generated: (.+?) -->/);
    if (tsMatch) {
      const parsed = new Date(tsMatch[1]).getTime();
      if (isNaN(parsed)) return null;
      if (Date.now() - parsed > EXPIRY_DAYS * 24 * 60 * 60 * 1000) return null;
    }
    return content;
  } catch { return null; }
}

/** Persist session state. SubagentStop appends, Stop finalizes + archives */
function persistState(stdinData, options) {
  try {
    const cwd = stdinData.cwd || process.cwd();
    const stateDir = getStateDir(cwd);
    if (!stateDir) return { success: false, path: null };
    const statePath = path.join(stateDir, STATE_FILENAME);

    if (options.eventType === 'SubagentStop') {
      const agentSection = buildAgentSection(stdinData);
      const existing = fs.existsSync(statePath) ? fs.readFileSync(statePath, 'utf8') : '';
      let updated;
      if (existing) {
        updated = existing.replace(/(\n## Key Files Modified)/, `\n${agentSection}$1`);
        // Fallback: if heading not found, append to end
        if (updated === existing) updated = existing.trimEnd() + '\n' + agentSection;
      } else {
        updated = buildStateContent(extractSessionData(stdinData)) + '\n' + agentSection;
      }
      writeAtomic(statePath, updated);
      return { success: true, path: statePath };
    }

    if (options.eventType === 'Stop') {
      const data = extractSessionData(stdinData);
      let content = buildStateContent(data);
      if (fs.existsSync(statePath)) {
        const existing = fs.readFileSync(statePath, 'utf8');
        const agentSections = extractAgentSections(existing);
        if (agentSections) {
          content = content.replace(/(\n## Key Files Modified)/, `\n${agentSections}$1`);
        }
      }
      writeAtomic(statePath, content);
      archiveState(stateDir);
      return { success: true, path: statePath };
    }
    return { success: false, path: null };
  } catch { return { success: false, path: null }; }
}

/** Archive current state, rotate old archives (keep last 5) */
function archiveState(stateDir) {
  try {
    const statePath = path.join(stateDir, STATE_FILENAME);
    if (!fs.existsSync(statePath)) return;
    const archiveDir = path.join(stateDir, ARCHIVE_DIR);
    if (!fs.existsSync(archiveDir)) fs.mkdirSync(archiveDir, { recursive: true });
    const now = new Date();
    const ts = `${now.getFullYear()}${p2(now.getMonth() + 1)}${p2(now.getDate())}-${p2(now.getHours())}${p2(now.getMinutes())}`;
    fs.copyFileSync(statePath, path.join(archiveDir, `${ts}.md`));
    const entries = fs.readdirSync(archiveDir).filter(f => f.endsWith('.md')).sort();
    while (entries.length > MAX_ARCHIVES) {
      try { fs.unlinkSync(path.join(archiveDir, entries.shift())); } catch { /* ignore */ }
    }
  } catch { /* fail-open */ }
}

/** Extract todos from transcript + env vars + git diff */
function extractSessionData(stdinData) {
  const data = {
    timestamp: new Date().toISOString(),
    branch: process.env.CK_GIT_BRANCH || '',
    plan: process.env.CK_ACTIVE_PLAN || '',
    todos: [], modifiedFiles: []
  };
  // Extract todos from transcript JSONL
  if (stdinData.transcript_path) {
    try {
      const lines = fs.readFileSync(stdinData.transcript_path, 'utf8').split('\n').filter(Boolean);
      const latest = [];
      for (const line of lines) {
        try {
          const entry = JSON.parse(line);
          const blocks = entry.message?.content;
          if (!Array.isArray(blocks)) continue;
          for (const block of blocks) {
            if (block.type === 'tool_use' && block.name === 'TodoWrite' && Array.isArray(block.input?.todos)) {
              latest.length = 0;
              latest.push(...block.input.todos);
            }
          }
        } catch { /* skip */ }
      }
      data.todos = latest;
    } catch { /* transcript unavailable */ }
  }
  // Modified files via git
  try {
    const diff = require('child_process').execSync('git diff --name-only HEAD 2>/dev/null', {
      encoding: 'utf8', timeout: EXEC_TIMEOUT_MS, stdio: ['pipe', 'pipe', 'pipe']
    }).trim();
    if (diff) data.modifiedFiles = diff.split('\n').slice(0, 20);
  } catch { /* no git */ }
  return data;
}

/** Build structured markdown state from session data */
function buildStateContent(data) {
  const completed = data.todos.filter(t => t.status === 'completed');
  const pending = data.todos.filter(t => t.status !== 'completed');
  const lines = [
    '# Session State',
    `<!-- Generated: ${data.timestamp} -->`,
    `<!-- Branch: ${data.branch || 'unknown'} -->`,
    `<!-- Plan: ${data.plan || 'none'} -->`,
    '',
    '## What Worked (Verified)',
    ...(completed.length ? completed.map(t => `- ${t.content}`) : ['- (No completed tasks recorded)']),
    '',
    "## What's Left",
    ...(pending.length ? pending.map(t => `- [ ] ${t.content}`) : ['- (All tasks completed)']),
    ''
  ];
  if (data.plan) lines.push('## Active Plan', data.plan, '');
  lines.push('## Key Files Modified',
    ...(data.modifiedFiles.length ? data.modifiedFiles.map(f => `- ${f}`) : ['- (No file changes detected)']),
    '');
  return lines.join('\n');
}

/** Build markdown section for a completed subagent */
function buildAgentSection(stdinData) {
  const type = stdinData.agent_type || 'unknown';
  const ts = new Date().toISOString().slice(11, 19);
  return `\n## Agent Result: ${type} (${ts})\n- Completed at ${ts}\n`;
}

/** Extract agent result sections from existing state content */
function extractAgentSections(content) {
  const matches = content.match(/## Agent Result:.+?(?=\n## |$)/gs);
  return matches ? matches.join('\n') : null;
}

/** Atomic write: temp file + rename */
function writeAtomic(filePath, content) {
  const tmp = `${filePath}.${process.pid}.${Math.random().toString(36).slice(2)}.tmp`;
  fs.writeFileSync(tmp, content);
  fs.renameSync(tmp, filePath);
}

function p2(n) { return String(n).padStart(2, '0'); }

module.exports = { getStateDir, loadState, persistState, archiveState, extractSessionData, buildStateContent, buildAgentSection, writeAtomic };
