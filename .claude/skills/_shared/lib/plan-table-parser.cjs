/**
 * Shared plan table parser — used by plans-kanban and markdown-novel-viewer.
 * Supports 7 plan.md formats with alphanumeric phase IDs (e.g. 1a, 2b).
 */

const path = require('path');

/** Maps raw status strings to canonical values */
function normalizeStatus(raw) {
  const s = (raw || '').toLowerCase().trim();
  // Date values (e.g., "2026-01-01") in status position mean "completed"
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return 'completed';
  if (s.includes('complete') || s.includes('done') || s.includes('✓') || s.includes('✅')) return 'completed';
  if (s.includes('progress') || s.includes('active') || s.includes('wip') || s.includes('🔄')) return 'in-progress';
  return 'pending';
}

/** Known acronyms that should be fully uppercased in phase titles */
const ACRONYMS = new Set(['api', 'ui', 'ux', 'cli', 'ci', 'cd', 'db', 'sql', 'css', 'html', 'sdk']);

/** Converts phase filename to title only if it matches phase-NNx-*.md pattern */
function filenameToTitle(name) {
  if (!/^phase-\d+[a-z]?-.*\.md$/i.test(name)) return name;
  // Note: capitalizes all words including conjunctions (intentional — simpler, consistent)
  return name
    .replace(/^phase-\d+[a-z]?-/i, '')
    .replace(/\.md$/i, '')
    .replace(/-/g, ' ')
    .replace(/\b\w+/g, (word) =>
      ACRONYMS.has(word.toLowerCase())
        ? word.toUpperCase()
        : word.charAt(0).toUpperCase() + word.slice(1)
    );
}

/** Build a phase object from extracted parts */
function makePhase(phaseIdStr, letterStr, name, statusRaw, filePath, linkText, dir, options) {
  const phaseNum = parseInt(phaseIdStr, 10);
  const phaseId = `${phaseNum}${(letterStr || '').toLowerCase()}`;
  const resolvedFile = filePath ? path.resolve(dir, filePath) : null;
  const obj = {
    phase: phaseNum,
    phaseId,
    name: name.trim(),
    status: normalizeStatus(statusRaw),
    file: resolvedFile,
    linkText: (linkText || name).trim(),
    anchor: null
  };
  if (options.generateAnchors && options.slugify && resolvedFile) {
    const pad = String(phaseNum).padStart(2, '0');
    obj.anchor = `phase-${pad}${letterStr || ''}-${options.slugify(obj.name)}`;
  }
  return obj;
}

/** Format 0: Header-aware markdown table — finds Status column, supports any column order */
function parseFormat0(content, dir, options) {
  const lines = content.split('\n');
  const tables = [];
  let i = 0;
  while (i < lines.length) {
    if (!lines[i].trim().startsWith('|')) { i++; continue; }
    const sepLine = lines[i + 1] || '';
    if (!sepLine.trim().startsWith('|') || !sepLine.includes('---')) { i++; continue; }

    const headers = lines[i].split('|').map(h => h.trim().toLowerCase()).filter(Boolean);
    let phaseCol = -1, nameCol = -1, nameColExplicit = false, statusCol = -1;
    headers.forEach((h, idx) => {
      if (h === '#' || h === 'phase' || h === 'id') { if (phaseCol < 0) phaseCol = idx; }
      // Explicit name column headers (H1: also recognize 'task' and 'description')
      if ((h === 'name' || h === 'task' || h === 'description') && !nameColExplicit) {
        nameCol = idx; nameColExplicit = true;
      }
      // 'phase' can also be the name col if not already taken as phaseCol
      if (h === 'phase' && idx !== phaseCol && !nameColExplicit) { if (nameCol < 0) nameCol = idx; }
      if (h === 'status') statusCol = idx;
    });
    if (statusCol < 0) { i += 2; continue; }

    const phases = [];
    let j = i + 2;
    while (j < lines.length && lines[j].trim().startsWith('|')) {
      const cols = lines[j].split('|').map(c => c.trim()).filter((_, k) => k > 0);
      if (cols.length > 0 && cols[cols.length - 1] === '') cols.pop();
      const phaseRaw = phaseCol >= 0 ? (cols[phaseCol] || '') : '';
      const nameRaw = nameCol >= 0 ? (cols[nameCol] || '') : '';
      const statusRaw = statusCol >= 0 ? (cols[statusCol] || '') : 'pending';
      const idMatch = phaseRaw.match(/(\d+)([a-z]?)/i);
      if (!idMatch) { j++; continue; }

      // H2: Only check nameRaw and phaseRaw for links, not all columns (avoids false positives)
      const linkMatch = nameRaw.match(/\[([^\]]+)\]\(([^)]+)\)/) || phaseRaw.match(/\[([^\]]+)\]\(([^)]+)\)/);
      // Note: file is null when no link found (not empty string)
      // This is intentional — consumers check `p.file !== null`
      let name, filePath, linkText;
      if (linkMatch) {
        linkText = linkMatch[1];
        filePath = linkMatch[2];
        name = /^phase-\d+[a-z]?-.*\.md$/i.test(linkText) ? filenameToTitle(linkText) : linkText;
      } else {
        name = nameRaw || `Phase ${idMatch[1]}`;
        filePath = null;
        linkText = name;
      }
      phases.push(makePhase(idMatch[1], idMatch[2], name, statusRaw, filePath, linkText, dir, options));
      j++;
    }
    if (phases.length > 0) tables.push({ phases, hasLinks: phases.some(p => p.file !== null) });
    i = j;
  }
  if (tables.length === 0) return [];
  const linked = tables.filter(t => t.hasLinks);
  return (linked.length > 0 ? linked[0] : tables[0]).phases;
}

/** Core parser — tries Format 0 first, then fallbacks */
function parsePlanPhases(content, dir, options = {}) {
  if (!content) return [];
  options = { generateAnchors: false, slugify: null, ...options };

  // Format 0: header-aware table (highest priority)
  const f0 = parseFormat0(content, dir, options);
  if (f0.length > 0) return f0;

  const phases = [];
  let match;

  // Format 1: | Phase | Name | Status | [Link](path) |
  const f1Regex = /\|\s*(\d+)([a-z]?)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*\[([^\]]+)\]\(([^)]+)\)/gi;
  while ((match = f1Regex.exec(content)) !== null) {
    phases.push(makePhase(match[1], match[2], match[3], match[4], match[6], match[5], dir, options));
  }
  if (phases.length > 0) return phases;

  // Format 2: | [Phase X](path) | Description | Status |
  const f2Regex = /\|\s*\[(?:Phase\s*)?(\d+)([a-z]?)\]\(([^)]+)\)\s*\|\s*([^|]+)\s*\|\s*([^|]+)/gi;
  while ((match = f2Regex.exec(content)) !== null) {
    phases.push(makePhase(match[1], match[2], match[4], match[5], match[3], `Phase ${match[1]}${match[2]}`, dir, options));
  }
  if (phases.length > 0) return phases;

  // Format 2b: | # | [Name](path) | Status |
  const f2bRegex = /\|\s*(\d+)([a-z]?)\s*\|\s*\[([^\]]+)\]\(([^)]+)\)\s*\|\s*([^|]+)/gi;
  while ((match = f2bRegex.exec(content)) !== null) {
    phases.push(makePhase(match[1], match[2], match[3], match[5], match[4], match[3], dir, options));
  }
  if (phases.length > 0) return phases;

  // Format 2c: | # | Description | Status | (no links, skip header/separator rows)
  const f2cRegex = /\|\s*0?(\d+)([a-z]?)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|/gi;
  while ((match = f2cRegex.exec(content)) !== null) {
    const name = match[3].trim();
    if (['description', 'name', 'phase'].includes(name.toLowerCase())) continue;
    if (name.includes('---') || name.includes('===')) continue;
    phases.push(makePhase(match[1], match[2], name, match[4], null, name, dir, options));
  }
  if (phases.length > 0) return phases;

  // Format 3: ### Phase X: Name with - Status: XXX
  const lines3 = content.split('\n');
  let cur3 = null;
  for (const line of lines3) {
    const hm = /###\s*Phase\s*(\d+)([a-z]?)[:\s]+(.+)/i.exec(line);
    if (hm) {
      if (cur3) phases.push(cur3);
      cur3 = makePhase(hm[1], hm[2], hm[3], 'pending', null, `Phase ${hm[1]}${hm[2]}`, dir, options);
    }
    if (cur3) {
      const sm = /-\s*Status:\s*(.+)/i.exec(line);
      if (sm) cur3.status = normalizeStatus(sm[1]);
    }
  }
  if (cur3) phases.push(cur3);
  if (phases.length > 0) return phases;

  // Format 4: bullet-list "- Phase 01: Name ✅" with nested "- File: `path`"
  if (/^-\s*Phase\s*\d+[:\s]/m.test(content)) {
    const lines4 = content.split('\n');
    let cur4 = null;
    for (const line of lines4) {
      const pm = /^-\s*Phase\s*0?(\d+)([a-z]?)[:\s]+([^✅✓\n]+)/i.exec(line);
      if (pm) {
        if (cur4) phases.push(cur4);
        const name = pm[3].trim().replace(/\s*\([^)]*\)\s*$/, '');
        cur4 = makePhase(pm[1], pm[2], name, /[✅✓]/.test(line) ? 'completed' : 'pending', null, name, dir, options);
        continue;
      }
      if (cur4) {
        const fm = /^\s+-\s*File:\s*`?([^`\n]+)`?/i.exec(line);
        if (fm) { cur4.file = path.resolve(dir, fm[1].trim()); cur4.anchor = null; }
        const sm = /^\s+-\s*(Completed|Status):\s*(.+)/i.exec(line);
        // "Completed: <date>" means done; "Status: <value>" normalizes value
        if (sm) cur4.status = sm[1].toLowerCase() === 'completed' ? 'completed' : normalizeStatus(sm[2]);
        if (/^##/.test(line) || (/^-\s/.test(line) && !/^-\s*Phase/i.test(line) && !/^\s+-/.test(line))) {
          phases.push(cur4); cur4 = null;
        }
      }
    }
    if (cur4) phases.push(cur4);
    if (phases.length > 0) return phases;
  }

  // Format 5: numbered "1) **Name**" with checkbox "- [x] Name:"
  const phaseMap = new Map();
  const f5numRegex = /^(\d+)([a-z]?)[)\.]\s*\*\*([^*]+)\*\*/gmi;
  while ((match = f5numRegex.exec(content)) !== null) {
    const p = makePhase(match[1], match[2], match[3], 'pending', null, match[3], dir, options);
    phaseMap.set(match[3].trim().toLowerCase(), p);
  }
  if (phaseMap.size > 0) {
    const cbRegex = /^-\s*\[(x| )\]\s*([^:]+)/gmi;
    while ((match = cbRegex.exec(content)) !== null) {
      const p = phaseMap.get(match[2].trim().toLowerCase());
      if (p) p.status = match[1].toLowerCase() === 'x' ? 'completed' : 'pending';
    }
    phases.push(...Array.from(phaseMap.values()).sort((a, b) => a.phase - b.phase || a.phaseId.localeCompare(b.phaseId)));
    return phases;
  }

  // Format 6: "- [ ] **[Phase 1: Name](path)**"
  const f6Regex = /^-\s*\[(x| )\]\s*\*\*\[(?:Phase\s*)?(\d+)([a-z]?)[:\s]*([^\]]*)\]\(([^)]+)\)\*\*/gmi;
  while ((match = f6Regex.exec(content)) !== null) {
    const name = match[4].trim() || `Phase ${match[2]}${match[3]}`;
    phases.push(makePhase(match[2], match[3], name, match[1] === 'x' ? 'completed' : 'pending', match[5], name, dir, options));
  }

  return phases;
}

module.exports = { normalizeStatus, filenameToTitle, parsePlanPhases };
