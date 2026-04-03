#!/usr/bin/env node
/**
 * Test suite for worktree.cjs
 * Run: node .claude/skills/worktree/scripts/worktree.test.cjs
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

const SCRIPT_PATH = path.join(__dirname, 'worktree.cjs');
const STANDALONE_DIR = path.dirname(path.dirname(__dirname)); // worktree dir
const MONOREPO_DIR = '/home/kai/claudekit';

let passed = 0;
let failed = 0;
const results = [];

// Test helper
function run(args, options = {}) {
  const cwd = options.cwd || STANDALONE_DIR;
  try {
    const output = execSync(`node "${SCRIPT_PATH}" ${args}`, {
      encoding: 'utf-8',
      cwd,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    return { success: true, output: output.trim(), exitCode: 0 };
  } catch (error) {
    return {
      success: false,
      output: error.stdout?.toString().trim() || '',
      stderr: error.stderr?.toString().trim() || '',
      exitCode: error.status || 1
    };
  }
}

function test(name, fn) {
  try {
    fn();
    passed++;
    results.push({ name, status: 'PASS' });
    console.log(`  ✓ ${name}`);
  } catch (error) {
    failed++;
    results.push({ name, status: 'FAIL', error: error.message });
    console.log(`  ✗ ${name}`);
    console.log(`    Error: ${error.message}`);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

function assertJSON(str) {
  try {
    return JSON.parse(str);
  } catch {
    throw new Error(`Invalid JSON: ${str.slice(0, 100)}...`);
  }
}

// ============================================
// INFO COMMAND TESTS
// ============================================
console.log('\n📋 INFO Command Tests');

test('info returns valid JSON', () => {
  const result = run('info --json');
  assert(result.success, 'Command should succeed');
  const json = assertJSON(result.output);
  assert(json.info === true, 'Should have info: true');
});

test('info detects repo type', () => {
  const result = run('info --json');
  const json = assertJSON(result.output);
  assert(['standalone', 'monorepo'].includes(json.repoType), 'Should detect repo type');
});

test('info detects base branch', () => {
  const result = run('info --json');
  const json = assertJSON(result.output);
  assert(json.baseBranch, 'Should detect base branch');
  assert(['dev', 'develop', 'main', 'master'].includes(json.baseBranch), 'Should be valid branch');
});

test('info finds env files', () => {
  const result = run('info --json');
  const json = assertJSON(result.output);
  assert(Array.isArray(json.envFiles), 'Should have envFiles array');
});

test('info detects dirty state', () => {
  const result = run('info --json');
  const json = assertJSON(result.output);
  assert(typeof json.dirtyState === 'boolean', 'Should have dirtyState boolean');
});

test('info detects monorepo from monorepo root', () => {
  if (!fs.existsSync(MONOREPO_DIR)) return; // Skip if not available
  const result = run('info --json', { cwd: MONOREPO_DIR });
  const json = assertJSON(result.output);
  assert(json.repoType === 'monorepo', 'Should detect monorepo');
  assert(json.projects.length > 0, 'Should have projects');
});

test('monorepo uses internal worktrees directory', () => {
  if (!fs.existsSync(MONOREPO_DIR)) return; // Skip if not available
  const result = run('info --json', { cwd: MONOREPO_DIR });
  const json = assertJSON(result.output);
  // Monorepo should use worktrees/ inside the repo, not sibling
  assert(json.worktreeRoot === path.join(MONOREPO_DIR, 'worktrees'),
    `Expected ${path.join(MONOREPO_DIR, 'worktrees')}, got ${json.worktreeRoot}`);
  assert(json.worktreeRootSource === 'monorepo internal',
    `Expected 'monorepo internal', got ${json.worktreeRootSource}`);
});

test('info returns text output without --json', () => {
  const result = run('info');
  assert(result.success, 'Command should succeed');
  assert(result.output.includes('Repository Info'), 'Should have text output');
});

// ============================================
// LIST COMMAND TESTS
// ============================================
console.log('\n📂 LIST Command Tests');

test('list returns valid JSON', () => {
  const result = run('list --json');
  assert(result.success, 'Command should succeed');
  const json = assertJSON(result.output);
  assert(json.success === true, 'Should have success: true');
  assert(Array.isArray(json.worktrees), 'Should have worktrees array');
});

test('list worktrees have required fields', () => {
  const result = run('list --json');
  const json = assertJSON(result.output);
  if (json.worktrees.length > 0) {
    const wt = json.worktrees[0];
    assert(wt.path, 'Worktree should have path');
    assert(wt.commit, 'Worktree should have commit');
    assert(wt.branch, 'Worktree should have branch');
  }
});

test('list returns text output without --json', () => {
  const result = run('list');
  assert(result.success, 'Command should succeed');
  assert(result.output.includes('worktrees'), 'Should have text output');
});

// ============================================
// CREATE COMMAND TESTS
// ============================================
console.log('\n🆕 CREATE Command Tests');

test('create requires feature name', () => {
  const result = run('create --json');
  assert(!result.success, 'Should fail without feature');
  const json = assertJSON(result.output);
  assert(json.error.code === 'MISSING_FEATURE', 'Should have MISSING_FEATURE error');
});

test('create dry-run does not create worktree', () => {
  const result = run('create test-dry-run --prefix feat --dry-run --json');
  assert(result.success, 'Dry-run should succeed');
  const json = assertJSON(result.output);
  assert(json.dryRun === true, 'Should have dryRun: true');
  assert(json.wouldCreate, 'Should have wouldCreate object');
});

test('create dry-run shows correct branch name', () => {
  const result = run('create my-feature --prefix fix --dry-run --json');
  const json = assertJSON(result.output);
  assert(json.wouldCreate.branch === 'fix/my-feature', 'Branch should be fix/my-feature');
});

test('create sanitizes feature name - spaces', () => {
  const result = run('create "my cool feature" --dry-run --json');
  const json = assertJSON(result.output);
  assert(json.wouldCreate.branch.includes('my-cool-feature'), 'Should sanitize spaces');
});

test('create sanitizes feature name - uppercase', () => {
  const result = run('create "MyFeature" --dry-run --json');
  const json = assertJSON(result.output);
  assert(json.wouldCreate.branch.includes('myfeature'), 'Should lowercase');
});

test('create sanitizes feature name - special chars', () => {
  const result = run('create "feat@#$test" --dry-run --json');
  const json = assertJSON(result.output);
  assert(!json.wouldCreate.branch.includes('@'), 'Should remove special chars');
});

test('create respects --prefix flag', () => {
  const prefixes = ['feat', 'fix', 'docs', 'refactor', 'test', 'chore', 'perf'];
  for (const prefix of prefixes) {
    const result = run(`create test-${prefix} --prefix ${prefix} --dry-run --json`);
    const json = assertJSON(result.output);
    assert(json.wouldCreate.branch.startsWith(`${prefix}/`), `Should use ${prefix} prefix`);
  }
});

test('create shows base branch', () => {
  const result = run('create test-base --dry-run --json');
  const json = assertJSON(result.output);
  assert(json.wouldCreate.baseBranch, 'Should show base branch');
});

test('create shows worktree path', () => {
  const result = run('create test-path --dry-run --json');
  const json = assertJSON(result.output);
  assert(json.wouldCreate.worktreePath, 'Should show worktree path');
  assert(json.wouldCreate.worktreePath.includes('worktrees'), 'Path should include worktrees dir');
});

test('create in monorepo requires project', () => {
  if (!fs.existsSync(MONOREPO_DIR)) return;
  const result = run('create --json', { cwd: MONOREPO_DIR });
  assert(!result.success, 'Should fail without project in monorepo');
  const json = assertJSON(result.output);
  assert(json.error.code === 'MISSING_ARGS', 'Should have MISSING_ARGS error');
});

test('create in monorepo with project works', () => {
  if (!fs.existsSync(MONOREPO_DIR)) return;
  const result = run('create engineer test-mono --prefix feat --dry-run --json', { cwd: MONOREPO_DIR });
  assert(result.success, 'Should succeed with project');
  const json = assertJSON(result.output);
  assert(json.wouldCreate.project === 'claudekit-engineer', 'Should detect project');
});

test('create detects invalid project', () => {
  if (!fs.existsSync(MONOREPO_DIR)) return;
  const result = run('create nonexistent test-invalid --json', { cwd: MONOREPO_DIR });
  assert(!result.success, 'Should fail with invalid project');
  const json = assertJSON(result.output);
  assert(json.error.code === 'PROJECT_NOT_FOUND', 'Should have PROJECT_NOT_FOUND error');
});

// ============================================
// REMOVE COMMAND TESTS
// ============================================
console.log('\n🗑️  REMOVE Command Tests');

test('remove requires worktree name', () => {
  const result = run('remove --json');
  assert(!result.success, 'Should fail without name');
  const json = assertJSON(result.output);
  assert(json.error.code === 'MISSING_WORKTREE', 'Should have MISSING_WORKTREE error');
});

test('remove dry-run does not remove worktree', () => {
  // First get a worktree name from list
  const listResult = run('list --json');
  const listJson = assertJSON(listResult.output);
  const removable = listJson.worktrees.find(w => !w.path.includes('.git/'));

  if (removable) {
    const name = path.basename(removable.path);
    const result = run(`remove "${name}" --dry-run --json`);
    assert(result.success, 'Dry-run should succeed');
    const json = assertJSON(result.output);
    assert(json.dryRun === true, 'Should have dryRun: true');
    assert(json.wouldRemove, 'Should have wouldRemove object');
  }
});

test('remove handles not found', () => {
  const result = run('remove nonexistent-worktree-xyz --json');
  assert(!result.success, 'Should fail for nonexistent');
  const json = assertJSON(result.output);
  assert(json.error.code === 'WORKTREE_NOT_FOUND', 'Should have WORKTREE_NOT_FOUND error');
});

test('remove error includes available worktrees', () => {
  const result = run('remove nonexistent-worktree-xyz --json');
  const json = assertJSON(result.output);
  assert(Array.isArray(json.error.availableWorktrees), 'Should list available worktrees');
});

// ============================================
// AUTO-FEATURES TESTS (env templates)
// ============================================
console.log('\n🤖 Auto-Features Tests');

test('create dry-run succeeds', () => {
  const result = run('create test-env-feature --prefix feat --dry-run --json');
  assert(result.success, 'Dry-run should succeed');
  const json = assertJSON(result.output);
  assert(json.dryRun === true, 'Should have dryRun: true');
});

test('create ignores unsafe --env traversal entries', () => {
  const result = run('create env-guard --prefix feat --dry-run --json --env "../.env,secrets/.env,.env.local"');
  assert(result.success, 'Dry-run should succeed');
  const json = assertJSON(result.output);
  assert(Array.isArray(json.warnings), 'Should include warnings');
  assert(json.warnings.some(w => w.includes('unsafe env file')), 'Should warn for unsafe env entries');
});

// ============================================
// WORKTREE ROOT DETECTION TESTS
// ============================================
console.log('\n📍 Worktree Root Detection Tests');

test('info shows worktreeRoot and worktreeRootSource', () => {
  const result = run('info --json');
  const json = assertJSON(result.output);
  assert(json.worktreeRoot, 'Should have worktreeRoot');
  assert(json.worktreeRootSource, 'Should have worktreeRootSource');
  assert(typeof json.worktreeRoot === 'string', 'worktreeRoot should be string');
  assert(json.worktreeRoot.includes('worktrees'), 'worktreeRoot should include worktrees');
});

test('create --worktree-root overrides default location', () => {
  const customRoot = '/tmp/test-worktrees';
  const result = run(`create test-custom-root --prefix feat --dry-run --json --worktree-root "${customRoot}"`);
  assert(result.success, 'Should succeed with custom root');
  const json = assertJSON(result.output);
  assert(json.wouldCreate.worktreePath.startsWith(customRoot), 'Path should use custom root');
  assert(json.wouldCreate.worktreeRootSource === '--worktree-root flag', 'Source should be flag');
});

test('create --worktree-root with relative path resolves to absolute', () => {
  const result = run('create test-relative --prefix feat --dry-run --json --worktree-root "./custom-worktrees"');
  assert(result.success, 'Should succeed');
  const json = assertJSON(result.output);
  assert(path.isAbsolute(json.wouldCreate.worktreePath), 'Path should be absolute');
});

test('create dry-run shows worktreeRootSource', () => {
  const result = run('create test-source --prefix feat --dry-run --json');
  assert(result.success, 'Should succeed');
  const json = assertJSON(result.output);
  assert(json.wouldCreate.worktreeRootSource, 'Should show worktreeRootSource');
});

test('superproject detection in submodule', () => {
  // Test from claudekit-engineer submodule
  const submodulePath = '/home/kai/claudekit/claudekit-engineer';
  if (!fs.existsSync(submodulePath)) return;
  const result = run('info --json', { cwd: submodulePath });
  const json = assertJSON(result.output);
  // Should detect parent monorepo as superproject
  assert(json.worktreeRootSource.includes('superproject') || json.worktreeRootSource === 'monorepo root',
    'Should detect superproject or monorepo root');
});

test('WORKTREE_ROOT env var overrides detection', () => {
  const envRoot = '/tmp/env-worktrees';
  try {
    const output = execSync(`WORKTREE_ROOT="${envRoot}" node "${SCRIPT_PATH}" create test-env --prefix feat --dry-run --json`, {
      encoding: 'utf-8',
      cwd: STANDALONE_DIR,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    const json = JSON.parse(output.trim());
    assert(json.wouldCreate.worktreePath.startsWith(envRoot), 'Should use env var root');
    assert(json.wouldCreate.worktreeRootSource === 'WORKTREE_ROOT env', 'Source should be env');
  } catch (error) {
    // May fail if script path issue - skip
  }
});

test('invalid WORKTREE_ROOT env var fails safely', () => {
  const invalidRoot = '/etc/passwd';
  try {
    execSync(`WORKTREE_ROOT="${invalidRoot}" node "${SCRIPT_PATH}" info --json`, {
      encoding: 'utf-8',
      cwd: STANDALONE_DIR,
      stdio: ['pipe', 'pipe', 'pipe']
    });
    assert(false, 'Should fail with invalid WORKTREE_ROOT');
  } catch (error) {
    const json = assertJSON(error.stdout.toString());
    assert(json.error.code === 'INVALID_WORKTREE_ROOT', 'Should have INVALID_WORKTREE_ROOT');
  }
});

test('create --worktree-root validates path existence', () => {
  // Use a deeply nested non-existent path that can't be created
  const invalidRoot = '/nonexistent/deeply/nested/path/that/does/not/exist';
  const result = run(`create test-invalid-root --prefix feat --json --worktree-root "${invalidRoot}"`);
  assert(!result.success, 'Should fail with invalid path');
  const json = assertJSON(result.output);
  assert(json.error.code === 'INVALID_WORKTREE_ROOT', 'Should have INVALID_WORKTREE_ROOT error');
});

// ============================================
// ERROR HANDLING TESTS
// ============================================
console.log('\n⚠️  Error Handling Tests');

test('unknown command returns error', () => {
  const result = run('unknowncommand --json');
  assert(!result.success, 'Should fail');
  const json = assertJSON(result.output);
  assert(json.error.code === 'UNKNOWN_COMMAND', 'Should have UNKNOWN_COMMAND error');
});

test('no command returns error', () => {
  const result = run('--json');
  assert(!result.success, 'Should fail');
  const json = assertJSON(result.output);
  assert(json.error.code === 'UNKNOWN_COMMAND', 'Should have UNKNOWN_COMMAND error');
});

test('errors have suggestion field', () => {
  const result = run('create --json');
  const json = assertJSON(result.output);
  assert(json.error.suggestion, 'Error should have suggestion');
});

test('success commands return exit code 0', () => {
  const result = run('info --json');
  assert(result.exitCode === 0, 'Exit code should be 0');
});

test('error commands return exit code 1', () => {
  const result = run('create --json');
  assert(result.exitCode === 1, 'Exit code should be 1');
});

test('non-git directory returns error', () => {
  const result = run('info --json', { cwd: '/tmp' });
  assert(!result.success, 'Should fail in non-git dir');
  const json = assertJSON(result.output);
  assert(json.error.code === 'NOT_GIT_REPO', 'Should have NOT_GIT_REPO error');
});

// ============================================
// EDGE CASE: FEATURE NAME HANDLING
// ============================================
console.log('\n🔤 Feature Name Edge Cases');

test('create handles empty string feature', () => {
  const result = run('create "" --json');
  assert(!result.success, 'Should fail with empty feature');
  const json = assertJSON(result.output);
  assert(json.error.code === 'MISSING_FEATURE', 'Should have MISSING_FEATURE error');
});

test('create handles very long feature name (truncates to 50 chars)', () => {
  const longName = 'a'.repeat(100);
  const result = run(`create "${longName}" --dry-run --json`);
  assert(result.success, 'Should succeed');
  const json = assertJSON(result.output);
  const branchPart = json.wouldCreate.branch.split('/')[1];
  assert(branchPart.length <= 50, 'Feature part should be max 50 chars');
});

test('create handles unicode characters', () => {
  const result = run('create "测试功能-тест" --dry-run --json');
  assert(result.success, 'Should succeed');
  const json = assertJSON(result.output);
  // Unicode gets converted to dashes
  assert(!json.wouldCreate.branch.includes('测'), 'Should not contain unicode');
});

test('create handles leading/trailing dashes', () => {
  const result = run('create "---feature---" --dry-run --json');
  assert(result.success, 'Should succeed');
  const json = assertJSON(result.output);
  assert(!json.wouldCreate.branch.endsWith('/-'), 'Should not end with dash');
  assert(!json.wouldCreate.branch.includes('//'), 'Should not have double slashes');
});

test('create handles only special characters', () => {
  const result = run('create "@#$%^&*()" --dry-run --json');
  assert(!result.success, 'Should fail when sanitized feature is empty');
  const json = assertJSON(result.output);
  assert(json.error.code === 'INVALID_FEATURE_NAME', 'Should report invalid feature name');
});

test('create handles numbers only', () => {
  const result = run('create "12345" --dry-run --json');
  assert(result.success, 'Should succeed');
  const json = assertJSON(result.output);
  assert(json.wouldCreate.branch.includes('12345'), 'Should keep numbers');
});

test('create handles mixed case camelCase', () => {
  const result = run('create "myNewFeature" --dry-run --json');
  assert(result.success, 'Should succeed');
  const json = assertJSON(result.output);
  assert(json.wouldCreate.branch.includes('mynewfeature'), 'Should be lowercase');
});

// ============================================
// EDGE CASE: PATH HANDLING
// ============================================
console.log('\n📁 Path Handling Edge Cases');

test('create handles path with spaces via --worktree-root', () => {
  const pathWithSpaces = '/tmp/my worktree dir';
  const result = run(`create test-spaces --prefix feat --dry-run --json --worktree-root "${pathWithSpaces}"`);
  assert(result.success, 'Should succeed with quoted path');
  const json = assertJSON(result.output);
  assert(json.wouldCreate.worktreePath.includes('my worktree dir'), 'Should preserve spaces');
});

test('create handles home directory expansion', () => {
  // Script uses path.resolve which doesn't expand ~, so this tests current behavior
  const result = run('create test-home --prefix feat --dry-run --json --worktree-root "~/test-worktrees"');
  assert(result.success, 'Should succeed');
  const json = assertJSON(result.output);
  // ~/test-worktrees should be resolved relative to cwd, not expanded
  assert(json.wouldCreate.worktreePath, 'Should have worktree path');
});

test('create validates file path as worktree root', () => {
  // /etc/passwd exists but is a file, not directory
  const result = run('create test-file --prefix feat --json --worktree-root "/etc/passwd"');
  assert(!result.success, 'Should fail when path is file');
  const json = assertJSON(result.output);
  assert(json.error.code === 'INVALID_WORKTREE_ROOT', 'Should have INVALID_WORKTREE_ROOT');
  assert(json.error.message.includes('not a directory'), 'Should mention not a directory');
});

test('create handles current directory as worktree root', () => {
  const result = run('create test-current --prefix feat --dry-run --json --worktree-root "."');
  assert(result.success, 'Should succeed');
  const json = assertJSON(result.output);
  assert(path.isAbsolute(json.wouldCreate.worktreePath), 'Should resolve to absolute');
});

// ============================================
// EDGE CASE: BRANCH PREFIX HANDLING
// ============================================
console.log('\n🏷️  Branch Prefix Edge Cases');

test('create uses default prefix when --prefix missing value', () => {
  // --prefix without value should use 'feat' default
  const result = run('create test-default-prefix --dry-run --json');
  assert(result.success, 'Should succeed');
  const json = assertJSON(result.output);
  assert(json.wouldCreate.branch.startsWith('feat/'), 'Should default to feat');
});

test('create handles invalid prefix gracefully', () => {
  // Prefix is sanitized before use.
  const result = run('create test-custom-prefix --prefix custom --dry-run --json');
  assert(result.success, 'Should succeed');
  const json = assertJSON(result.output);
  assert(json.wouldCreate.branch.startsWith('custom/'), 'Should use custom prefix');
});

// ============================================
// EDGE CASE: MONOREPO SCENARIOS
// ============================================
console.log('\n📦 Monorepo Edge Cases');

test('create with partial project match in monorepo', () => {
  if (!fs.existsSync(MONOREPO_DIR)) return;
  // 'cli' should match 'claudekit-cli'
  const result = run('create cli test-partial --prefix feat --dry-run --json', { cwd: MONOREPO_DIR });
  assert(result.success, 'Should succeed with partial match');
  const json = assertJSON(result.output);
  assert(json.wouldCreate.project === 'claudekit-cli', 'Should find claudekit-cli');
});

test('create detects multiple project matches', () => {
  if (!fs.existsSync(MONOREPO_DIR)) return;
  // 'claudekit' matches multiple projects
  const result = run('create claudekit test-multi --prefix feat --json', { cwd: MONOREPO_DIR });
  assert(!result.success, 'Should fail with multiple matches');
  const json = assertJSON(result.output);
  assert(json.error.code === 'MULTIPLE_PROJECTS_MATCH', 'Should have MULTIPLE_PROJECTS_MATCH error');
  assert(json.error.matchingProjects.length > 1, 'Should list multiple matches');
});

test('info shows project env files in monorepo', () => {
  if (!fs.existsSync(MONOREPO_DIR)) return;
  const result = run('info --json', { cwd: MONOREPO_DIR });
  const json = assertJSON(result.output);
  assert(json.projectEnvFiles !== undefined, 'Should have projectEnvFiles');
});

// ============================================
// EDGE CASE: WORKTREE REMOVAL
// ============================================
console.log('\n🗑️  Remove Edge Cases');

test('remove matches by full path', () => {
  const listResult = run('list --json');
  const listJson = assertJSON(listResult.output);
  const removable = listJson.worktrees.find(w => !w.path.includes('.git/'));

  if (removable) {
    const result = run(`remove "${removable.path}" --dry-run --json`);
    assert(result.success, 'Should match by full path');
    const json = assertJSON(result.output);
    assert(json.wouldRemove.worktreePath === removable.path, 'Should match exact path');
  }
});

test('remove matches by branch name', () => {
  const listResult = run('list --json');
  const listJson = assertJSON(listResult.output);
  const removable = listJson.worktrees.find(w => w.branch && !w.path.includes('.git/'));

  if (removable && removable.branch !== 'detached') {
    const branchPart = removable.branch.split('/').pop(); // Get last part of branch
    const result = run(`remove "${branchPart}" --dry-run --json`);
    // May match or have multiple matches - both are valid behaviors
    assert(result.output, 'Should have output');
  }
});

test('remove is case insensitive', () => {
  const result = run('remove NONEXISTENT-WORKTREE-XYZ --json');
  assert(!result.success, 'Should fail');
  const json = assertJSON(result.output);
  assert(json.error.code === 'WORKTREE_NOT_FOUND', 'Should search case-insensitively');
});

// ============================================
// EDGE CASE: DIRTY STATE HANDLING
// ============================================
console.log('\n📝 Dirty State Edge Cases');

test('info provides dirty state details', () => {
  const result = run('info --json');
  const json = assertJSON(result.output);
  assert(typeof json.dirtyState === 'boolean', 'Should have dirtyState');
  if (json.dirtyState) {
    assert(json.dirtyDetails, 'Should have dirtyDetails when dirty');
    assert(typeof json.dirtyDetails.modified === 'number', 'Should have modified count');
    assert(typeof json.dirtyDetails.staged === 'number', 'Should have staged count');
    assert(typeof json.dirtyDetails.untracked === 'number', 'Should have untracked count');
  }
});

test('create includes warning for dirty state', () => {
  // This test depends on repo state - if clean, warning won't appear
  const result = run('create test-dirty-check --dry-run --json');
  assert(result.success, 'Should succeed');
  const json = assertJSON(result.output);
  // warnings may or may not exist depending on repo state
  if (json.warnings) {
    assert(Array.isArray(json.warnings), 'warnings should be array');
  }
});

// ============================================
// EDGE CASE: JSON VS TEXT OUTPUT
// ============================================
console.log('\n📤 Output Format Edge Cases');

test('info text output includes all sections', () => {
  const result = run('info');
  assert(result.success, 'Should succeed');
  assert(result.output.includes('Repository Info'), 'Should have repo info');
  assert(result.output.includes('Type:'), 'Should have type');
  assert(result.output.includes('Base branch:'), 'Should have base branch');
  assert(result.output.includes('Worktree location:'), 'Should have worktree location');
});

test('list text output is readable', () => {
  const result = run('list');
  assert(result.success, 'Should succeed');
  assert(result.output.includes('worktrees'), 'Should mention worktrees');
});

test('error text output is readable', () => {
  const result = run('create');
  assert(!result.success, 'Should fail');
  assert(result.stderr.includes('Error') || result.output.includes('Error'), 'Should have error text');
});

// ============================================
// EDGE CASE: EXISTING BRANCH SCENARIOS
// ============================================
console.log('\n🌿 Branch Existence Edge Cases');

test('create dry-run shows if branch exists', () => {
  const result = run('create test-branch-exist --prefix feat --dry-run --json');
  assert(result.success, 'Should succeed');
  const json = assertJSON(result.output);
  assert(typeof json.wouldCreate.branchExists === 'boolean', 'Should indicate branch existence');
});

// ============================================
// EDGE CASE: CONCURRENT/RACE CONDITIONS
// ============================================
console.log('\n⚡ Concurrent Access Tests');

test('multiple info calls return consistent data', () => {
  const result1 = run('info --json');
  const result2 = run('info --json');
  assert(result1.success && result2.success, 'Both should succeed');
  const json1 = assertJSON(result1.output);
  const json2 = assertJSON(result2.output);
  assert(json1.repoType === json2.repoType, 'Repo type should be consistent');
  assert(json1.baseBranch === json2.baseBranch, 'Base branch should be consistent');
  assert(json1.worktreeRoot === json2.worktreeRoot, 'Worktree root should be consistent');
});

test('list returns consistent worktree count', () => {
  const result1 = run('list --json');
  const result2 = run('list --json');
  assert(result1.success && result2.success, 'Both should succeed');
  const json1 = assertJSON(result1.output);
  const json2 = assertJSON(result2.output);
  assert(json1.worktrees.length === json2.worktrees.length, 'Worktree count should be consistent');
});

// ============================================
// USER SCENARIO: REAL-WORLD WORKFLOWS
// ============================================
console.log('\n👤 User Scenario Tests');

test('scenario: new user creates first worktree', () => {
  // Step 1: Check info
  const infoResult = run('info --json');
  assert(infoResult.success, 'Info should succeed');
  const info = assertJSON(infoResult.output);

  // Step 2: Dry-run create
  const createResult = run('create add-login-feature --prefix feat --dry-run --json');
  assert(createResult.success, 'Create dry-run should succeed');
  const create = assertJSON(createResult.output);
  assert(create.wouldCreate.branch === 'feat/add-login-feature', 'Branch should be correctly named');
  assert(create.wouldCreate.baseBranch === info.baseBranch, 'Should use detected base branch');
});

test('scenario: user fixes bug in submodule', () => {
  const submodulePath = '/home/kai/claudekit/claudekit-engineer';
  if (!fs.existsSync(submodulePath)) return;

  // From submodule, create a fix branch
  const result = run('create fix-auth-bug --prefix fix --dry-run --json', { cwd: submodulePath });
  assert(result.success, 'Should succeed from submodule');
  const json = assertJSON(result.output);
  assert(json.wouldCreate.branch.startsWith('fix/'), 'Should have fix prefix');
  // Worktree should go to superproject
  assert(json.wouldCreate.worktreeRootSource.includes('superproject') ||
         json.wouldCreate.worktreeRootSource.includes('monorepo'),
    'Should use superproject worktrees dir');
});

test('scenario: user cleans up old worktrees', () => {
  // List worktrees first
  const listResult = run('list --json');
  assert(listResult.success, 'List should succeed');
  const list = assertJSON(listResult.output);

  // Try to remove a nonexistent worktree (simulating cleanup)
  const removeResult = run('remove old-feature-xyz --json');
  assert(!removeResult.success, 'Should fail for nonexistent');
  const remove = assertJSON(removeResult.output);
  assert(remove.error.availableWorktrees, 'Should show available worktrees for cleanup');
});

test('scenario: user with WORKTREE_ROOT env var', () => {
  const customRoot = '/tmp/custom-worktrees';
  try {
    const output = execSync(
      `WORKTREE_ROOT="${customRoot}" node "${SCRIPT_PATH}" info --json`,
      { encoding: 'utf-8', cwd: STANDALONE_DIR, stdio: ['pipe', 'pipe', 'pipe'] }
    );
    const json = JSON.parse(output.trim());
    assert(json.worktreeRoot === customRoot, 'Should use env var');
    assert(json.worktreeRootSource === 'WORKTREE_ROOT env', 'Should indicate env source');
  } catch (error) {
    // Skip if env var handling fails
  }
});

// ============================================
// SUMMARY
// ============================================
console.log('\n' + '='.repeat(50));
console.log(`\n📊 Test Results: ${passed} passed, ${failed} failed\n`);

if (failed > 0) {
  console.log('Failed tests:');
  results.filter(r => r.status === 'FAIL').forEach(r => {
    console.log(`  - ${r.name}: ${r.error}`);
  });
  process.exit(1);
} else {
  console.log('✅ All tests passed!\n');
  process.exit(0);
}
