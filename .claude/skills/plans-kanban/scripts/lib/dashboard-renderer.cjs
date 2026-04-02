/**
 * Dashboard Renderer
 * Generates HTML for the enhanced plans dashboard view with glassmorphism design
 *
 * @module dashboard-renderer
 */

const fs = require('fs');
const path = require('path');
const {
  generateTimelineStats,
  generateActivityHeatmap
} = require('./plan-metadata-extractor.cjs');

/**
 * Escape HTML special characters to prevent XSS
 * @param {string} str - String to escape
 * @returns {string} - Escaped string
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Truncate text to specified length with ellipsis
 * @param {string} text - Text to truncate
 * @param {number} maxLen - Maximum length
 * @returns {string} - Truncated text
 */
function truncate(text, maxLen = 100) {
  if (!text) return '';
  if (text.length <= maxLen) return text;
  return text.slice(0, maxLen - 3).trim() + '...';
}

/**
 * Get priority color class based on priority level
 * @param {string} priority - Priority string (P1/P2/P3 or High/Medium/Low)
 * @returns {string} - CSS class name
 */
function getPriorityColorClass(priority) {
  if (!priority) return '';
  const p = String(priority).toUpperCase();
  if (p === 'P1' || p === 'HIGH' || p === 'CRITICAL') return 'priority-high';
  if (p === 'P2' || p === 'MEDIUM' || p === 'NORMAL') return 'priority-medium';
  if (p === 'P3' || p === 'LOW') return 'priority-low';
  return '';
}

/**
 * Format date for display
 * @param {string} isoDate - ISO date string
 * @returns {string} - Formatted date
 */
function formatDate(isoDate) {
  if (!isoDate) return '';
  const date = new Date(isoDate);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
}

/**
 * Format relative time (e.g., "2 days ago")
 * @param {string} isoDate - ISO date string
 * @returns {string} - Relative time string
 */
function formatRelativeTime(isoDate) {
  if (!isoDate) return '';
  const date = new Date(isoDate);
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

/**
 * Get human-readable status label
 * @param {string} status - Status code
 * @returns {string} - Human-readable label
 */
function getStatusLabel(status) {
  const labels = {
    'completed': 'Completed',
    'complete': 'Completed',
    'in-progress': 'In Progress',
    'in-review': 'In Review',
    'cancelled': 'Cancelled',
    'pending': 'Pending'
  };
  return labels[status] || 'Pending';
}

/**
 * Generate SVG progress ring (kept for backward compatibility but hidden in new design)
 * @param {number} progress - Progress percentage (0-100)
 * @returns {string} - SVG HTML
 */
function generateProgressRing(progress) {
  // Hidden in new minimal design - kept for compatibility
  return '';
}

/**
 * Generate simple progress bar (monochrome design)
 * @param {{total: number, completed: number, inProgress: number, pending: number}} phases
 * @returns {string} - Progress bar HTML
 */
function generateProgressBar(phases) {
  const total = phases.total || 1;
  const completedPct = ((phases.completed / total) * 100).toFixed(1);
  const inProgressPct = ((phases.inProgress / total) * 100).toFixed(1);

  return `
    <div class="progress-bar" role="progressbar"
         aria-valuenow="${phases.completed}" aria-valuemin="0" aria-valuemax="${total}"
         aria-label="Progress: ${phases.completed} of ${total} phases completed">
      <div class="bar-segment completed" style="width: ${completedPct}%"></div>
      <div class="bar-segment in-progress" style="width: ${inProgressPct}%"></div>
    </div>
    <div class="phase-count"><strong>${phases.completed}</strong> of ${total} phases</div>
  `;
}

/**
 * Generate status counts HTML (hidden in minimal design)
 * @param {{completed: number, inProgress: number, pending: number}} phases
 * @returns {string} - Status counts HTML
 */
function generateStatusCounts(phases) {
  // Hidden in minimal design
  return '';
}

/**
 * Generate status badge HTML (simplified for monochrome design)
 * @param {string} status - Status string
 * @returns {string} - Status badge HTML
 */
function generateStatusBadge(status) {
  const statusClass = (status || 'pending').replace(/\s+/g, '-');
  // Simplified labels for minimal design
  const labels = {
    'completed': 'Done',
    'complete': 'Done',
    'in-progress': 'Active',
    'pending': 'Pending'
  };
  const label = labels[statusClass] || 'Pending';
  return `<span class="status-badge ${statusClass}">${label}</span>`;
}

/**
 * Generate meta tags HTML for plan card (duration, effort, priority, issue, tags)
 * @param {Object} plan - Plan metadata
 * @returns {string} - Meta tags HTML
 */
function generateCardMeta(plan) {
  const metaTags = [];

  // Duration tag
  if (plan.durationFormatted) {
    const icon = '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>';
    metaTags.push(`<span class="meta-tag duration" title="Duration">${icon} ${escapeHtml(plan.durationFormatted)}</span>`);
  }

  // Effort tag
  if (plan.totalEffortFormatted) {
    metaTags.push(`<span class="meta-tag effort" title="Estimated effort"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg> ${escapeHtml(plan.totalEffortFormatted)}</span>`);
  }

  // Priority tag with color class
  if (plan.priority) {
    const priorityColorClass = getPriorityColorClass(plan.priority);
    metaTags.push(`<span class="meta-tag priority ${priorityColorClass}" title="Priority">${escapeHtml(plan.priority)}</span>`);
  }

  // Issue tag - clickable link to GitHub (uses branch to derive repo, falls back to claudekit)
  if (plan.issue) {
    // TODO: Make repo configurable via project settings
    const issueUrl = `https://github.com/claudekit/claudekit/issues/${plan.issue}`;
    metaTags.push(`<a href="${issueUrl}" target="_blank" rel="noopener" class="meta-tag issue" title="Issue #${plan.issue}"><svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg> #${plan.issue}</a>`);
  }

  if (metaTags.length === 0) return '';
  return `<div class="card-meta">${metaTags.join('')}</div>`;
}

/**
 * Generate tags pills HTML
 * @param {Array<string>} tags - Array of tag strings
 * @param {number} maxVisible - Maximum visible tags (default 3)
 * @returns {string} - Tags HTML
 */
function generateTagsPills(tags, maxVisible = 3) {
  if (!tags || !Array.isArray(tags) || tags.length === 0) return '';

  const visibleTags = tags.slice(0, maxVisible);
  const hiddenCount = tags.length - maxVisible;

  let html = '<div class="card-tags">';
  html += visibleTags.map(tag =>
    `<span class="tag-pill">${escapeHtml(tag)}</span>`
  ).join('');

  if (hiddenCount > 0) {
    html += `<span class="tag-pill tag-more">+${hiddenCount}</span>`;
  }
  html += '</div>';

  return html;
}

/**
 * Generate HTML for a single plan card (minimal design with rich metadata)
 * @param {Object} plan - Plan metadata
 * @returns {string} - Card HTML
 */
function generatePlanCard(plan) {
  const statusClass = (plan.status || 'pending').replace(/\s+/g, '-');
  const name = escapeHtml(plan.name);
  const relativeTime = formatRelativeTime(plan.lastModified);
  const cardMeta = generateCardMeta(plan);

  // Description section (truncated)
  const descriptionHtml = plan.description
    ? `<p class="card-description">${escapeHtml(truncate(plan.description, 100))}</p>`
    : '';

  // Tags pills
  const tagsHtml = generateTagsPills(plan.tags);

  return `
    <article class="plan-card" data-status="${statusClass}" data-id="${escapeHtml(plan.id)}" tabindex="0"
             data-created="${plan.createdDate || ''}" data-duration="${plan.durationDays || 0}"
             data-effort="${plan.totalEffortHours || 0}" data-priority="${plan.priority || ''}">
      <header class="card-header">
        <div class="card-header-content">
          <h2 class="plan-name">${name}</h2>
          <div class="plan-date">
            <time datetime="${plan.lastModified}">${relativeTime}</time>
          </div>
        </div>
        ${generateStatusBadge(statusClass)}
      </header>
      <div class="card-body">
        ${descriptionHtml}
        ${generateProgressBar(plan.phases)}
        ${cardMeta}
        ${tagsHtml}
      </div>
      <footer class="card-footer">
        <div class="phases-summary">${plan.phases.total} phases total</div>
        <a href="/view?file=${encodeURIComponent(plan.path)}" class="view-btn">
          View
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </a>
      </footer>
    </article>
  `;
}

/**
 * Auto-stack plans into layers to avoid overlap (like Google Calendar)
 * Uses actual plan duration for in-progress items instead of extending to today
 * @param {Array} plans - Plans with createdDate and durationDays
 * @param {Date} rangeStart - Start of visible range
 * @param {Date} rangeEnd - End of visible range
 * @returns {Array} - Plans with layer assignments
 */
function assignLayers(plans, rangeStart, rangeEnd) {
  const rangeDays = Math.ceil((rangeEnd - rangeStart) / (1000 * 60 * 60 * 24));
  const now = new Date();
  const layers = []; // Each layer tracks occupied day ranges

  // Filter to plans with dates, then sort by start date
  const sorted = [...plans]
    .filter(p => p.createdDate)
    .sort((a, b) => new Date(a.createdDate) - new Date(b.createdDate));

  // Filter to plans within visible range
  const visible = sorted.filter(plan => {
    const startDate = new Date(plan.createdDate);
    const endDate = plan.completedDate
      ? new Date(plan.completedDate)
      : new Date(startDate.getTime() + (plan.durationDays || 1) * 24 * 60 * 60 * 1000);
    return endDate >= rangeStart && startDate <= rangeEnd;
  });

  return visible.map(plan => {
    const startDate = new Date(plan.createdDate);
    // Determine end date based on status
    let endDate;
    if (plan.completedDate) {
      endDate = new Date(plan.completedDate);
    } else if (plan.status === 'completed') {
      // Completed without explicit date: use lastModified or cap at today
      endDate = plan.lastModified ? new Date(plan.lastModified) : now;
    } else {
      // In-progress/pending: use duration from start
      endDate = new Date(startDate.getTime() + Math.max(1, plan.durationDays || 1) * 24 * 60 * 60 * 1000);
    }
    // Completed plans can't extend past today
    if (plan.status === 'completed' && endDate > now) {
      endDate = now;
    }

    // Calculate position as percentage (clamp to range)
    const startDay = Math.max(0, Math.ceil((startDate - rangeStart) / (1000 * 60 * 60 * 24)));
    const endDay = Math.min(rangeDays, Math.ceil((endDate - rangeStart) / (1000 * 60 * 60 * 24)));

    // Ensure minimum visible width (2 days)
    const adjustedEndDay = Math.max(startDay + 2, endDay);
    const leftPct = (startDay / rangeDays) * 100;
    const widthPct = Math.min(100 - leftPct, Math.max(4, ((adjustedEndDay - startDay) / rangeDays) * 100));

    // Find first layer without overlap (greedy algorithm)
    let layer = 0;
    let foundSlot = false;
    for (let i = 0; i < layers.length; i++) {
      const hasOverlap = layers[i].some(range =>
        !(adjustedEndDay <= range.start || startDay >= range.end)
      );
      if (!hasOverlap) {
        layer = i;
        foundSlot = true;
        break;
      }
    }
    if (!foundSlot) {
      layer = layers.length;
    }

    // Add to layer
    if (!layers[layer]) layers[layer] = [];
    layers[layer].push({ start: startDay, end: adjustedEndDay });

    return { ...plan, layer, leftPct, widthPct, startDay, endDay: adjustedEndDay };
  });
}

/**
 * Generate timeline section HTML with Layered Gantt
 * @param {Array} plans - Array of plan metadata objects
 * @returns {string} - Timeline section HTML
 */
function generateTimelineSection(plans) {
  if (!plans || plans.length === 0) return '';

  const stats = generateTimelineStats(plans);

  // Calculate date range (last 3 weeks to now + 1 week)
  const now = new Date();
  const rangeStart = new Date(now.getTime() - 21 * 24 * 60 * 60 * 1000);
  const rangeEnd = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
  const rangeDays = Math.ceil((rangeEnd - rangeStart) / (1000 * 60 * 60 * 24));

  // Generate date axis labels (7 markers)
  const axisLabels = [];
  for (let i = 0; i < 7; i++) {
    const date = new Date(rangeStart.getTime() + (i * rangeDays / 6) * 24 * 60 * 60 * 1000);
    const isToday = date.toDateString() === now.toDateString();
    axisLabels.push({
      label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      isToday
    });
  }

  const axisHtml = axisLabels.map(a =>
    `<span class="gantt-axis-label${a.isToday ? ' today' : ''}">${a.label}</span>`
  ).join('');

  // Calculate today marker position
  const todayPct = ((now - rangeStart) / (rangeEnd - rangeStart)) * 100;

  // Auto-stack plans into layers
  const layeredPlans = assignLayers(plans, rangeStart, rangeEnd);
  const maxLayer = layeredPlans.length > 0 ? Math.max(...layeredPlans.map(p => p.layer), 0) : 0;
  // Compact layout: 22px per layer (bar 18px + 4px gap), no max cap
  const trackHeight = Math.max(60, (maxLayer + 1) * 22 + 12);

  // Generate gantt bars
  const barsHtml = layeredPlans.map(plan => {
    const statusClass = plan.status === 'completed' ? 'completed'
      : plan.status === 'in-progress' ? 'in-progress' : 'pending';
    const top = plan.layer * 22 + 6;
    const statusIcon = plan.status === 'completed' ? '✓' : plan.status === 'in-progress' ? '◐' : '○';

    return `
      <a href="/view?file=${encodeURIComponent(plan.path)}" class="gantt-bar ${statusClass}"
           style="left: ${plan.leftPct.toFixed(1)}%; width: ${plan.widthPct.toFixed(1)}%; top: ${top}px;"
           data-id="${escapeHtml(plan.id)}">
        <span class="gantt-bar-label">${escapeHtml(plan.name)}</span>
        <span class="gantt-bar-status">${statusIcon}</span>
        <div class="gantt-tooltip">
          <div class="gantt-tooltip-title">${escapeHtml(plan.name)}</div>
          <div class="gantt-tooltip-meta">
            <span>${plan.durationFormatted || 'Today'}</span>
            <span>${plan.phases.completed}/${plan.phases.total} phases</span>
            ${plan.totalEffortFormatted ? `<span>${plan.totalEffortFormatted}</span>` : ''}
          </div>
        </div>
      </a>
    `;
  }).join('');

  // Summary counts
  const completedCount = plans.filter(p => p.status === 'completed').length;
  const activeCount = plans.filter(p => p.status === 'in-progress').length;
  const pendingCount = plans.filter(p => p.status === 'pending').length;

  return `
    <section class="timeline-section" aria-label="Project timeline">
      <div class="timeline-header">
        <h2 class="timeline-title">Timeline</h2>
        <div class="timeline-stats">
          <div class="timeline-stat">
            <span>Avg:</span>
            <strong>${stats.avgDurationDays}d</strong>
          </div>
          <div class="timeline-stat">
            <span>Effort:</span>
            <strong>${stats.totalEffortHours.toFixed(0)}h</strong>
          </div>
        </div>
      </div>
      <div class="gantt-container">
        <div class="gantt-axis">${axisHtml}</div>
        <div class="gantt-track" style="height: ${trackHeight}px;">
          <div class="gantt-today-marker" style="left: ${todayPct.toFixed(1)}%;"></div>
          ${barsHtml}
        </div>
      </div>
      <div class="timeline-summary">
        <div class="timeline-summary-item">
          <span class="timeline-summary-dot completed"></span>
          <span>${completedCount} done</span>
        </div>
        <div class="timeline-summary-item">
          <span class="timeline-summary-dot in-progress"></span>
          <span>${activeCount} active</span>
        </div>
        <div class="timeline-summary-item">
          <span class="timeline-summary-dot pending"></span>
          <span>${pendingCount} pending</span>
        </div>
      </div>
    </section>
  `;
}

/**
 * Generate empty state HTML with animated icon
 * @returns {string} - Empty state HTML
 */
function generateEmptyState() {
  return `
    <div class="empty-state" hidden>
      <div class="empty-icon" aria-hidden="true">
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="16" y1="13" x2="8" y2="13"/>
          <line x1="16" y1="17" x2="8" y2="17"/>
          <polyline points="10 9 9 9 8 9"/>
        </svg>
      </div>
      <h2>No plans found</h2>
      <p>Create a plan directory with a plan.md file to get started with tracking your projects.</p>
    </div>
  `;
}

/**
 * Generate plans grid HTML
 * @param {Array} plans - Array of plan metadata objects
 * @returns {string} - Grid HTML
 */
function generatePlansGrid(plans) {
  if (!plans || plans.length === 0) {
    return '';
  }

  return plans.map(generatePlanCard).join('\n');
}

/**
 * Status column configuration for kanban board
 */
const STATUS_COLUMNS = [
  { id: 'pending', label: 'Pending', color: 'pending' },
  { id: 'in-progress', label: 'In Progress', color: 'in-progress' },
  { id: 'in-review', label: 'In Review', color: 'in-review' },
  { id: 'completed', label: 'Done', color: 'completed' },
  { id: 'cancelled', label: 'Cancelled', color: 'cancelled' }
];

/**
 * Generate kanban card HTML for a single plan (enhanced with details)
 * @param {Object} plan - Plan metadata
 * @returns {string} - Card HTML
 */
function generateKanbanCard(plan) {
  const progressPct = Math.round(plan.progress || 0);
  const dateStr = formatRelativeTime(plan.lastModified);

  // Priority badge
  let priorityHtml = '';
  if (plan.priority) {
    const priorityColorClass = getPriorityColorClass(plan.priority);
    if (priorityColorClass) {
      priorityHtml = `<span class="kanban-card-priority ${priorityColorClass}">${escapeHtml(plan.priority)}</span>`;
    }
  }

  // Description (truncated)
  let descriptionHtml = '';
  if (plan.description) {
    descriptionHtml = `<p class="kanban-card-description">${escapeHtml(truncate(plan.description, 80))}</p>`;
  }

  // Tags (max 3 visible)
  let tagsHtml = '';
  if (plan.tags && Array.isArray(plan.tags) && plan.tags.length > 0) {
    const visibleTags = plan.tags.slice(0, 3);
    const hiddenCount = plan.tags.length - 3;
    tagsHtml = '<div class="kanban-card-tags">';
    tagsHtml += visibleTags.map(tag => `<span class="kanban-card-tag">${escapeHtml(tag)}</span>`).join('');
    if (hiddenCount > 0) {
      tagsHtml += `<span class="kanban-card-tag tag-more">+${hiddenCount}</span>`;
    }
    tagsHtml += '</div>';
  }

  // Footer with effort and phases
  let footerHtml = '';
  const effortHtml = plan.totalEffortFormatted
    ? `<span class="kanban-card-effort"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>${escapeHtml(plan.totalEffortFormatted)}</span>`
    : '';
  const phasesHtml = plan.phases && plan.phases.total
    ? `<span class="kanban-card-phases">${plan.phases.total} phases</span>`
    : '';
  if (effortHtml || phasesHtml) {
    footerHtml = `<div class="kanban-card-footer">${effortHtml}${phasesHtml}</div>`;
  }

  return `
    <a href="/view?file=${encodeURIComponent(plan.path)}" class="kanban-card" data-id="${escapeHtml(plan.id)}">
      <div class="kanban-card-header">
        <h4 class="kanban-card-title">${escapeHtml(plan.name)}</h4>
        ${priorityHtml}
      </div>
      ${descriptionHtml}
      <div class="kanban-card-meta">
        <div class="kanban-card-progress">
          <div class="kanban-card-progress-bar">
            <div class="kanban-card-progress-fill" style="width: ${progressPct}%"></div>
          </div>
          <span>${progressPct}%</span>
        </div>
        <span class="kanban-card-date">${dateStr}</span>
      </div>
      ${tagsHtml}
      ${footerHtml}
    </a>
  `;
}

/**
 * Generate kanban board columns HTML
 * @param {Array} plans - Array of plan metadata objects
 * @returns {string} - Kanban columns HTML
 */
function generateKanbanColumns(plans) {
  if (!plans || plans.length === 0) {
    // Return empty columns structure
    return STATUS_COLUMNS.map(col => `
      <div class="kanban-column" data-status="${col.id}">
        <div class="kanban-column-header">
          <div class="kanban-column-title">
            <span class="kanban-status-dot ${col.color}"></span>
            <span>${col.label}</span>
          </div>
          <span class="kanban-column-count">0</span>
        </div>
        <div class="kanban-cards">
          <div class="kanban-empty">
            <svg class="kanban-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <path d="M9 9h6M9 13h6M9 17h4"/>
            </svg>
            <span>No plans</span>
          </div>
        </div>
      </div>
    `).join('');
  }

  // Group plans by status
  const grouped = {};
  STATUS_COLUMNS.forEach(col => {
    grouped[col.id] = [];
  });

  plans.forEach(plan => {
    const status = plan.status || 'pending';
    if (grouped[status]) {
      grouped[status].push(plan);
    } else {
      grouped['pending'].push(plan);
    }
  });

  // Generate column HTML
  return STATUS_COLUMNS.map(col => {
    const columnPlans = grouped[col.id];
    const cardsHtml = columnPlans.length > 0
      ? columnPlans.map(generateKanbanCard).join('')
      : `<div class="kanban-empty">
          <svg class="kanban-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <path d="M9 9h6M9 13h6M9 17h4"/>
          </svg>
          <span>No plans</span>
        </div>`;

    return `
      <div class="kanban-column" data-status="${col.id}">
        <div class="kanban-column-header">
          <div class="kanban-column-title">
            <span class="kanban-status-dot ${col.color}"></span>
            <span>${col.label}</span>
          </div>
          <span class="kanban-column-count">${columnPlans.length}</span>
        </div>
        <div class="kanban-cards">
          ${cardsHtml}
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Calculate statistics from plans array
 * @param {Array} plans - Array of plan metadata objects
 * @returns {Object} - Statistics object
 */
function calculateStats(plans) {
  const stats = {
    total: plans.length,
    completed: 0,
    inProgress: 0,
    pending: 0
  };

  plans.forEach(plan => {
    const status = (plan.status || 'pending').replace(/\s+/g, '-');
    if (status === 'completed' || status === 'complete') {
      stats.completed++;
    } else if (status === 'in-progress') {
      stats.inProgress++;
    } else {
      stats.pending++;
    }
  });

  return stats;
}

/**
 * Render complete dashboard HTML
 * @param {Array} plans - Array of plan metadata objects
 * @param {Object} options - Render options
 * @param {string} options.assetsDir - Assets directory path
 * @param {string} options.plansDir - Plans directory path
 * @returns {string} - Complete HTML page
 */
function renderDashboard(plans, options = {}) {
  const { assetsDir } = options;

  // Load template
  const templatePath = path.join(assetsDir, 'dashboard-template.html');
  let template;

  try {
    template = fs.readFileSync(templatePath, 'utf8');
  } catch (err) {
    // Fallback inline template if file not found
    template = getInlineTemplate();
  }

  // Calculate statistics
  const stats = calculateStats(plans);

  // Generate cards
  const plansGrid = generatePlansGrid(plans);
  const planCount = plans.length;

  // Generate timeline section
  const timelineSection = generateTimelineSection(plans);

  // Generate kanban columns
  const kanbanColumns = generateKanbanColumns(plans);

  // Generate JSON for client-side filtering (include rich metadata)
  const plansJson = JSON.stringify(plans.map(p => ({
    id: p.id,
    name: p.name,
    status: p.status,
    progress: p.progress,
    lastModified: p.lastModified,
    phasesTotal: p.phases.total,
    path: p.path, // Required for kanban card links
    // Rich metadata
    createdDate: p.createdDate,
    completedDate: p.completedDate,
    durationDays: p.durationDays,
    durationFormatted: p.durationFormatted,
    totalEffortHours: p.totalEffortHours,
    totalEffortFormatted: p.totalEffortFormatted,
    priority: p.priority,
    issue: p.issue,
    branch: p.branch,
    // New frontmatter fields
    description: p.description,
    tags: p.tags || [],
    assignee: p.assignee
  })));

  // Replace placeholders
  template = template
    .replace(/\{\{plans-grid\}\}/g, plansGrid)
    .replace(/\{\{kanban-columns\}\}/g, kanbanColumns)
    .replace(/\{\{plan-count\}\}/g, String(planCount))
    .replace(/\{\{plans-json\}\}/g, plansJson)
    .replace(/\{\{empty-state\}\}/g, generateEmptyState())
    .replace(/\{\{timeline-section\}\}/g, timelineSection)
    .replace(/\{\{has-plans\}\}/g, plans.length > 0 ? 'plans-loaded' : '')
    .replace(/\{\{stat-total\}\}/g, String(stats.total))
    .replace(/\{\{stat-completed\}\}/g, String(stats.completed))
    .replace(/\{\{stat-in-progress\}\}/g, String(stats.inProgress))
    .replace(/\{\{stat-pending\}\}/g, String(stats.pending));

  return template;
}

/**
 * Get inline fallback template
 * @returns {string} - Inline HTML template
 */
function getInlineTemplate() {
  return `<!DOCTYPE html>
<html lang="en" data-theme="light">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Plans Dashboard</title>
  <link rel="icon" type="image/png" href="/assets/favicon.png">
  <link rel="stylesheet" href="/assets/novel-theme.css">
  <link rel="stylesheet" href="/assets/dashboard.css">
</head>
<body class="dashboard-view {{has-plans}}">
  <header class="dashboard-header">
    <div class="header-left">
      <h1>Plans Dashboard</h1>
    </div>
    <div class="header-right">
      <button id="theme-toggle" class="icon-btn" aria-label="Toggle theme">
        <svg class="sun-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"/>
        </svg>
        <svg class="moon-icon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
        </svg>
      </button>
    </div>
  </header>

  <main role="main" aria-label="Plans Dashboard">
    <section class="stats-hero" aria-label="Plan statistics">
      <div class="stat-card total">
        <div class="stat-icon">📋</div>
        <div class="stat-value">{{stat-total}}</div>
        <div class="stat-label">Total Plans</div>
      </div>
      <div class="stat-card completed">
        <div class="stat-icon">✅</div>
        <div class="stat-value">{{stat-completed}}</div>
        <div class="stat-label">Completed</div>
      </div>
      <div class="stat-card in-progress">
        <div class="stat-icon">🔄</div>
        <div class="stat-value">{{stat-in-progress}}</div>
        <div class="stat-label">In Progress</div>
      </div>
      <div class="stat-card pending">
        <div class="stat-icon">⏳</div>
        <div class="stat-value">{{stat-pending}}</div>
        <div class="stat-label">Pending</div>
      </div>
    </section>

    <div class="dashboard-controls">
      <div class="search-box">
        <svg class="search-icon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
        </svg>
        <input type="search" id="plan-search" placeholder="Search plans..." aria-label="Search plans">
      </div>

      <select id="sort-select" aria-label="Sort plans by">
        <option value="date-desc">Newest First</option>
        <option value="date-asc">Oldest First</option>
        <option value="name-asc">Name A-Z</option>
        <option value="name-desc">Name Z-A</option>
        <option value="progress-desc">Most Progress</option>
        <option value="progress-asc">Least Progress</option>
      </select>

      <div class="filter-pills" role="group" aria-label="Filter by status">
        <button class="filter-pill active" data-filter="all" aria-pressed="true">All</button>
        <button class="filter-pill" data-filter="completed" aria-pressed="false">Completed</button>
        <button class="filter-pill" data-filter="in-progress" aria-pressed="false">In Progress</button>
        <button class="filter-pill" data-filter="pending" aria-pressed="false">Pending</button>
      </div>

      <div role="status" aria-live="polite" class="result-count">
        Showing <strong>{{plan-count}}</strong> plans
      </div>
    </div>

    <section class="plans-grid" aria-label="Plans list">
      {{plans-grid}}
    </section>

    {{empty-state}}
  </main>

  <script>window.__plans = {{plans-json}};</script>
  <script src="/assets/dashboard.js"></script>
</body>
</html>`;
}

module.exports = {
  renderDashboard,
  generatePlanCard,
  generateCardMeta,
  generateTagsPills,
  generateProgressRing,
  generateProgressBar,
  generateStatusCounts,
  generateStatusBadge,
  generateTimelineSection,
  generateEmptyState,
  generatePlansGrid,
  generateKanbanColumns,
  generateKanbanCard,
  calculateStats,
  escapeHtml,
  truncate,
  formatDate,
  formatRelativeTime,
  getStatusLabel,
  getPriorityColorClass,
  STATUS_COLUMNS
};
