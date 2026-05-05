#!/usr/bin/env node
/**
 * TeammateIdle Hook - Injects available task context when teammate goes idle
 *
 * Fires: When an agent team teammate is about to go idle after finishing its turn.
 * Official docs: https://code.claude.com/docs/en/hooks#teammateidle
 * Decision control: Exit code only (exit 2 prevents idle, stderr fed as feedback)
 * Note: additionalContext output is informational — may be ignored by CC for this event.
 * Input: { teammate_name, team_name, permission_mode, ... }
 * Output: additionalContext summarizing available tasks for lead
 * Design: Non-blocking, fail-open (exit 0 always), no external deps
 */

// Crash wrapper
try {
  const fs = require('fs');
  const path = require('path');
  const os = require('os');
  const { isHookEnabled } = require('./lib/ck-config-utils.cjs');

  if (!isHookEnabled('teammate-idle-handler')) {
    process.exit(0);
  }

const TASKS_DIR = path.join(os.homedir(), '.claude', 'tasks');

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch { return null; }
}

function getAvailableTasks(teamName) {
  const taskDir = path.join(TASKS_DIR, teamName);
  try {
    if (!fs.existsSync(taskDir)) return null;
    const files = fs.readdirSync(taskDir).filter(f => f.endsWith('.json'));
    const tasks = files.map(f => readJson(path.join(taskDir, f))).filter(Boolean);

    const completedIds = new Set(
      tasks.filter(t => t.status === 'completed').map(t => t.id)
    );

    let pending = 0, inProgress = 0, completed = 0;
    const unblocked = [];

    for (const task of tasks) {
      if (task.status === 'completed') { completed++; continue; }
      if (task.status === 'in_progress') { inProgress++; continue; }
      if (task.status !== 'pending') continue;
      pending++;

      // Check if all blockers are completed
      const blockers = task.blockedBy || [];
      const isUnblocked = blockers.every(id => completedIds.has(id));
      if (isUnblocked && !task.owner) {
        unblocked.push({ id: task.id, subject: task.subject });
      }
    }

    return { pending, inProgress, completed, total: pending + inProgress + completed, unblocked };
  } catch { return null; }
}

function main() {
  try {
    const stdin = fs.readFileSync(0, 'utf-8').trim();
    if (!stdin) process.exit(0);

    const payload = JSON.parse(stdin);
    const { teammate_name, team_name } = payload;
    if (!team_name) process.exit(0);

    const taskInfo = getAvailableTasks(team_name);
    const lines = [];
    lines.push(`## Teammate Idle`);
    lines.push(`${teammate_name} is idle.`);

    if (taskInfo) {
      const remaining = taskInfo.pending + taskInfo.inProgress;
      lines.push(`Tasks: ${taskInfo.completed}/${taskInfo.total} done. ${remaining} remaining.`);

      if (taskInfo.unblocked.length > 0) {
        lines.push(`Unblocked & unassigned: ${taskInfo.unblocked.map(t => `#${t.id} "${t.subject}"`).join(', ')}`);
        lines.push(`Consider assigning work to ${teammate_name} or waking them with a message.`);
      } else if (remaining === 0) {
        lines.push(`No remaining tasks. Consider shutting down ${teammate_name}.`);
      } else {
        lines.push(`All remaining tasks are blocked or assigned. ${teammate_name} may be waiting for dependencies.`);
      }
    }

    const output = {
      hookSpecificOutput: {
        hookEventName: 'TeammateIdle',
        additionalContext: lines.join('\n')
      }
    };
    console.log(JSON.stringify(output));
    process.exit(0);
  } catch (error) {
    if (process.env.CK_DEBUG) {
      console.error(`[teammate-idle-handler] Error: ${error.message}`);
    }
    process.exit(0);
  }
  }

  main();
} catch (e) {
  // Minimal crash logging (zero deps — only Node builtins)
  try {
    const fs = require('fs');
    const p = require('path');
    const logDir = p.join(__dirname, '.logs');
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
    fs.appendFileSync(p.join(logDir, 'hook-log.jsonl'),
      JSON.stringify({ ts: new Date().toISOString(), hook: p.basename(__filename, '.cjs'), status: 'crash', error: e.message }) + '\n');
  } catch (_) {}
  process.exit(0); // fail-open
}
