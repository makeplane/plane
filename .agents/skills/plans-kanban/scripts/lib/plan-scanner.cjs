/**
 * Plan Scanner Utility
 * Recursively discovers plan directories and aggregates metadata for dashboard view
 *
 * @module plan-scanner
 */

const fs = require('fs');
const path = require('path');
const { parsePlanTable } = require('./plan-parser.cjs');
const {
  extractPlanMetadata,
  generateTimelineStats,
  generateActivityHeatmap,
  normalizeStatus
} = require('./plan-metadata-extractor.cjs');

/**
 * Calculate progress statistics from phases array
 * @param {Array<{status: string}>} phases - Array of phase objects with status
 * @returns {{total: number, completed: number, inProgress: number, pending: number, percentage: number}}
 */
function calculateProgress(phases) {
  if (!phases || phases.length === 0) {
    return { total: 0, completed: 0, inProgress: 0, pending: 0, percentage: 0 };
  }

  const stats = {
    total: phases.length,
    completed: 0,
    inProgress: 0,
    pending: 0
  };

  for (const phase of phases) {
    const status = (phase.status || '').toLowerCase();
    if (status === 'completed' || status === 'done') {
      stats.completed++;
    } else if (status === 'in-progress' || status === 'in progress' || status === 'active') {
      stats.inProgress++;
    } else {
      stats.pending++;
    }
  }

  stats.percentage = stats.total > 0
    ? Math.round((stats.completed / stats.total) * 100)
    : 0;

  return stats;
}

/**
 * Parse plan name from directory name (strip date prefix)
 * @param {string} dirName - Directory name like "251211-feature-name"
 * @returns {string} - Human readable name like "Feature Name"
 */
function parsePlanName(dirName) {
  // Remove date prefix: YYMMDD-, YYYYMMDD-, YYMMDD-HHMM-, YYYYMMDD-HHMM-
  const withoutDate = dirName.replace(/^\d{6,8}(-\d{4})?-/, '');

  // Convert kebab-case to Title Case
  return withoutDate
    .split('-')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Derive overall status from phase statistics or header status
 * @param {{completed: number, inProgress: number, pending: number, total: number}} stats
 * @param {string} [headerStatus] - Optional status from plan header (e.g., **Status:** completed)
 * @returns {'completed' | 'in-progress' | 'in-review' | 'cancelled' | 'pending'}
 */
function deriveStatus(stats, headerStatus) {
  // If header explicitly defines status, use it (normalized)
  if (headerStatus) {
    const normalized = headerStatus.toLowerCase().trim();
    if (normalized.includes('complete') || normalized.includes('done')) {
      return 'completed';
    }
    if (normalized.includes('review')) {
      return 'in-review';
    }
    if (normalized.includes('cancel')) {
      return 'cancelled';
    }
    if (normalized.includes('progress') || normalized.includes('active')) {
      return 'in-progress';
    }
    if (normalized.includes('pending') || normalized.includes('todo') || normalized.includes('planned')) {
      return 'pending';
    }
  }

  // Otherwise derive from phase stats
  if (stats.completed === stats.total && stats.total > 0) {
    return 'completed';
  }
  if (stats.inProgress > 0 || stats.completed > 0) {
    return 'in-progress';
  }
  return 'pending';
}

/**
 * Get metadata for a single plan
 * @param {string} planFilePath - Absolute path to plan.md
 * @returns {Object|null} - Plan metadata object or null if invalid
 */
function getPlanMetadata(planFilePath) {
  try {
    if (!fs.existsSync(planFilePath)) {
      return null;
    }

    const directory = path.dirname(planFilePath);
    const dirName = path.basename(directory);
    const stats = fs.statSync(planFilePath);

    // Parse phases from plan table
    const phases = parsePlanTable(planFilePath);
    const progress = calculateProgress(phases);

    // Extract rich metadata (dates, effort, priority, etc.)
    const richMeta = extractPlanMetadata(planFilePath);

    return {
      id: dirName,
      name: parsePlanName(dirName),
      path: planFilePath,
      directory: directory,
      phases: progress,
      progress: progress.percentage,
      lastModified: stats.mtime.toISOString(),
      // Use frontmatter status if hasFrontmatter (already normalized), otherwise derive from phases
      status: richMeta.hasFrontmatter && richMeta.headerStatus
        ? normalizeStatus(richMeta.headerStatus)
        : deriveStatus(progress, richMeta.headerStatus),
      // Rich metadata
      createdDate: richMeta.createdDate,
      completedDate: richMeta.completedDate,
      durationDays: richMeta.durationDays,
      durationFormatted: richMeta.durationFormatted,
      totalEffortHours: richMeta.totalEffortHours,
      totalEffortFormatted: richMeta.totalEffortFormatted,
      priority: richMeta.priority,
      issue: richMeta.issue,
      branch: richMeta.branch,
      // New frontmatter fields
      description: richMeta.description,
      tags: richMeta.tags || [],
      assignee: richMeta.assignee,
      title: richMeta.title
    };
  } catch (err) {
    console.error(`[plan-scanner] Error reading plan: ${planFilePath}`, err.message);
    return null;
  }
}

/**
 * Check if path is safe (within allowed directory, no traversal)
 * @param {string} targetPath - Path to check
 * @param {string} baseDir - Allowed base directory
 * @returns {boolean}
 */
function isPathSafe(targetPath, baseDir) {
  const resolved = path.resolve(targetPath);
  const resolvedBase = path.resolve(baseDir);

  // Must start with base directory
  if (!resolved.startsWith(resolvedBase)) {
    return false;
  }

  // No null bytes
  if (targetPath.includes('\0')) {
    return false;
  }

  return true;
}

/**
 * Scan directory for plan.md files
 * @param {string} plansDir - Root directory to scan (e.g., ./plans)
 * @param {Object} options - Scan options
 * @param {number} options.maxDepth - Maximum recursion depth (default: 2)
 * @param {string[]} options.exclude - Directory names to exclude (default: ['node_modules', '.git', 'templates', 'reports', 'research'])
 * @returns {Array<Object>} - Array of plan metadata objects sorted by lastModified desc
 */
function scanPlans(plansDir, options = {}) {
  const {
    maxDepth = 2,
    exclude = ['node_modules', '.git', 'templates', 'reports', 'research']
  } = options;

  const resolvedBase = path.resolve(plansDir);
  const plans = [];

  /**
   * Recursive directory scanner
   * @param {string} dir - Current directory
   * @param {number} depth - Current depth
   */
  function scanDir(dir, depth) {
    if (depth > maxDepth) return;

    // Security: validate path
    if (!isPathSafe(dir, resolvedBase)) {
      console.error(`[plan-scanner] Path traversal blocked: ${dir}`);
      return;
    }

    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch (err) {
      console.error(`[plan-scanner] Cannot read directory: ${dir}`, err.message);
      return;
    }

    for (const entry of entries) {
      // Skip excluded directories
      if (exclude.includes(entry.name)) continue;

      // Skip hidden directories
      if (entry.name.startsWith('.')) continue;

      const fullPath = path.join(dir, entry.name);

      if (entry.isDirectory()) {
        // Check for plan.md in this directory
        const planFile = path.join(fullPath, 'plan.md');
        if (fs.existsSync(planFile)) {
          const metadata = getPlanMetadata(planFile);
          if (metadata) {
            plans.push(metadata);
          }
        } else {
          // Recurse into subdirectory
          scanDir(fullPath, depth + 1);
        }
      }
    }
  }

  // Start scanning
  if (fs.existsSync(resolvedBase)) {
    scanDir(resolvedBase, 0);
  } else {
    console.error(`[plan-scanner] Plans directory not found: ${plansDir}`);
  }

  // Sort by lastModified descending (newest first)
  plans.sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified));

  return plans;
}

module.exports = {
  scanPlans,
  getPlanMetadata,
  calculateProgress,
  parsePlanName,
  deriveStatus,
  isPathSafe,
  // Re-export timeline helpers
  generateTimelineStats,
  generateActivityHeatmap
};
