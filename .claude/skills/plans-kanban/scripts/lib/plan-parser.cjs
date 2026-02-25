/**
 * Plan Parser - parses plan.md files to extract phase metadata
 * Standalone module for plans-kanban skill
 */

const fs = require("fs");
const path = require("path");

/**
 * Normalize status string to standard format
 * @param {string} raw - Raw status text
 * @returns {string} - Normalized status (completed, in-progress, pending)
 */
function normalizeStatus(raw) {
  const s = (raw || "").toLowerCase().trim();
  if (s.includes("complete") || s.includes("done") || s.includes("✓") || s.includes("✅")) {
    return "completed";
  }
  if (s.includes("progress") || s.includes("active") || s.includes("wip") || s.includes("🔄")) {
    return "in-progress";
  }
  return "pending";
}

/**
 * Parse plan.md to extract phase metadata from table
 * Supports multiple table formats
 * @param {string} planFilePath - Path to plan.md
 * @returns {Array<{phase: number, name: string, status: string, file: string}>}
 */
function parsePlanTable(planFilePath) {
  const content = fs.readFileSync(planFilePath, "utf8");
  const dir = path.dirname(planFilePath);
  const phases = [];
  let match;

  // Format 1: Standard table | Phase | Name | Status | [Link](path) |
  const standardRegex = /\|\s*(\d+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|\s*\[([^\]]+)\]\(([^)]+)\)/g;
  while ((match = standardRegex.exec(content)) !== null) {
    const [, phase, name, status, linkText, linkPath] = match;
    phases.push({
      phase: parseInt(phase, 10),
      name: name.trim(),
      status: normalizeStatus(status),
      file: path.resolve(dir, linkPath),
      linkText: linkText.trim(),
    });
  }

  // Format 2: Link-first table | [Phase X](path) | Description | Status |
  if (phases.length === 0) {
    const linkFirstRegex = /\|\s*\[(?:Phase\s*)?(\d+)\]\(([^)]+)\)\s*\|\s*([^|]+)\s*\|\s*([^|]+)/g;
    while ((match = linkFirstRegex.exec(content)) !== null) {
      const [, phase, linkPath, name, status] = match;
      phases.push({
        phase: parseInt(phase, 10),
        name: name.trim(),
        status: normalizeStatus(status),
        file: path.resolve(dir, linkPath),
        linkText: `Phase ${phase}`,
      });
    }
  }

  // Format 2b: Number-first with link | 1 | [Name](path) | Status |
  if (phases.length === 0) {
    const numLinkRegex = /\|\s*(\d+)\s*\|\s*\[([^\]]+)\]\(([^)]+)\)\s*\|\s*([^|]+)/g;
    while ((match = numLinkRegex.exec(content)) !== null) {
      const [, phase, name, linkPath, status] = match;
      phases.push({
        phase: parseInt(phase, 10),
        name: name.trim(),
        status: normalizeStatus(status),
        file: path.resolve(dir, linkPath),
        linkText: name.trim(),
      });
    }
  }

  // Format 2c: Simple table | Phase | Description | Status |
  if (phases.length === 0) {
    const simpleTblRegex = /\|\s*0?(\d+)\s*\|\s*([^|]+)\s*\|\s*([^|]+)\s*\|/g;
    while ((match = simpleTblRegex.exec(content)) !== null) {
      const [, phase, name, status] = match;
      if (name.trim().toLowerCase() === "description" || name.trim().toLowerCase() === "name") continue;
      if (name.includes("---") || name.includes("===")) continue;
      phases.push({
        phase: parseInt(phase, 10),
        name: name.trim(),
        status: normalizeStatus(status),
        file: planFilePath,
        linkText: name.trim(),
      });
    }
  }

  // Format 3: Heading-based phases (### Phase X: Name)
  if (phases.length === 0) {
    const contentLines = content.split("\n");
    let currentPhase = null;

    for (const line of contentLines) {
      const headingMatch = /###\s*Phase\s*(\d+)[:\s]+(.+)/i.exec(line);
      if (headingMatch) {
        if (currentPhase) phases.push(currentPhase);
        const phaseNum = parseInt(headingMatch[1], 10);
        currentPhase = {
          phase: phaseNum,
          name: headingMatch[2].trim(),
          status: "pending",
          file: planFilePath,
          linkText: `Phase ${phaseNum}`,
        };
      }
      if (currentPhase) {
        const statusMatch = /-\s*Status:\s*(.+)/i.exec(line);
        if (statusMatch) {
          currentPhase.status = normalizeStatus(statusMatch[1]);
        }
      }
    }
    if (currentPhase) phases.push(currentPhase);
  }

  // Format 4: Numbered list with checkbox
  if (phases.length === 0) {
    const numberedPhaseRegex = /^(\d+)[)\.]\s*\*\*([^*]+)\*\*/gm;
    const phaseMap = new Map();
    while ((match = numberedPhaseRegex.exec(content)) !== null) {
      const [, num, name] = match;
      phaseMap.set(name.trim().toLowerCase(), {
        phase: parseInt(num, 10),
        name: name.trim(),
        status: "pending",
        file: planFilePath,
        linkText: name.trim(),
      });
    }

    const checkboxRegex = /^-\s*\[(x| )\]\s*([^:]+)/gim;
    while ((match = checkboxRegex.exec(content)) !== null) {
      const [, checked, name] = match;
      const key = name.trim().toLowerCase();
      if (phaseMap.has(key)) {
        phaseMap.get(key).status = checked.toLowerCase() === "x" ? "completed" : "pending";
      }
    }

    if (phaseMap.size > 0) {
      phases.push(...Array.from(phaseMap.values()).sort((a, b) => a.phase - b.phase));
    }
  }

  // Format 5: Checkbox list with bold links
  if (phases.length === 0) {
    const checkboxLinkRegex = /^-\s*\[(x| )\]\s*\*\*\[(?:Phase\s*)?(\d+)[:\s]*([^\]]*)\]\(([^)]+)\)\*\*/gim;
    while ((match = checkboxLinkRegex.exec(content)) !== null) {
      const [, checked, phase, name, linkPath] = match;
      phases.push({
        phase: parseInt(phase, 10),
        name: name.trim() || `Phase ${phase}`,
        status: checked.toLowerCase() === "x" ? "completed" : "pending",
        file: path.resolve(dir, linkPath),
        linkText: name.trim() || `Phase ${phase}`,
      });
    }
  }

  return phases;
}

module.exports = {
  parsePlanTable,
  normalizeStatus,
};
