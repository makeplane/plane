#!/usr/bin/env node

/**
 * Tests for markdown-novel-viewer
 * Run: node scripts/tests/server.test.cjs
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

const { isPortAvailable, findAvailablePort, DEFAULT_PORT } = require('../lib/port-finder.cjs');
const { writePidFile, readPidFile, removePidFile, findRunningInstances } = require('../lib/process-mgr.cjs');
const { getMimeType, MIME_TYPES, isPathSafe, sanitizeErrorMessage } = require('../lib/http-server.cjs');
const { resolveImages, addHeadingIds, generateTOC, renderTOCHtml } = require('../lib/markdown-renderer.cjs');
const { detectPlan, parsePlanTable, getNavigationContext, generateNavSidebar } = require('../lib/plan-navigator.cjs');

// Test utilities
let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failed++;
    console.log(`  ✗ ${name}`);
    console.log(`    Error: ${err.message}`);
  }
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(`${message}: expected "${expected}", got "${actual}"`);
  }
}

function assertTrue(value, message) {
  if (!value) {
    throw new Error(`${message}: expected truthy value`);
  }
}

function assertFalse(value, message) {
  if (value) {
    throw new Error(`${message}: expected falsy value`);
  }
}

function assertIncludes(str, substr, message) {
  if (!str.includes(substr)) {
    throw new Error(`${message}: expected to include "${substr}"`);
  }
}

// Test suites
console.log('\n--- Port Finder Tests ---');

test('DEFAULT_PORT is 3456', () => {
  assertEqual(DEFAULT_PORT, 3456, 'Default port');
});

test('isPortAvailable returns boolean', () => {
  // Sync test - function exists
  assertTrue(typeof isPortAvailable === 'function', 'Should be function');
});

test('findAvailablePort returns number', () => {
  // Sync test - actual async behavior tested in integration
  assertTrue(typeof findAvailablePort === 'function', 'Should be function');
});

console.log('\n--- Process Manager Tests ---');

test('writePidFile and readPidFile work correctly', () => {
  const testPort = 9876;
  const testPid = 12345;

  writePidFile(testPort, testPid);
  const readPid = readPidFile(testPort);
  assertEqual(readPid, testPid, 'PID should match');

  removePidFile(testPort);
  const afterRemove = readPidFile(testPort);
  assertEqual(afterRemove, null, 'Should be null after remove');
});

test('findRunningInstances returns array', () => {
  const instances = findRunningInstances();
  assertTrue(Array.isArray(instances), 'Should return array');
});

console.log('\n--- HTTP Server Tests ---');

test('getMimeType returns correct types', () => {
  assertEqual(getMimeType('test.html'), 'text/html', 'HTML type');
  assertEqual(getMimeType('test.css'), 'text/css', 'CSS type');
  assertEqual(getMimeType('test.js'), 'application/javascript', 'JS type');
  assertEqual(getMimeType('test.png'), 'image/png', 'PNG type');
  assertEqual(getMimeType('test.jpg'), 'image/jpeg', 'JPG type');
  assertEqual(getMimeType('test.unknown'), 'application/octet-stream', 'Unknown type');
});

test('MIME_TYPES has common extensions', () => {
  assertTrue(MIME_TYPES['.html'], 'Has .html');
  assertTrue(MIME_TYPES['.css'], 'Has .css');
  assertTrue(MIME_TYPES['.js'], 'Has .js');
  assertTrue(MIME_TYPES['.png'], 'Has .png');
  assertTrue(MIME_TYPES['.md'], 'Has .md');
});

console.log('\n--- Security Tests ---');

test('isPathSafe blocks path traversal', () => {
  assertFalse(isPathSafe('/etc/../etc/passwd', ['/home']), 'Should block .. traversal');
  assertFalse(isPathSafe('/path\0/file', ['/path']), 'Should block null bytes');
});

test('isPathSafe allows valid paths', () => {
  assertTrue(isPathSafe('/tmp/test.md', ['/tmp']), 'Should allow path in allowed dir');
});

test('sanitizeErrorMessage removes paths', () => {
  const sanitized = sanitizeErrorMessage('Error: /etc/passwd not found');
  assertFalse(sanitized.includes('/etc/passwd'), 'Should not contain path');
  assertIncludes(sanitized, '[path]', 'Should replace with placeholder');
});

console.log('\n--- Markdown Renderer Tests ---');

test('resolveImages converts relative paths', () => {
  const md = '![Alt](./image.png)';
  const resolved = resolveImages(md, '/base/path');
  assertIncludes(resolved, '/file/', 'Should include /file/ route');
  // Path is URL-encoded; decode to verify base path is present
  assertIncludes(decodeURIComponent(resolved), '/base/path', 'Should include base path');
});

test('resolveImages preserves absolute URLs', () => {
  const md = '![Alt](https://example.com/image.png)';
  const resolved = resolveImages(md, '/base/path');
  assertEqual(resolved, md, 'Should preserve absolute URL');
});

test('resolveImages handles reference-style definitions', () => {
  const md = '![Step 1 Initial]\n\n[Step 1 Initial]: ./screenshots/step1.png';
  const resolved = resolveImages(md, '/base/path');
  assertIncludes(resolved, '/file/', 'Should include /file/ route in ref definition');
  // Path is URL-encoded; decode to verify resolved path
  assertIncludes(decodeURIComponent(resolved), '/base/path/screenshots/step1.png', 'Should resolve relative path');
});

test('resolveImages handles reference-style with titles', () => {
  const md = '[logo]: ./images/logo.png "Company Logo"';
  const resolved = resolveImages(md, '/project');
  // Path is URL-encoded; decode to verify
  assertIncludes(decodeURIComponent(resolved), '/project/images/logo.png', 'Should resolve path with title');
});

test('resolveImages handles inline images with titles', () => {
  const md = '![Alt](./image.png "Title text")';
  const resolved = resolveImages(md, '/base');
  // Path is URL-encoded; decode to verify
  assertIncludes(decodeURIComponent(resolved), '/base/image.png', 'Should resolve inline with title');
});

test('addHeadingIds adds id attributes', () => {
  const html = '<h1>Test Heading</h1><h2>Another</h2>';
  const withIds = addHeadingIds(html);
  assertIncludes(withIds, 'id="test-heading"', 'Should add id to h1');
  assertIncludes(withIds, 'id="another"', 'Should add id to h2');
});

test('addHeadingIds handles duplicates', () => {
  const html = '<h1>Test</h1><h2>Test</h2>';
  const withIds = addHeadingIds(html);
  assertIncludes(withIds, 'id="test"', 'Should have first id');
  assertIncludes(withIds, 'id="test-1"', 'Should have unique second id');
});

test('generateTOC extracts headings', () => {
  const html = '<h1 id="one">One</h1><h2 id="two">Two</h2><h3 id="three">Three</h3>';
  const toc = generateTOC(html);
  assertEqual(toc.length, 3, 'Should find 3 headings');
  assertEqual(toc[0].level, 1, 'First should be h1');
  assertEqual(toc[0].id, 'one', 'First id should be "one"');
});

test('renderTOCHtml generates list', () => {
  const toc = [{ level: 1, id: 'test', text: 'Test' }];
  const html = renderTOCHtml(toc);
  assertIncludes(html, '<ul', 'Should have ul');
  assertIncludes(html, 'href="#test"', 'Should have anchor');
  assertIncludes(html, 'Test', 'Should have text');
});

test('renderTOCHtml handles empty array', () => {
  const html = renderTOCHtml([]);
  assertEqual(html, '', 'Should return empty string');
});

console.log('\n--- Plan Navigator Tests ---');

// Create temp plan structure for testing
const testPlanDir = '/tmp/test-novel-viewer-plan';
const testPlanFile = path.join(testPlanDir, 'plan.md');
const testPhaseFile = path.join(testPlanDir, 'phase-01-test.md');

function setupTestPlan() {
  if (!fs.existsSync(testPlanDir)) {
    fs.mkdirSync(testPlanDir, { recursive: true });
  }

  fs.writeFileSync(testPlanFile, `# Test Plan

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Test Phase](./phase-01-test.md) | Pending |
`);

  fs.writeFileSync(testPhaseFile, `# Phase 1: Test Phase

Content here.
`);
}

function cleanupTestPlan() {
  if (fs.existsSync(testPlanDir)) {
    fs.rmSync(testPlanDir, { recursive: true });
  }
}

setupTestPlan();

test('detectPlan identifies plan directory', () => {
  const result = detectPlan(testPlanFile);
  assertTrue(result.isPlan, 'Should detect as plan');
  assertEqual(result.planDir, testPlanDir, 'Should have correct dir');
  assertTrue(result.phases.length >= 1, 'Should find phases');
});

test('detectPlan returns false for non-plan', () => {
  const result = detectPlan('/tmp/random-file.md');
  assertFalse(result.isPlan, 'Should not be plan');
});

test('parsePlanTable extracts phases', () => {
  const phases = parsePlanTable(testPlanFile);
  assertTrue(phases.length >= 1, 'Should find phases');
  assertEqual(phases[0].phase, 1, 'First phase number');
  assertEqual(phases[0].name, 'Test Phase', 'Phase name');
  assertEqual(phases[0].status, 'pending', 'Status should be lowercase');
});

test('getNavigationContext returns correct structure', () => {
  const ctx = getNavigationContext(testPlanFile);
  assertTrue(ctx.planInfo.isPlan, 'Should be plan');
  assertTrue(ctx.allPhases.length >= 1, 'Should have phases');
  assertEqual(ctx.currentIndex, 0, 'Plan.md should be index 0');
});

test('generateNavSidebar returns HTML', () => {
  const html = generateNavSidebar(testPlanFile);
  assertIncludes(html, '<nav', 'Should have nav element');
  assertIncludes(html, 'phase-list', 'Should have phase list');
});

test('generateNavSidebar returns empty for non-plan', () => {
  const html = generateNavSidebar('/tmp/random.md');
  assertEqual(html, '', 'Should return empty string');
});

test('detectPlan sorts alphanumeric phase files (1a before 1b before 2)', () => {
  const alphaDir = '/tmp/test-alpha-plan';
  fs.mkdirSync(alphaDir, { recursive: true });
  fs.writeFileSync(path.join(alphaDir, 'plan.md'), '# Plan\n');
  ['phase-02-core.md', 'phase-01b-config.md', 'phase-01a-setup.md'].forEach(f =>
    fs.writeFileSync(path.join(alphaDir, f), `# ${f}\n`));

  const result = detectPlan(path.join(alphaDir, 'plan.md'));
  assertTrue(result.isPlan, 'Should be plan');
  assertEqual(result.phases.length, 3, 'Should find 3 phases');
  assertTrue(result.phases[0].endsWith('phase-01a-setup.md'), '1a first');
  assertTrue(result.phases[1].endsWith('phase-01b-config.md'), '1b second');
  assertTrue(result.phases[2].endsWith('phase-02-core.md'), '2 third');

  fs.rmSync(alphaDir, { recursive: true, force: true });
});

test('generateNavSidebar uses flat list when <= 15 phases', () => {
  const smallDir = '/tmp/test-small-plan';
  fs.mkdirSync(smallDir, { recursive: true });
  // Create 3 phase files + plan.md (4 total — well under 15)
  const planContent = `# Plan

| Phase | Name | Status |
|-------|------|--------|
| 1 | [Alpha](./phase-01-alpha.md) | Pending |
| 2 | [Beta](./phase-02-beta.md) | Pending |
| 3 | [Gamma](./phase-03-gamma.md) | Pending |
`;
  fs.writeFileSync(path.join(smallDir, 'plan.md'), planContent);
  ['phase-01-alpha.md', 'phase-02-beta.md', 'phase-03-gamma.md'].forEach(f =>
    fs.writeFileSync(path.join(smallDir, f), `# ${f}\n`));

  const html = generateNavSidebar(path.join(smallDir, 'plan.md'));
  assertIncludes(html, 'phase-list', 'Should use flat phase-list class');
  assertFalse(html.includes('phase-group'), 'Should NOT use accordion groups');

  fs.rmSync(smallDir, { recursive: true, force: true });
});

cleanupTestPlan();

// Summary
console.log('\n--- Test Results ---');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Total: ${passed + failed}`);

if (failed > 0) {
  process.exit(1);
}

console.log('\nAll tests passed!');
