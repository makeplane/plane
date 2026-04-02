#!/usr/bin/env node
/**
 * Tests for plan-table-parser shared module
 * Run: node .claude/skills/_shared/tests/plan-table-parser.test.cjs
 */

'use strict';

const fs = require('fs');
const path = require('path');
const { mkdtempSync } = require('node:fs');
const { tmpdir } = require('node:os');
const { parsePlanPhases, normalizeStatus, filenameToTitle } = require('../lib/plan-table-parser.cjs');

let passed = 0, failed = 0;

function test(name, fn) {
  try { fn(); passed++; console.log(`  [OK] ${name}`); }
  catch (err) { failed++; console.log(`  [X]  ${name}\n       ${err.message}`); }
}
function assertEqual(actual, expected, msg) {
  if (actual !== expected) throw new Error(`${msg}: expected "${expected}", got "${actual}"`);
}
function assertTrue(val, msg) { if (!val) throw new Error(`${msg}: expected truthy`); }
function assertFalse(val, msg) { if (val) throw new Error(`${msg}: expected falsy`); }
function assertIncludes(str, sub, msg) {
  if (!String(str).includes(sub)) throw new Error(`${msg}: expected to include "${sub}"`);
}

// --- Temp directory setup ---
// L1: Use mkdtempSync instead of fixed /tmp/ path to avoid conflicts in parallel runs
const tmpDir = mkdtempSync(path.join(tmpdir(), 'ck-plan-parser-'));
function tmpFile(name, content) {
  const fp = path.join(tmpDir, name);
  fs.mkdirSync(path.dirname(fp), { recursive: true });
  fs.writeFileSync(fp, content, 'utf8');
  return fp;
}

// ============================================================
console.log('\n--- normalizeStatus ---');

test('Complete -> completed', () => assertEqual(normalizeStatus('Complete'), 'completed', 'status'));
test('Done -> completed', () => assertEqual(normalizeStatus('Done'), 'completed', 'status'));
test('✓ -> completed', () => assertEqual(normalizeStatus('✓'), 'completed', 'status'));
test('✅ -> completed', () => assertEqual(normalizeStatus('✅'), 'completed', 'status'));
test('WIP -> in-progress', () => assertEqual(normalizeStatus('WIP'), 'in-progress', 'status'));
test('🔄 -> in-progress', () => assertEqual(normalizeStatus('🔄'), 'in-progress', 'status'));
test('Active -> in-progress', () => assertEqual(normalizeStatus('Active'), 'in-progress', 'status'));
test('Pending -> pending', () => assertEqual(normalizeStatus('Pending'), 'pending', 'status'));
test('unknown -> pending', () => assertEqual(normalizeStatus('foobar'), 'pending', 'status'));
test('empty string -> pending', () => assertEqual(normalizeStatus(''), 'pending', 'status'));

// ============================================================
console.log('\n--- filenameToTitle ---');

test('phase-01a-foo-bar.md -> Foo Bar', () => assertEqual(filenameToTitle('phase-01a-foo-bar.md'), 'Foo Bar', 'title'));
test('phase-02-x.md -> X', () => assertEqual(filenameToTitle('phase-02-x.md'), 'X', 'title'));
test('phase-01-background-and-layout.md -> Background And Layout', () =>
  assertEqual(filenameToTitle('phase-01-background-and-layout.md'), 'Background And Layout', 'title'));
test('README.md unchanged', () => assertEqual(filenameToTitle('README.md'), 'README.md', 'unchanged'));
test('plain-name.md unchanged', () => assertEqual(filenameToTitle('plain-name.md'), 'plain-name.md', 'unchanged'));

// ============================================================
console.log('\n--- Format 0: Header-aware table ---');

test('Format 0: alphanumeric IDs (1a, 1b, 2, 4a)', () => {
  // Create phase files so parsePlanPhases can resolve them
  ['phase-01a-setup.md','phase-01b-config.md','phase-02-impl.md','phase-04a-deploy.md'].forEach(f =>
    fs.writeFileSync(path.join(tmpDir, f), '', 'utf8'));

  const content = `# Plan

| Phase | Name | Status |
|-------|------|--------|
| 1a | [Setup](./phase-01a-setup.md) | Pending |
| 1b | [Config](./phase-01b-config.md) | In Progress |
| 2 | [Implementation](./phase-02-impl.md) | Complete |
| 4a | [Deploy](./phase-04a-deploy.md) | Pending |
`;
  const phases = parsePlanPhases(content, tmpDir);
  assertEqual(phases.length, 4, 'phase count');
  assertEqual(phases[0].phaseId, '1a', 'phaseId 1a');
  assertEqual(phases[1].phaseId, '1b', 'phaseId 1b');
  assertEqual(phases[2].phaseId, '2', 'phaseId 2');
  assertEqual(phases[3].phaseId, '4a', 'phaseId 4a');
  assertEqual(phases[2].status, 'completed', 'complete status');
  assertEqual(phases[1].status, 'in-progress', 'in-progress status');
});

test('Format 0: Status at column 4 (not column 3)', () => {
  fs.writeFileSync(path.join(tmpDir, 'phase-01-test.md'), '', 'utf8');
  const content = `| # | Name | Effort | Status |
|---|------|--------|--------|
| 1 | [Test Phase](./phase-01-test.md) | 2h | Done |
`;
  const phases = parsePlanPhases(content, tmpDir);
  assertEqual(phases.length, 1, 'phase count');
  assertEqual(phases[0].status, 'completed', 'status from col 4');
});

test('Format 0: filename-to-title fallback', () => {
  fs.writeFileSync(path.join(tmpDir, 'phase-01-background-and-layout.md'), '', 'utf8');
  const content = `| Phase | Name | Status |
|-------|------|--------|
| 1 | [phase-01-background-and-layout.md](./phase-01-background-and-layout.md) | Pending |
`;
  const phases = parsePlanPhases(content, tmpDir);
  assertEqual(phases.length, 1, 'phase count');
  assertEqual(phases[0].name, 'Background And Layout', 'filename converted to title');
});

test('Format 0: multi-table disambiguation prefers table with links', () => {
  fs.writeFileSync(path.join(tmpDir, 'phase-01-auth.md'), '', 'utf8');
  const content = `| Category | Value |
|----------|-------|
| foo | bar |

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Auth](./phase-01-auth.md) | Pending |
`;
  // Second table has status col + links — should be chosen
  const phases = parsePlanPhases(content, tmpDir);
  assertEqual(phases.length, 1, 'only phase table parsed');
  assertEqual(phases[0].name, 'Auth', 'correct phase');
});

// ============================================================
console.log('\n--- Format 1: standard 4-column ---');

test('Format 1: standard table', () => {
  const content = `| Phase | Name | Status | Link |
|-------|------|--------|------|
| 1 | Setup | Pending | [setup](./phase-01-setup.md) |
`;
  // Format 0 will not match (no status column in header that matches), falls to F1
  // Actually F0 would match if header has Status... let's check with no status col
  const content2 = `Some plan text

| 1 | My Phase | Pending | [Link](./phase-01-setup.md) |
`;
  const phases = parsePlanPhases(content2, tmpDir);
  assertEqual(phases.length, 1, 'found 1 phase');
  assertEqual(phases[0].phase, 1, 'phase number');
  assertEqual(phases[0].name, 'My Phase', 'name');
  assertEqual(phases[0].status, 'pending', 'status');
});

// ============================================================
console.log('\n--- Format 2b: number-first with link ---');

test('Format 2b: number-first with link in col 2', () => {
  const content = `| 1 | [Tab Structure](./phase-01-tab.md) | Pending | High |`;
  const phases = parsePlanPhases(content, tmpDir);
  assertEqual(phases.length, 1, 'found 1 phase');
  assertEqual(phases[0].name, 'Tab Structure', 'name');
  assertEqual(phases[0].status, 'pending', 'status');
  assertIncludes(phases[0].file, 'phase-01-tab.md', 'file path');
});

// ============================================================
console.log('\n--- Format 2c: simple table without links ---');

test('Format 2c: simple table no links', () => {
  const content = `| # | Description | Status |
|---|-------------|--------|
| 01 | Backend: Install deps | Completed ✅ |
| 02 | Frontend: Setup | Pending |
`;
  // F0 parses this (has status col) — status must resolve
  const phases = parsePlanPhases(content, tmpDir);
  assertTrue(phases.length >= 1, 'found phases');
  assertEqual(phases[0].status, 'completed', 'completed status');
});

// ============================================================
console.log('\n--- Format 3: heading-based ---');

test('Format 3: heading-based phases', () => {
  const content = `### Phase 1: Discovery
- Status: Complete

### Phase 2: Implementation
- Status: In Progress
`;
  const phases = parsePlanPhases(content, tmpDir);
  assertEqual(phases.length, 2, 'found 2 phases');
  assertEqual(phases[0].name, 'Discovery', 'phase 1 name');
  assertEqual(phases[0].status, 'completed', 'phase 1 status');
  assertEqual(phases[1].status, 'in-progress', 'phase 2 status');
});

// ============================================================
console.log('\n--- Format 4: bullet-list ---');

test('Format 4: bullet-list with File: references', () => {
  fs.writeFileSync(path.join(tmpDir, 'phase-01-setup.md'), '', 'utf8');
  const content = `- Phase 01: Setup ✅
  - File: \`phase-01-setup.md\`
  - Completed: 2025-01-01
- Phase 02: Implementation
  - File: \`phase-02-impl.md\`
`;
  const phases = parsePlanPhases(content, tmpDir);
  assertTrue(phases.length >= 1, 'found phases');
  assertEqual(phases[0].name, 'Setup', 'phase 1 name');
  assertEqual(phases[0].status, 'completed', 'phase 1 completed');
  assertIncludes(phases[0].file, 'phase-01-setup.md', 'phase 1 file');
});

// ============================================================
console.log('\n--- Format 5: numbered list with checkbox ---');

test('Format 5: numbered list with checkbox status', () => {
  const content = `1) **Discovery**
2) **Implementation**

- [x] Discovery:
- [ ] Implementation:
`;
  const phases = parsePlanPhases(content, tmpDir);
  assertEqual(phases.length, 2, 'found 2 phases');
  assertEqual(phases[0].name, 'Discovery', 'name');
  assertEqual(phases[0].status, 'completed', 'checked = completed');
  assertEqual(phases[1].status, 'pending', 'unchecked = pending');
});

// ============================================================
console.log('\n--- Format 6: checkbox with bold links ---');

test('Format 6: checkbox with bold links', () => {
  const content = `- [x] **[Phase 1: Setup](./phase-01-setup.md)**
- [ ] **[Phase 2: Implementation](./phase-02-impl.md)**
`;
  const phases = parsePlanPhases(content, tmpDir);
  assertEqual(phases.length, 2, 'found 2 phases');
  assertEqual(phases[0].name, 'Setup', 'phase 1 name');
  assertEqual(phases[0].status, 'completed', 'checked = completed');
  assertEqual(phases[1].status, 'pending', 'unchecked = pending');
  assertIncludes(phases[1].file, 'phase-02-impl.md', 'file path');
});

// ============================================================
console.log('\n--- Edge cases ---');

test('Empty content returns []', () => {
  const phases = parsePlanPhases('', tmpDir);
  assertEqual(phases.length, 0, 'empty');
});

test('Anchor generation with slugify option', () => {
  fs.writeFileSync(path.join(tmpDir, 'phase-01-auth.md'), '', 'utf8');
  const content = `| Phase | Name | Status |
|-------|------|--------|
| 1 | [Auth Setup](./phase-01-auth.md) | Pending |
`;
  const slugify = t => t.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const phases = parsePlanPhases(content, tmpDir, { generateAnchors: true, slugify });
  assertEqual(phases.length, 1, 'found 1 phase');
  assertEqual(phases[0].anchor, 'phase-01-auth-setup', 'anchor generated');
});

test('Mixed alphanumeric + pure numeric IDs in same table', () => {
  ['phase-01a-intro.md','phase-01b-setup.md','phase-02-core.md'].forEach(f =>
    fs.writeFileSync(path.join(tmpDir, f), '', 'utf8'));
  const content = `| Phase | Name | Status |
|-------|------|--------|
| 1a | [Intro](./phase-01a-intro.md) | Pending |
| 1b | [Setup](./phase-01b-setup.md) | Done |
| 2 | [Core](./phase-02-core.md) | In Progress |
`;
  const phases = parsePlanPhases(content, tmpDir);
  assertEqual(phases.length, 3, 'found 3 phases');
  assertEqual(phases[0].phaseId, '1a', 'phaseId 1a');
  assertEqual(phases[1].phaseId, '1b', 'phaseId 1b');
  assertEqual(phases[2].phaseId, '2', 'phaseId 2');
  assertEqual(phases[1].status, 'completed', '1b done');
  assertEqual(phases[2].status, 'in-progress', '2 in-progress');
});

// ============================================================
// M8: Tests merged from unit test file (.claude/skills/_shared/lib/__tests__/plan-table-parser.test.cjs)
// These cover cases not already present in this integration suite.

console.log('\n--- normalizeStatus (unit) ---');

test('null input -> pending', () => assertEqual(normalizeStatus(null), 'pending', 'status'));

console.log('\n--- filenameToTitle (unit: acronyms) ---');

// Note: capitalizes all words including conjunctions (intentional — simpler, consistent)
test('CLI, SDK acronyms uppercased', () => assertEqual(filenameToTitle('phase-01-setup-cli-sdk.md'), 'Setup CLI SDK', 'title'));
test('API acronym uppercased', () => assertEqual(filenameToTitle('phase-02-implement-api.md'), 'Implement API', 'title'));
test('UI acronym uppercased', () => assertEqual(filenameToTitle('phase-03-build-ui-components.md'), 'Build UI Components', 'title'));

console.log('\n--- Format 0 (unit: letter normalization) ---');

test('Format 0: phaseId letter normalized to lowercase (1A -> 1a)', () => {
  const content = `| # | Phase | Status |
|---|-------|--------|
| 1A | Setup Part A | completed |`;
  const phases = parsePlanPhases(content, tmpDir);
  assertEqual(phases.length, 1, 'phase count');
  assertEqual(phases[0].phaseId, '1a', 'phaseId lowercase');
});

test('Format 0: row names parsed correctly', () => {
  const content = `| # | Phase | Status |
|---|-------|--------|
| 1 | Alpha | completed |
| 2 | Beta | pending |`;
  const phases = parsePlanPhases(content, tmpDir);
  assertEqual(phases.length, 2, 'phase count');
  assertEqual(phases[0].name, 'Alpha', 'phase 1 name');
  assertEqual(phases[1].name, 'Beta', 'phase 2 name');
});

console.log('\n--- Format 2 (unit: link-first table) ---');

test('Format 2: [Phase N](path) link-first table', () => {
  const content = `| [Phase 1](./phase-01-setup.md) | Setup environment | completed |
| [Phase 2](./phase-02-impl.md) | Implementation | in-progress |`;
  const phases = parsePlanPhases(content, tmpDir);
  assertEqual(phases.length, 2, 'phase count');
  assertEqual(phases[0].phaseId, '1', 'phaseId 1');
  assertEqual(phases[0].status, 'completed', 'phase 1 status');
  assertEqual(phases[1].phaseId, '2', 'phaseId 2');
  assertEqual(phases[1].status, 'in-progress', 'phase 2 status');
});

console.log('\n--- M5: Date in status position ---');

test('M5: Date value in status position treated as completed', () => {
  assertEqual(normalizeStatus('2026-01-01'), 'completed', 'date -> completed');
  assertEqual(normalizeStatus('2025-12-31'), 'completed', 'date -> completed');
});

// ============================================================
// Cleanup
fs.rmSync(tmpDir, { recursive: true, force: true });

console.log('\n--- Results ---');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Total:  ${passed + failed}`);
if (failed > 0) process.exit(1);
console.log('\nAll tests passed!');
