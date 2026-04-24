/**
 * Plan Metadata Extractor
 * Extracts rich metadata from plan.md files including dates, effort, priority, issues
 * Supports YAML frontmatter (primary) with regex fallback for legacy plans
 *
 * @module plan-metadata-extractor
 */

const fs = require('fs');
const path = require('path');
const matter = require('gray-matter');

// Import shared normalizeStatus from plan-table-parser (DRY — single source of truth)
const sharedParser = require('../../../_shared/lib/plan-table-parser.cjs');

/**
 * Normalize status string to standard format.
 * Delegates to shared parser for core statuses (pending|in-progress|completed),
 * then extends with metadata-specific statuses (cancelled, in-review).
 * @param {string} status - Raw status string
 * @returns {string} - Normalized status (pending|in-progress|completed|cancelled|in-review)
 */
function normalizeStatus(status) {
  if (!status) return 'pending';
  const s = String(status).toLowerCase().trim();
  // Metadata-specific statuses not in the shared parser
  if (s === 'cancelled' || s === 'canceled') return 'cancelled';
  if (s === 'in-review' || s === 'review') return 'in-review';
  // Delegate to shared parser for standard statuses
  return sharedParser.normalizeStatus(status);
}

/**
 * Normalize priority to P1/P2/P3 format
 * @param {string} priority - Raw priority string
 * @returns {string|null} - Normalized priority (P1|P2|P3) or null
 */
function normalizePriority(priority) {
  if (!priority) return null;
  const p = String(priority).toUpperCase().trim();
  if (p === 'P1' || p === 'HIGH' || p === 'CRITICAL') return 'P1';
  if (p === 'P2' || p === 'MEDIUM' || p === 'NORMAL') return 'P2';
  if (p === 'P3' || p === 'LOW') return 'P3';
  if (p.match(/^P[0-3]$/)) return p;
  return null;
}

/**
 * Extract metadata from YAML frontmatter (primary method)
 * @param {string} content - File content
 * @returns {Object|null} - Extracted metadata or null if no frontmatter
 */
function extractFromFrontmatter(content) {
  if (!content || !content.trim().startsWith('---')) return null;

  try {
    const { data } = matter(content);
    if (!data || Object.keys(data).length === 0) return null;

    return {
      title: data.title || null,
      description: data.description || null,
      status: normalizeStatus(data.status),
      priority: normalizePriority(data.priority),
      effort: data.effort || null,
      issue: data.issue ? String(data.issue) : null,
      branch: data.branch || null,
      tags: Array.isArray(data.tags) ? data.tags : [],
      createdDate: data.created ? new Date(data.created) : null,
      completedDate: data.completed ? new Date(data.completed) : null,
      assignee: data.assignee || null
    };
  } catch (e) {
    // YAML parse error - fall back to regex
    return null;
  }
}

/**
 * Extract description from ## Overview section
 * @param {string} content - File content
 * @returns {string|null} - First paragraph of Overview section or null
 */
function extractDescriptionFromOverview(content) {
  if (!content) return null;

  // Look for ## Overview section
  const overviewMatch = content.match(/##\s*Overview\s*\n+([^\n#]+)/i);
  if (overviewMatch) {
    const desc = overviewMatch[1].trim();
    // Return first sentence or first 150 chars
    const firstSentence = desc.match(/^[^.!?]+[.!?]/);
    if (firstSentence) return firstSentence[0].trim();
    return desc.slice(0, 150).trim();
  }

  return null;
}

/**
 * Parse date from plan directory name (YYMMDD or YYYYMMDD format)
 * @param {string} dirName - Directory name like "251211-feature-name"
 * @returns {Date|null} - Parsed date or null
 */
function parseDateFromDirName(dirName) {
  // Match YYMMDD-HHMM- or YYMMDD- or YYYYMMDD-
  const match = dirName.match(/^(\d{6,8})(?:-(\d{4}))?-/);
  if (!match) return null;

  const dateStr = match[1];
  let year, month, day;

  if (dateStr.length === 6) {
    // YYMMDD format
    year = 2000 + parseInt(dateStr.slice(0, 2), 10);
    month = parseInt(dateStr.slice(2, 4), 10) - 1;
    day = parseInt(dateStr.slice(4, 6), 10);
  } else {
    // YYYYMMDD format
    year = parseInt(dateStr.slice(0, 4), 10);
    month = parseInt(dateStr.slice(4, 6), 10) - 1;
    day = parseInt(dateStr.slice(6, 8), 10);
  }

  const date = new Date(year, month, day);
  return isNaN(date.getTime()) ? null : date;
}

/**
 * Extract metadata from plan.md header section
 * Looks for patterns like **Key:** Value or **Key**: Value
 * @param {string} content - Plan file content
 * @returns {Object} - Extracted metadata
 */
function extractHeaderMetadata(content) {
  const metadata = {
    createdDate: null,
    completedDate: null,
    priority: null,
    issue: null,
    branch: null,
    planId: null,
    headerStatus: null
  };

  // Only look at first ~50 lines for header metadata
  const headerSection = content.split('\n').slice(0, 50).join('\n');

  // **Created:** 2025-12-01 or **Date:** 2025-12-11
  const createdMatch = headerSection.match(/\*\*(?:Created|Date):?\*\*:?\s*(\d{4}-\d{2}-\d{2})/i);
  if (createdMatch) {
    metadata.createdDate = new Date(createdMatch[1]);
  }

  // **Status:** ✓ Complete (2025-12-01) - extract completion date
  const statusMatch = headerSection.match(/\*\*Status:?\*\*:?\s*(.+)/i);
  if (statusMatch) {
    metadata.headerStatus = statusMatch[1].trim();
    const completedMatch = statusMatch[1].match(/(?:complete|done).*?(\d{4}-\d{2}-\d{2})/i);
    if (completedMatch) {
      metadata.completedDate = new Date(completedMatch[1]);
    }
  }

  // **Priority:** P1 - High
  const priorityMatch = headerSection.match(/\*\*Priority:?\*\*:?\s*(P[0-3]|High|Medium|Low)/i);
  if (priorityMatch) {
    metadata.priority = priorityMatch[1].toUpperCase();
  }

  // **Issue:** #74 or **Issue**: https://github.com/.../issues/74
  const issueMatch = headerSection.match(/\*\*Issue:?\*\*:?\s*(?:#(\d+)|.*?issues\/(\d+))/i);
  if (issueMatch) {
    metadata.issue = issueMatch[1] || issueMatch[2];
  }

  // **Branch:** `kai/feat/feature-name` or **Branch:** kai/feat/feature-name
  const branchMatch = headerSection.match(/\*\*Branch:?\*\*:?\s*`?([^`\n]+)`?/i);
  if (branchMatch) {
    metadata.branch = branchMatch[1].trim();
  }

  // **Plan ID:** 20251201-1849-cli-ui-enhancement
  const planIdMatch = headerSection.match(/\*\*Plan ID\*\*:?\s*(\S+)/i);
  if (planIdMatch) {
    metadata.planId = planIdMatch[1].trim();
  }

  return metadata;
}

/**
 * Parse effort/time string to hours
 * @param {string} effortStr - Effort string like "4h", "2 hours", "30m", "1.5h"
 * @returns {number} - Hours as decimal
 */
function parseEffortToHours(effortStr) {
  if (!effortStr) return 0;

  const str = effortStr.toLowerCase().trim();

  // Match patterns: 4h, 4 hours, 4hr, 30m, 30 min, 1.5h
  const hoursMatch = str.match(/(\d+(?:\.\d+)?)\s*(?:h|hours?|hrs?)/);
  if (hoursMatch) {
    return parseFloat(hoursMatch[1]);
  }

  const minutesMatch = str.match(/(\d+)\s*(?:m|min|minutes?)/);
  if (minutesMatch) {
    return parseInt(minutesMatch[1], 10) / 60;
  }

  const daysMatch = str.match(/(\d+(?:\.\d+)?)\s*(?:d|days?)/);
  if (daysMatch) {
    return parseFloat(daysMatch[1]) * 8; // Assume 8h work day
  }

  return 0;
}

/**
 * Extract effort estimates from phase table
 * Looks for Effort/Time/Estimate columns in tables
 * @param {string} content - Plan file content
 * @returns {{totalEffort: number, phaseEfforts: Array<{phase: number, effort: number, effortStr: string}>}}
 */
function extractEffortFromTable(content) {
  const result = {
    totalEffort: 0,
    phaseEfforts: []
  };

  // Match table rows with effort column
  // Pattern: | Phase | Description | Status | Effort |
  // Or: | [Phase 1](path) | Description | Status | 4h |
  const tableRowRegex = /\|[^|]*\|[^|]*\|[^|]*\|\s*(\d+(?:\.\d+)?\s*(?:h|m|d|hours?|min|days?)?)\s*\|/gi;

  let match;
  let phaseNum = 1;
  while ((match = tableRowRegex.exec(content)) !== null) {
    const effortStr = match[1].trim();
    const effort = parseEffortToHours(effortStr);
    if (effort > 0) {
      result.phaseEfforts.push({
        phase: phaseNum,
        effort,
        effortStr
      });
      result.totalEffort += effort;
      phaseNum++;
    }
  }

  return result;
}

/**
 * Calculate plan duration in days
 * @param {Date} startDate - Start date
 * @param {Date} endDate - End date (or now if not completed)
 * @returns {number} - Duration in days
 */
function calculateDuration(startDate, endDate) {
  if (!startDate) return 0;
  const end = endDate || new Date();
  const diffMs = end.getTime() - startDate.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Format duration as human-readable string
 * @param {number} days - Duration in days
 * @returns {string} - Formatted string like "3 days" or "2 weeks"
 */
function formatDuration(days) {
  if (days === 0) return 'Today';
  if (days === 1) return '1 day';
  if (days < 7) return `${days} days`;
  if (days < 14) return '1 week';
  if (days < 30) return `${Math.floor(days / 7)} weeks`;
  if (days < 60) return '1 month';
  return `${Math.floor(days / 30)} months`;
}

/**
 * Extract all rich metadata from a plan
 * Tries YAML frontmatter first, falls back to regex extraction
 * @param {string} planFilePath - Path to plan.md
 * @returns {Object} - Complete metadata object
 */
function extractPlanMetadata(planFilePath) {
  const content = fs.readFileSync(planFilePath, 'utf8');
  const dir = path.dirname(planFilePath);
  const dirName = path.basename(dir);
  const stats = fs.statSync(planFilePath);

  // Try YAML frontmatter first (new format)
  const frontmatter = extractFromFrontmatter(content);

  // Get header metadata (legacy regex extraction)
  const headerMeta = extractHeaderMetadata(content);

  // Get date from directory name as fallback
  const dirDate = parseDateFromDirName(dirName);

  // Merge frontmatter with regex fallback
  // Frontmatter takes priority, regex fills gaps
  const createdDate = frontmatter?.createdDate || headerMeta.createdDate || dirDate || null;
  const completedDate = frontmatter?.completedDate || headerMeta.completedDate || null;
  const priority = frontmatter?.priority || normalizePriority(headerMeta.priority);
  const issue = frontmatter?.issue || headerMeta.issue;
  const branch = frontmatter?.branch || headerMeta.branch;

  // Extract description: frontmatter > Overview section
  const description = frontmatter?.description || extractDescriptionFromOverview(content);

  // Tags from frontmatter only (no regex extraction for tags)
  const tags = frontmatter?.tags || [];

  // Get effort data from table
  const effortData = extractEffortFromTable(content);
  // Override with frontmatter effort if present
  let totalEffort = effortData.totalEffort;
  if (frontmatter?.effort) {
    const parsed = parseEffortToHours(frontmatter.effort);
    if (parsed > 0) totalEffort = parsed;
  }

  // Calculate duration
  const duration = calculateDuration(createdDate, completedDate);

  return {
    // Dates
    createdDate: createdDate ? createdDate.toISOString() : null,
    completedDate: completedDate ? completedDate.toISOString() : null,
    lastModified: stats.mtime.toISOString(),

    // Duration
    durationDays: duration,
    durationFormatted: formatDuration(duration),
    isCompleted: !!completedDate,

    // Effort
    totalEffortHours: totalEffort,
    totalEffortFormatted: totalEffort > 0
      ? `${totalEffort.toFixed(1)}h`
      : null,
    phaseEfforts: effortData.phaseEfforts,

    // Metadata (merged from frontmatter + regex)
    title: frontmatter?.title || null,
    description,
    priority,
    issue,
    branch,
    tags,
    assignee: frontmatter?.assignee || null,
    planId: headerMeta.planId,
    // Use frontmatter status if available, otherwise regex-extracted header status
    headerStatus: frontmatter?.status || headerMeta.headerStatus,

    // Source indicator for debugging
    hasFrontmatter: !!frontmatter
  };
}

/**
 * Generate timeline data for multiple plans
 * @param {Array} plans - Array of plan objects with metadata
 * @returns {Object} - Timeline statistics
 */
function generateTimelineStats(plans) {
  const now = new Date();
  const stats = {
    totalPlans: plans.length,
    completedPlans: 0,
    activePlans: 0,
    pendingPlans: 0,
    avgDurationDays: 0,
    longestPlan: null,
    totalEffortHours: 0,
    completedEffortHours: 0,
    thisWeekCompleted: 0,
    thisMonthCompleted: 0
  };

  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  let totalDuration = 0;
  let durationCount = 0;

  for (const plan of plans) {
    // Count by status
    if (plan.status === 'completed') {
      stats.completedPlans++;
      if (plan.completedDate) {
        const completed = new Date(plan.completedDate);
        if (completed >= weekAgo) stats.thisWeekCompleted++;
        if (completed >= monthAgo) stats.thisMonthCompleted++;
      }
      if (plan.totalEffortHours) {
        stats.completedEffortHours += plan.totalEffortHours;
      }
    } else if (plan.status === 'in-progress') {
      stats.activePlans++;
    } else {
      stats.pendingPlans++;
    }

    // Track duration
    if (plan.durationDays > 0) {
      totalDuration += plan.durationDays;
      durationCount++;
      if (!stats.longestPlan || plan.durationDays > stats.longestPlan.durationDays) {
        stats.longestPlan = { name: plan.name, durationDays: plan.durationDays };
      }
    }

    // Sum effort
    if (plan.totalEffortHours) {
      stats.totalEffortHours += plan.totalEffortHours;
    }
  }

  stats.avgDurationDays = durationCount > 0
    ? Math.round(totalDuration / durationCount)
    : 0;

  return stats;
}

/**
 * Generate activity data for heatmap (last 12 weeks)
 * @param {Array} plans - Array of plan objects with metadata
 * @returns {Array} - Array of weekly activity counts
 */
function generateActivityHeatmap(plans) {
  const now = new Date();
  const weeks = [];

  // Generate 12 weeks of data
  for (let w = 11; w >= 0; w--) {
    const weekStart = new Date(now.getTime() - w * 7 * 24 * 60 * 60 * 1000);
    weekStart.setHours(0, 0, 0, 0);
    weekStart.setDate(weekStart.getDate() - weekStart.getDay()); // Start of week (Sunday)

    const weekEnd = new Date(weekStart.getTime() + 7 * 24 * 60 * 60 * 1000);

    let activity = 0;
    for (const plan of plans) {
      // Count plans created or completed in this week
      if (plan.createdDate) {
        const created = new Date(plan.createdDate);
        if (created >= weekStart && created < weekEnd) activity++;
      }
      if (plan.completedDate) {
        const completed = new Date(plan.completedDate);
        if (completed >= weekStart && completed < weekEnd) activity++;
      }
    }

    weeks.push({
      weekStart: weekStart.toISOString(),
      weekLabel: weekStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      activity,
      level: activity === 0 ? 0 : activity === 1 ? 1 : activity <= 3 ? 2 : 3
    });
  }

  return weeks;
}

module.exports = {
  // Core extraction functions
  extractPlanMetadata,
  extractFromFrontmatter,
  extractDescriptionFromOverview,
  extractHeaderMetadata,
  extractEffortFromTable,

  // Normalization helpers
  normalizeStatus,
  normalizePriority,

  // Date/time utilities
  parseDateFromDirName,
  parseEffortToHours,
  calculateDuration,
  formatDuration,

  // Statistics generators
  generateTimelineStats,
  generateActivityHeatmap
};
