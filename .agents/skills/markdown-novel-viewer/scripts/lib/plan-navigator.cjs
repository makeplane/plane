/**
 * Plan navigation system - detects plan structure and generates navigation
 * Delegates parsing to shared plan-table-parser module
 */

const fs = require('fs');
const path = require('path');
const { parsePlanPhases, normalizeStatus, filenameToTitle } = require('../../../_shared/lib/plan-table-parser.cjs');

/** Escape HTML special characters to prevent XSS */
function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Generate a slug from text for anchor IDs */
function slugify(text) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

/**
 * Detect if a file is part of a plan directory
 * @param {string} filePath
 * @returns {{isPlan: boolean, planDir: string, planFile: string, phases: Array}}
 */
function detectPlan(filePath) {
  const dir = path.dirname(filePath);
  const planFile = path.join(dir, 'plan.md');
  if (!fs.existsSync(planFile)) return { isPlan: false };

  const files = fs.readdirSync(dir);
  const phases = files
    .filter(f => f.startsWith('phase-') && f.endsWith('.md'))
    .sort((a, b) => {
      const matchA = a.match(/phase-(\d+)([a-z]?)/);
      const matchB = b.match(/phase-(\d+)([a-z]?)/);
      const numA = parseInt(matchA?.[1] || '0', 10);
      const numB = parseInt(matchB?.[1] || '0', 10);
      if (numA !== numB) return numA - numB;
      return (matchA?.[2] || '').localeCompare(matchB?.[2] || '');
    });

  return { isPlan: true, planDir: dir, planFile, phases: phases.map(f => path.join(dir, f)) };
}

/**
 * Parse plan.md delegating to shared parser with anchor generation
 * @param {string} planFilePath
 * @returns {Array}
 */
function parsePlanTable(planFilePath) {
  const content = fs.readFileSync(planFilePath, 'utf8');
  const dir = path.dirname(planFilePath);
  const phases = parsePlanPhases(content, dir, { generateAnchors: true, slugify });

  // Enhancement: resolve files from "Phase Files" section for heading-based phases
  if (phases.length > 0) {
    const phaseFilesSection = content.match(/##\s*Phase\s*Files[\s\S]*?(?=##|$)/i);
    if (phaseFilesSection) {
      const linkRegex = /\d+\.\s*\[([^\]]+)\]\(([^)]+\.md)\)/g;
      let linkMatch;
      while ((linkMatch = linkRegex.exec(phaseFilesSection[0])) !== null) {
        const [, , linkPath] = linkMatch;
        const phaseNum = parseInt(linkMatch[1].match(/phase-0?(\d+)/i)?.[1] || '0', 10);
        const phase = phases.find(p => p.phase === phaseNum);
        if (phase && (!phase.file || phase.file === planFilePath)) {
          phase.file = path.resolve(dir, linkPath);
          phase.anchor = null;
        }
      }
    }
  }

  // Filter out inline-only phases (no separate file)
  return phases.filter(p => p.file && p.file !== planFilePath);
}

/** Get navigation context for a file */
function getNavigationContext(filePath) {
  const planInfo = detectPlan(filePath);
  if (!planInfo.isPlan) return { planInfo, currentIndex: -1, prev: null, next: null, allPhases: [] };

  const phaseMeta = parsePlanTable(planInfo.planFile);
  const allPhases = [{ phase: 0, phaseId: '0', name: 'Plan Overview', status: 'overview', file: planInfo.planFile }, ...phaseMeta];

  const normalizedPath = path.normalize(filePath);
  const currentIndex = allPhases.findIndex(p => path.normalize(p.file) === normalizedPath);
  const prev = currentIndex > 0 ? allPhases[currentIndex - 1] : null;
  const next = currentIndex < allPhases.length - 1 && currentIndex >= 0 ? allPhases[currentIndex + 1] : null;

  return { planInfo, currentIndex, prev, next, allPhases };
}

/** Get status badge HTML for a phase group */
function getGroupBadge(phases) {
  const completed = phases.filter(p => p.status === 'completed').length;
  const inProgress = phases.filter(p => p.status === 'in-progress').length;
  if (completed === phases.length) return '<span class="phase-badge badge-done">&#10003;</span>';
  if (inProgress > 0) return '<span class="phase-badge badge-progress">&#9679;</span>';
  return '<span class="phase-badge badge-pending">&#9675;</span>';
}

/** Render a single phase item as HTML */
function renderPhaseItem(phase, index, currentIndex, normalizedCurrentPath) {
  const isActive = index === currentIndex;
  const statusClass = phase.status.replace(/\s+/g, '-');
  const normalizedPhasePath = path.normalize(phase.file);
  const isSameFile = normalizedPhasePath === normalizedCurrentPath;
  const fileExists = fs.existsSync(phase.file);

  // M7: escape statusClass and phase.anchor to prevent XSS in HTML attributes
  const safeStatusClass = escapeHtml(statusClass);
  const safeAnchor = phase.anchor ? escapeHtml(phase.anchor) : null;

  if (!fileExists) {
    return `<li class="phase-item unavailable" data-status="${safeStatusClass}" title="Phase planned but not yet implemented">
      <span class="phase-link-disabled">
        <span class="status-dot ${safeStatusClass}"></span>
        <span class="phase-name">${escapeHtml(phase.name)}</span>
        <span class="unavailable-badge">Planned</span>
      </span></li>`;
  }

  let href, isInlineSection = false;
  if (isSameFile && safeAnchor) { href = `#${safeAnchor}`; isInlineSection = true; }
  else if (safeAnchor) { href = `/view?file=${encodeURIComponent(phase.file)}#${safeAnchor}`; }
  else { href = `/view?file=${encodeURIComponent(phase.file)}`; }

  const dataAnchor = safeAnchor ? `data-anchor="${safeAnchor}"` : '';
  const inlineSectionClass = isInlineSection ? 'inline-section' : '';
  const typeIcon = isInlineSection
    ? `<svg class="phase-type-icon" viewBox="0 0 16 16" fill="currentColor"><path d="M7.775 3.275a.75.75 0 001.06 1.06l1.25-1.25a2 2 0 112.83 2.83l-2.5 2.5a2 2 0 01-2.83 0 .75.75 0 00-1.06 1.06 3.5 3.5 0 004.95 0l2.5-2.5a3.5 3.5 0 00-4.95-4.95l-1.25 1.25zm-.5 9.45a.75.75 0 01-1.06-1.06l-1.25 1.25a2 2 0 01-2.83-2.83l2.5-2.5a2 2 0 012.83 0 .75.75 0 001.06-1.06 3.5 3.5 0 00-4.95 0l-2.5 2.5a3.5 3.5 0 004.95 4.95l1.25-1.25z"/></svg>`
    : `<svg class="phase-type-icon" viewBox="0 0 16 16" fill="currentColor"><path d="M3.75 1.5a.25.25 0 00-.25.25v12.5c0 .138.112.25.25.25h8.5a.25.25 0 00.25-.25V4.664a.25.25 0 00-.073-.177l-2.914-2.914a.25.25 0 00-.177-.073H3.75zM2 1.75C2 .784 2.784 0 3.75 0h5.586c.464 0 .909.184 1.237.513l2.914 2.914c.329.328.513.773.513 1.237v9.586A1.75 1.75 0 0112.25 16h-8.5A1.75 1.75 0 012 14.25V1.75z"/></svg>`;

  return `<li class="phase-item ${isActive ? 'active' : ''} ${inlineSectionClass}" data-status="${safeStatusClass}" ${dataAnchor}>
    <a href="${href}">${typeIcon}<span class="status-dot ${safeStatusClass}"></span><span class="phase-name">${escapeHtml(phase.name)}</span></a></li>`;
}

/** Generate navigation sidebar HTML */
function generateNavSidebar(filePath) {
  const { planInfo, currentIndex, allPhases } = getNavigationContext(filePath);
  if (!planInfo.isPlan) return '';

  const planName = path.basename(planInfo.planDir);
  const normalizedCurrentPath = path.normalize(filePath);

  // Flat list when <= 15 phases (no accordion grouping needed)
  if (allPhases.length <= 15) {
    const items = allPhases.map((phase, index) => renderPhaseItem(phase, index, currentIndex, normalizedCurrentPath)).join('');
    return `<nav class="plan-nav" id="plan-nav">
      <div class="plan-title"><span class="plan-icon">&#128214;</span><span>${escapeHtml(planName)}</span></div>
      <ul class="phase-list">${items}</ul></nav>`;
  }

  // Accordion groups for large plans (> 15 phases)
  const groups = [];
  let currentGroup = [], groupStart = 0;
  allPhases.forEach((phase, index) => {
    if (currentGroup.length === 0) groupStart = phase.phase;
    currentGroup.push({ phase, index });
    if (currentGroup.length === 10 || index === allPhases.length - 1 || (phase.phase % 10 === 0 && phase.phase !== groupStart)) {
      groups.push({ start: groupStart, end: phase.phase, phases: [...currentGroup] });
      currentGroup = [];
    }
  });

  const groupsHtml = groups.map(group => {
    const groupId = `phase-group-${group.start}-${group.end}`;
    const groupLabel = group.start === 0 ? 'Overview' : group.start === group.end ? `Phase ${group.start}` : `Phases ${group.start}-${group.end}`;
    const badge = getGroupBadge(group.phases.map(p => p.phase));
    const items = group.phases.map(({ phase, index }) => renderPhaseItem(phase, index, currentIndex, normalizedCurrentPath)).join('');
    return `<div class="phase-group" data-phase-id="${groupId}">
      <button class="phase-header" tabindex="0" aria-expanded="true" aria-controls="${groupId}-items">
        <span class="phase-chevron">&#9660;</span><span class="phase-name">${escapeHtml(groupLabel)}</span>${badge}
      </button>
      <ul class="phase-items" id="${groupId}-items">${items}</ul></div>`;
  }).join('');

  return `<nav class="plan-nav" id="plan-nav">
    <div class="plan-title"><span class="plan-icon">&#128214;</span><span>${escapeHtml(planName)}</span></div>
    ${groupsHtml}</nav>`;
}

/** Generate prev/next navigation footer HTML */
function generateNavFooter(filePath) {
  const { prev, next } = getNavigationContext(filePath);
  if (!prev && !next) return '';

  const prevExists = prev && fs.existsSync(prev.file);
  const nextExists = next && fs.existsSync(next.file);

  const prevHtml = prev ? (prevExists
    ? `<a href="/view?file=${encodeURIComponent(prev.file)}" class="nav-prev"><span class="nav-arrow">&larr;</span><span class="nav-label">${escapeHtml(prev.name)}</span></a>`
    : `<span class="nav-prev nav-unavailable" title="Phase planned but not yet implemented"><span class="nav-arrow">&larr;</span><span class="nav-label">${escapeHtml(prev.name)}</span><span class="nav-badge">Planned</span></span>`)
    : '<span></span>';

  const nextHtml = next ? (nextExists
    ? `<a href="/view?file=${encodeURIComponent(next.file)}" class="nav-next"><span class="nav-label">${escapeHtml(next.name)}</span><span class="nav-arrow">&rarr;</span></a>`
    : `<span class="nav-next nav-unavailable" title="Phase planned but not yet implemented"><span class="nav-label">${escapeHtml(next.name)}</span><span class="nav-badge">Planned</span><span class="nav-arrow">&rarr;</span></span>`)
    : '<span></span>';

  return `<footer class="nav-footer">${prevHtml}${nextHtml}</footer>`;
}

module.exports = { detectPlan, parsePlanTable, getNavigationContext, generateNavSidebar, generateNavFooter };
