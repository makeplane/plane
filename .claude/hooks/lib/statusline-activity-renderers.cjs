'use strict';

/**
 * Statusline activity section renderers — agents flow and todos line.
 *
 * These are "multi-line" sections handled outside the flat section registry
 * because they produce 0-2 lines each and require special composition logic.
 *
 * Separated from statusline-render-modes.cjs to keep files under 200 lines.
 */

const { yellow, green, dim, resolveColor } = require('./colors.cjs');
const { formatElapsed, safeGetTime } = require('./statusline-string-utils.cjs');

function getActivityTint(sectionConfig, fallback) {
  return sectionConfig?.color ? resolveColor(sectionConfig.color) : fallback;
}

/**
 * Render agent flow lines as compact chronological flow with duplicate collapsing.
 * Format:
 *   ○ type ×N → ● type (N done)
 *   ▸ description (elapsed)
 *
 * @param {Object} transcript - Activity snapshot { agents, todos }
 * @param {number} maxRows - Max collapsed groups to show (from layout.maxAgentRows)
 * @returns {string[]} 0–2 lines
 */
function renderAgentsLines(transcript, maxRows, sectionConfig = {}) {
  const { agents } = transcript;
  if (!agents || agents.length === 0) return [];

  const running   = agents.filter(a => a.status === 'running');
  const completed = agents.filter(a => a.status === 'completed');

  const allAgents = [...running, ...completed];
  allAgents.sort((a, b) => safeGetTime(a.startTime) - safeGetTime(b.startTime));
  if (allAgents.length === 0) return [];

  // Collapse consecutive same-type/status groups before slicing
  const collapsed = [];
  for (const agent of allAgents) {
    const type = agent.type || 'agent';
    const last = collapsed[collapsed.length - 1];
    if (last && last.type === type && last.status === agent.status) {
      last.count++;
      last.agents.push(agent);
    } else {
      collapsed.push({ type, status: agent.status, count: 1, agents: [agent] });
    }
  }

  // maxRows=0 means hide agents entirely
  if (typeof maxRows === 'number' && maxRows <= 0) return [];
  const limit  = typeof maxRows === 'number' && maxRows > 0 ? maxRows : 4;
  const toShow = collapsed.slice(-limit);
  const tint = getActivityTint(sectionConfig, yellow);
  const completedTint = sectionConfig.color ? tint : dim;

  const flowParts = toShow.map(group => {
    const renderTone = group.status === 'running' ? tint : completedTint;
    const icon   = renderTone(group.status === 'running' ? '●' : '○');
    const suffix = group.count > 1 ? ` ×${group.count}` : '';
    return `${icon} ${renderTone(`${group.type}${suffix}`)}`;
  });

  const lines = [];
  const completedCount = agents.filter(a => a.status === 'completed').length;
  const flowSuffix = completedCount > 2 ? ` ${completedTint(`(${completedCount} done)`)}` : '';
  lines.push(flowParts.join(' → ') + flowSuffix);

  // Detail line: running agent (or last completed) description + elapsed
  const detailAgent = running[0] || completed[completed.length - 1];
  if (detailAgent && detailAgent.description) {
    const desc = detailAgent.description.length > 50
      ? detailAgent.description.slice(0, 47) + '...'
      : detailAgent.description;
    const elapsed = formatElapsed(detailAgent.startTime, detailAgent.endTime);
    const renderTone = detailAgent.status === 'running' ? tint : completedTint;
    const icon = renderTone(sectionConfig.icon || '▸');
    lines.push(`   ${icon} ${renderTone(desc)} ${completedTint(`(${elapsed})`)}`);
  }

  return lines;
}

/**
 * Render current todo status as a single line.
 * Shows: in-progress task, next pending task, or "all done" summary.
 *
 * @param {Object} transcript - Activity snapshot { agents, todos }
 * @param {number} truncation - Max chars for task text (from layout.todoTruncation)
 * @returns {string|null} Rendered line or null when nothing to show
 */
function renderTodosLine(transcript, truncation, sectionConfig = {}) {
  const { todos } = transcript;
  if (!todos || todos.length === 0) return null;

  const limit          = typeof truncation === 'number' && truncation > 0 ? truncation : 50;
  const inProgress     = todos.find(t => t.status === 'in_progress');
  const completedCount = todos.filter(t => t.status === 'completed').length;
  const pendingCount   = todos.filter(t => t.status === 'pending').length;
  const total          = todos.length;
  const tint = getActivityTint(sectionConfig, yellow);
  const successTint = getActivityTint(sectionConfig, green);
  const mutedTint = sectionConfig.color ? tint : dim;

  if (!inProgress) {
    if (completedCount === total && total > 0) {
      return `${successTint(sectionConfig.icon || '✓')} ${successTint(`All ${total} todos complete`)}`;
    }
    if (pendingCount > 0) {
      const nextPending = todos.find(t => t.status === 'pending');
      const nextTask    = nextPending?.content || 'Next task';
      const display     = nextTask.length > 40 ? nextTask.slice(0, 37) + '...' : nextTask;
      return `${mutedTint(sectionConfig.icon || '○')} ${mutedTint(`Next: ${display}`)} ${mutedTint(`(${completedCount} done, ${pendingCount} pending)`)}`;
    }
    return null;
  }

  const displayText = inProgress.activeForm || inProgress.content || '';
  if (!displayText || displayText.length === 0) return null;
  const display     = displayText.length > limit ? displayText.slice(0, limit - 3) + '...' : displayText;
  return `${tint(sectionConfig.icon || '▸')} ${tint(display)} ${mutedTint(`(${completedCount} done, ${pendingCount} pending)`)}`;
}

module.exports = { renderAgentsLines, renderTodosLine };
