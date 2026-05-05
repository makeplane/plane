'use strict';

/**
 * Terminal string utilities for statusline rendering.
 * Handles grapheme-aware visible length, elapsed time formatting,
 * terminal width detection, and safe date parsing.
 *
 * Separated from render-modes to keep files under 200 lines.
 */

// Intl.Segmenter for accurate grapheme cluster splitting (emoji, CJK, combining marks)
const GRAPHEME_SEGMENTER = (
  typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function'
) ? new Intl.Segmenter(undefined, { granularity: 'grapheme' }) : null;

/**
 * Calculate terminal-visible string length.
 * Strips ANSI escape codes, counts grapheme clusters with width heuristics
 * for emoji (2 cols), CJK (2 cols), and combining marks (0 cols).
 * @param {string} str
 * @returns {number}
 */
function visibleLength(str) {
  if (!str || typeof str !== 'string') return 0;
  const noAnsi = str.replace(/\x1b\[[0-9;]*m/g, '');
  const clusters = GRAPHEME_SEGMENTER
    ? Array.from(GRAPHEME_SEGMENTER.segment(noAnsi), s => s.segment)
    : Array.from(noAnsi);

  let len = 0;
  for (const cluster of clusters) {
    if (!cluster) continue;
    if (/^[\u0000-\u001f\u007f]+$/.test(cluster)) continue;    // control chars
    if (/^\p{Mark}+$/u.test(cluster)) continue;                 // combining marks

    const first = cluster.codePointAt(0);
    if (first === 0x200d || first === 0xfe0e || first === 0xfe0f) continue;

    // Emoji grapheme clusters = 2 columns
    if ((cluster.includes('\u200d') && /\p{Extended_Pictographic}/u.test(cluster)) ||
        /\p{Extended_Pictographic}/u.test(cluster)) {
      len += 2;
      continue;
    }

    // Full-width CJK ranges = 2 columns
    if (first >= 0x1100 && (
      first <= 0x115f || first === 0x2329 || first === 0x232a ||
      (first >= 0x2e80 && first <= 0xa4cf && first !== 0x303f) ||
      (first >= 0xac00 && first <= 0xd7a3) ||
      (first >= 0xf900 && first <= 0xfaff) ||
      (first >= 0xfe10 && first <= 0xfe19) ||
      (first >= 0xfe30 && first <= 0xfe6f) ||
      (first >= 0xff00 && first <= 0xff60) ||
      (first >= 0xffe0 && first <= 0xffe6) ||
      (first >= 0x1f200 && first <= 0x1f251) ||
      (first >= 0x20000 && first <= 0x3fffd)
    )) { len += 2; continue; }

    len += 1;
  }
  return len;
}

/**
 * Format elapsed time from startTime to endTime (or now).
 * @param {string|Date} startTime
 * @param {string|Date} [endTime]
 * @returns {string} e.g. "2m 5s", "45s", "<1s"
 */
function formatElapsed(startTime, endTime) {
  if (!startTime) return '0s';
  const start = startTime instanceof Date ? startTime.getTime() : new Date(startTime).getTime();
  if (isNaN(start)) return '0s';
  const end = endTime
    ? (endTime instanceof Date ? endTime.getTime() : new Date(endTime).getTime())
    : Date.now();
  if (isNaN(end)) return '0s';
  const ms = end - start;
  if (ms < 0 || ms < 1000) return '<1s';
  if (ms < 60000) return `${Math.round(ms / 1000)}s`;
  const mins = Math.floor(ms / 60000);
  const secs = Math.round((ms % 60000) / 1000);
  return `${mins}m ${secs}s`;
}

/**
 * Get terminal width with fallback chain.
 * Piped context (statusline) uses stderr columns or COLUMNS env var.
 * @returns {number}
 */
function getTerminalWidth() {
  if (process.stderr.columns) return process.stderr.columns;
  if (process.env.COLUMNS) {
    const parsed = parseInt(process.env.COLUMNS, 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  return 120;
}

/**
 * Safe date-to-milliseconds conversion. Returns 0 for invalid/missing dates.
 * @param {string|Date|null} dateValue
 * @returns {number}
 */
function safeGetTime(dateValue) {
  if (!dateValue) return 0;
  const time = new Date(dateValue).getTime();
  return isNaN(time) ? 0 : time;
}

/**
 * Format milliseconds remaining as a compact countdown string.
 * Returns empty string when msLeft <= 0 (already elapsed).
 * Examples: 45000 → "45m", 5400000 → "1h30m", 259200000 → "3d"
 * @param {number} msLeft
 * @returns {string}
 */
function formatCountdown(msLeft) {
  if (msLeft <= 0) return '';
  const mins = Math.floor(msLeft / 60000);
  if (mins < 60) return `${mins}m`;
  if (mins < 1440) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h${m}m` : `${h}h`;
  }
  return `${Math.floor(mins / 1440)}d`;
}

module.exports = { visibleLength, formatElapsed, getTerminalWidth, safeGetTime, formatCountdown };
