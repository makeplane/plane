/**
 * Plan Parser - parses plan.md files to extract phase metadata
 * Delegates to shared parser module for format support
 */

const fs = require('fs');
const path = require('path');
const { parsePlanPhases, normalizeStatus } = require('../../../_shared/lib/plan-table-parser.cjs');

/**
 * Parse plan.md to extract phase metadata
 * @param {string} planFilePath - Path to plan.md
 * @returns {Array<{phase: number, phaseId: string, name: string, status: string, file: string, linkText: string}>}
 */
function parsePlanTable(planFilePath) {
  const content = fs.readFileSync(planFilePath, 'utf8');
  const dir = path.dirname(planFilePath);
  return parsePlanPhases(content, dir);
}

module.exports = { parsePlanTable, normalizeStatus };
