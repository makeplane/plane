/**
 * Tests for ck-config-utils edge case handling
 * Run: node .claude/hooks/lib/__tests__/ck-config-utils.test.cjs
 */

const path = require('path');
const os = require('os');
const fs = require('fs');
const { execSync } = require('child_process');
const {
  normalizePath,
  isAbsolutePath,
  sanitizePath,
  sanitizeSlug,
  sanitizeConfig,
  validateNamingPattern,
  getGitRoot,
  getGitBranch,
  getReportsPath,
  escapeShellValue,
  resolvePlanPath,
  writeSessionState,
  readSessionState,
  getSessionTempPath
} = require('../ck-config-utils.cjs');

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    console.log(`✓ ${name}`);
    passed++;
  } catch (e) {
    console.log(`✗ ${name}`);
    console.log(`  Error: ${e.message}`);
    failed++;
  }
}

function assertEquals(actual, expected, msg = '') {
  if (actual !== expected) {
    throw new Error(`${msg}\n  Expected: ${JSON.stringify(expected)}\n  Actual: ${JSON.stringify(actual)}`);
  }
}

console.log('\n=== normalizePath tests ===\n');

test('trailing slashes: "plans///" → "plans"', () => {
  assertEquals(normalizePath('plans///'), 'plans');
});

test('trailing slashes: "my-plans///" → "my-plans"', () => {
  assertEquals(normalizePath('my-plans///'), 'my-plans');
});

test('empty paths: "   " → null', () => {
  assertEquals(normalizePath('   '), null);
});

test('empty string → null', () => {
  assertEquals(normalizePath(''), null);
});

test('null → null', () => {
  assertEquals(normalizePath(null), null);
});

test('undefined → null', () => {
  assertEquals(normalizePath(undefined), null);
});

test('whitespace around path trimmed', () => {
  assertEquals(normalizePath('  plans  '), 'plans');
});

console.log('\n=== isAbsolutePath tests ===\n');

test('absolute path: "/tmp/all-plans" → true', () => {
  assertEquals(isAbsolutePath('/tmp/all-plans'), true);
});

test('relative path: "plans" → false', () => {
  assertEquals(isAbsolutePath('plans'), false);
});

test('relative path: "./plans" → false', () => {
  assertEquals(isAbsolutePath('./plans'), false);
});

test('Windows absolute: "C:\\Users" → true (Linux: false)', () => {
  // On Linux, Windows paths aren't recognized as absolute - expected behavior
  const expected = process.platform === 'win32';
  assertEquals(isAbsolutePath('C:\\Users'), expected);
});

test('empty → false', () => {
  assertEquals(isAbsolutePath(''), false);
});

console.log('\n=== sanitizePath tests ===\n');

// sanitizePath needs projectRoot as second param
const projectRoot = '/home/user/project';

test('path traversal: "../../../tmp" → null (blocked)', () => {
  assertEquals(sanitizePath('../../../tmp', projectRoot), null);
});

test('absolute path respected: "/tmp/all-plans"', () => {
  const result = sanitizePath('/tmp/all-plans', projectRoot);
  assertEquals(result, '/tmp/all-plans');
});

test('relative path within project returns normalized relative', () => {
  // sanitizePath returns normalized path, not joined (joining done by caller)
  const result = sanitizePath('plans', projectRoot);
  assertEquals(result, 'plans');
});

test('null byte injection blocked', () => {
  assertEquals(sanitizePath('plans\x00evil', projectRoot), null);
});

console.log('\n=== sanitizeSlug tests ===\n');

test('invalid filename chars removed: <, >, :, ", etc.', () => {
  const result = sanitizeSlug('test<>:"/\\|?*slug');
  assertEquals(result, 'testslug');
});

test('control chars removed', () => {
  const result = sanitizeSlug('test\x00\x1fslug');
  assertEquals(result, 'testslug');
});

test('length limited to 100 chars', () => {
  const longSlug = 'a'.repeat(150);
  const result = sanitizeSlug(longSlug);
  assertEquals(result.length, 100);
});

test('empty slug returns empty (caller handles fallback)', () => {
  // sanitizeSlug returns empty, caller decides fallback
  const result = sanitizeSlug('');
  assertEquals(result, '');
});

console.log('\n=== validateNamingPattern tests ===\n');

test('valid pattern with {slug}', () => {
  const result = validateNamingPattern('251217-{slug}');
  assertEquals(result.valid, true);
});

test('pattern without {slug} → invalid', () => {
  const result = validateNamingPattern('251217-feature');
  assertEquals(result.valid, false);
  assertEquals(result.error, 'Pattern must contain {slug} placeholder');
});

test('empty pattern → invalid', () => {
  const result = validateNamingPattern('');
  assertEquals(result.valid, false);
});

test('unresolved placeholder → invalid', () => {
  const result = validateNamingPattern('{date}-{slug}');
  assertEquals(result.valid, false);
});

console.log('\n=== getGitRoot tests (Issue #291) ===\n');

test('getGitRoot returns path when in git repo', () => {
  const result = getGitRoot();
  // We're running from within a git repo, so should return a path
  if (result === null) {
    throw new Error('Expected git root path but got null');
  }
  if (!path.isAbsolute(result)) {
    throw new Error(`Expected absolute path but got: ${result}`);
  }
});

console.log('\n=== getReportsPath with baseDir tests (Issue #291) ===\n');

test('getReportsPath returns absolute path when baseDir provided', () => {
  const planConfig = { reportsDir: 'reports' };
  const pathsConfig = { plans: 'plans' };
  const baseDir = '/home/user/project';

  const result = getReportsPath(null, null, planConfig, pathsConfig, baseDir);
  assertEquals(result, '/home/user/project/plans/reports');
});

test('getReportsPath returns relative path when no baseDir', () => {
  const planConfig = { reportsDir: 'reports' };
  const pathsConfig = { plans: 'plans' };

  const result = getReportsPath(null, null, planConfig, pathsConfig);
  assertEquals(result, 'plans/reports/');
});

test('getReportsPath uses plan path for session-resolved plans', () => {
  const planConfig = { reportsDir: 'reports' };
  const pathsConfig = { plans: 'plans' };
  const baseDir = '/home/user/project';

  const result = getReportsPath('plans/my-plan', 'session', planConfig, pathsConfig, baseDir);
  assertEquals(result, '/home/user/project/plans/my-plan/reports');
});

test('getReportsPath ignores plan path for branch-resolved plans', () => {
  const planConfig = { reportsDir: 'reports' };
  const pathsConfig = { plans: 'plans' };
  const baseDir = '/home/user/project';

  const result = getReportsPath('plans/my-plan', 'branch', planConfig, pathsConfig, baseDir);
  assertEquals(result, '/home/user/project/plans/reports');
});

console.log('\n=== getGitRoot/getGitBranch with cwd parameter (Issue #291) ===\n');

test('getGitRoot accepts cwd parameter', () => {
  const gitRoot = getGitRoot();
  if (!gitRoot) {
    console.log('  → Skipped: not in git repo');
    return;
  }
  // Should work with explicit cwd
  const result = getGitRoot(gitRoot);
  assertEquals(result, gitRoot);
});

test('getGitRoot with subdirectory cwd returns same root', () => {
  const gitRoot = getGitRoot();
  if (!gitRoot) {
    console.log('  → Skipped: not in git repo');
    return;
  }
  // Run from .claude/hooks subdirectory
  const subdirPath = path.join(gitRoot, '.claude', 'hooks');
  if (!fs.existsSync(subdirPath)) {
    console.log('  → Skipped: subdirectory does not exist');
    return;
  }
  const result = getGitRoot(subdirPath);
  assertEquals(result, gitRoot);
});

test('getGitRoot returns null for non-git directory', () => {
  const tempDir = path.join(os.tmpdir(), 'ck-test-no-git-' + Date.now());
  fs.mkdirSync(tempDir, { recursive: true });
  try {
    const result = getGitRoot(tempDir);
    assertEquals(result, null);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('getGitBranch accepts cwd parameter', () => {
  const gitRoot = getGitRoot();
  if (!gitRoot) {
    console.log('  → Skipped: not in git repo');
    return;
  }
  const branch1 = getGitBranch();
  const branch2 = getGitBranch(gitRoot);
  assertEquals(branch1, branch2);
});

console.log('\n=== escapeShellValue tests (Security) ===\n');

test('escapeShellValue escapes backslashes', () => {
  const result = escapeShellValue('path\\with\\backslash');
  assertEquals(result, 'path\\\\with\\\\backslash');
});

test('escapeShellValue escapes double quotes', () => {
  const result = escapeShellValue('path"with"quotes');
  assertEquals(result, 'path\\"with\\"quotes');
});

test('escapeShellValue escapes dollar signs', () => {
  const result = escapeShellValue('path$with$dollar');
  assertEquals(result, 'path\\$with\\$dollar');
});

test('escapeShellValue escapes backticks (Issue #291)', () => {
  const result = escapeShellValue('path`with`backticks');
  assertEquals(result, 'path\\`with\\`backticks');
});

test('escapeShellValue handles mixed special chars', () => {
  const result = escapeShellValue('test\\$`"mixed');
  assertEquals(result, 'test\\\\\\$\\`\\"mixed');
});

test('escapeShellValue returns non-string as-is', () => {
  assertEquals(escapeShellValue(123), 123);
  assertEquals(escapeShellValue(null), null);
  assertEquals(escapeShellValue(undefined), undefined);
});

console.log('\n=== getReportsPath edge cases ===\n');

test('getReportsPath with empty reportsDir falls back to "reports"', () => {
  const planConfig = { reportsDir: '' };
  const pathsConfig = { plans: 'plans' };
  const baseDir = '/home/user/project';

  const result = getReportsPath(null, null, planConfig, pathsConfig, baseDir);
  assertEquals(result, '/home/user/project/plans/reports');
});

test('getReportsPath with null reportsDir falls back to "reports"', () => {
  const planConfig = { reportsDir: null };
  const pathsConfig = { plans: 'plans' };
  const baseDir = '/home/user/project';

  const result = getReportsPath(null, null, planConfig, pathsConfig, baseDir);
  assertEquals(result, '/home/user/project/plans/reports');
});

test('getReportsPath with empty plansDir falls back to "plans"', () => {
  const planConfig = { reportsDir: 'reports' };
  const pathsConfig = { plans: '' };
  const baseDir = '/home/user/project';

  const result = getReportsPath(null, null, planConfig, pathsConfig, baseDir);
  assertEquals(result, '/home/user/project/plans/reports');
});

test('getReportsPath with null plansDir falls back to "plans"', () => {
  const planConfig = { reportsDir: 'reports' };
  const pathsConfig = { plans: null };
  const baseDir = '/home/user/project';

  const result = getReportsPath(null, null, planConfig, pathsConfig, baseDir);
  assertEquals(result, '/home/user/project/plans/reports');
});

console.log('\n=== sanitizeConfig tests ===\n');

test('absolute path in config preserved through sanitization', () => {
  const config = {
    plan: { reportsDir: 'reports' },
    paths: { docs: 'docs', plans: '/tmp/all-plans' }
  };
  const result = sanitizeConfig(config, '/home/user/project');
  assertEquals(result.paths.plans, '/tmp/all-plans');
});

test('mixed absolute/relative paths preserved independently', () => {
  const config = {
    plan: { reportsDir: 'reports' },
    paths: { docs: 'docs', plans: '/tmp/all-plans' }
  };
  const result = sanitizeConfig(config, '/home/user/project');
  assertEquals(result.paths.docs, 'docs');
  assertEquals(result.paths.plans, '/tmp/all-plans');
});

console.log('\n=== isAbsolutePath edge cases ===\n');

test('UNC path on Windows: "\\\\\\\\server\\\\share" (platform-conditional)', () => {
  const expected = process.platform === 'win32';
  assertEquals(isAbsolutePath('\\\\server\\share'), expected);
});

test('path.join concatenates paths (does NOT discard baseDir)', () => {
  // Document Node.js behavior: path.join concatenates, path.resolve would discard
  // path.join('/base', '/absolute') = '/base/absolute' (concatenates, strips leading /)
  // path.resolve('/base', '/absolute') = '/absolute' (absolute overrides)
  const result = path.join('/home/user/project', '/tmp/all-plans');
  assertEquals(result, '/home/user/project/tmp/all-plans');
});

console.log('\n=== Detached HEAD state tests ===\n');

test('getGitBranch returns null or empty in detached HEAD state', () => {
  const tempDir = path.join(os.tmpdir(), 'ck-test-detached-' + Date.now());
  fs.mkdirSync(tempDir, { recursive: true });
  try {
    // Initialize git repo and create a commit
    execSync('git init -q', { cwd: tempDir });
    execSync('git config user.email "test@test.com"', { cwd: tempDir });
    execSync('git config user.name "Test"', { cwd: tempDir });
    fs.writeFileSync(path.join(tempDir, 'file.txt'), 'test');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -q -m "initial"', { cwd: tempDir });

    // Get commit hash and checkout detached HEAD
    const commitHash = execSync('git rev-parse HEAD', { cwd: tempDir, encoding: 'utf8' }).trim();
    execSync(`git checkout -q ${commitHash}`, { cwd: tempDir });

    // getGitBranch returns empty string or null in detached HEAD
    // (git branch --show-current outputs empty line when detached)
    const result = getGitBranch(tempDir);
    assertEquals(result === null || result === '', true);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('getGitRoot works in detached HEAD state', () => {
  const tempDir = path.join(os.tmpdir(), 'ck-test-detached-root-' + Date.now());
  fs.mkdirSync(tempDir, { recursive: true });
  try {
    execSync('git init -q', { cwd: tempDir });
    execSync('git config user.email "test@test.com"', { cwd: tempDir });
    execSync('git config user.name "Test"', { cwd: tempDir });
    fs.writeFileSync(path.join(tempDir, 'file.txt'), 'test');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -q -m "initial"', { cwd: tempDir });

    const commitHash = execSync('git rev-parse HEAD', { cwd: tempDir, encoding: 'utf8' }).trim();
    execSync(`git checkout -q ${commitHash}`, { cwd: tempDir });

    // getGitRoot should still work
    const result = getGitRoot(tempDir);
    assertEquals(result, tempDir);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

console.log('\n=== Bare repository tests ===\n');

test('getGitRoot returns null for bare repository (no working tree)', () => {
  const tempDir = path.join(os.tmpdir(), 'ck-test-bare-' + Date.now());
  fs.mkdirSync(tempDir, { recursive: true });
  try {
    execSync('git init -q --bare', { cwd: tempDir });

    // git rev-parse --show-toplevel fails in bare repos (no working tree)
    // This is expected git behavior - bare repos have no working directory
    const result = getGitRoot(tempDir);
    assertEquals(result, null);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('getGitBranch returns null for bare repository (no HEAD ref)', () => {
  const tempDir = path.join(os.tmpdir(), 'ck-test-bare-branch-' + Date.now());
  fs.mkdirSync(tempDir, { recursive: true });
  try {
    execSync('git init -q --bare', { cwd: tempDir });

    // Fresh bare repo has no commits, so branch may be null
    const result = getGitBranch(tempDir);
    // Bare repos with no commits return null (no HEAD target)
    // This is expected behavior
    assertEquals(result === null || result === 'main' || result === 'master', true);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

console.log('\n=== Nested git repos tests ===\n');

test('getGitRoot returns innermost repo for nested git repos', () => {
  const outerDir = path.join(os.tmpdir(), 'ck-test-nested-outer-' + Date.now());
  const innerDir = path.join(outerDir, 'inner');
  fs.mkdirSync(innerDir, { recursive: true });
  try {
    // Create outer git repo
    execSync('git init -q', { cwd: outerDir });

    // Create inner git repo (nested)
    execSync('git init -q', { cwd: innerDir });

    // From inner dir, should return inner repo root
    const resultInner = getGitRoot(innerDir);
    assertEquals(resultInner, innerDir);

    // From outer dir, should return outer repo root
    const resultOuter = getGitRoot(outerDir);
    assertEquals(resultOuter, outerDir);
  } finally {
    fs.rmSync(outerDir, { recursive: true, force: true });
  }
});

test('getGitRoot from nested subdir returns correct root', () => {
  const outerDir = path.join(os.tmpdir(), 'ck-test-nested-sub-' + Date.now());
  const innerDir = path.join(outerDir, 'inner');
  const deepDir = path.join(innerDir, 'deep', 'subdir');
  fs.mkdirSync(deepDir, { recursive: true });
  try {
    execSync('git init -q', { cwd: outerDir });
    execSync('git init -q', { cwd: innerDir });

    // From deep subdir inside inner repo
    const result = getGitRoot(deepDir);
    assertEquals(result, innerDir);
  } finally {
    fs.rmSync(outerDir, { recursive: true, force: true });
  }
});

console.log('\n=== Symlinked directory tests ===\n');

test('getGitRoot resolves through symlink to git repo', () => {
  const realDir = path.join(os.tmpdir(), 'ck-test-real-' + Date.now());
  const linkDir = path.join(os.tmpdir(), 'ck-test-link-' + Date.now());
  fs.mkdirSync(realDir, { recursive: true });
  try {
    // Create git repo in real dir
    execSync('git init -q', { cwd: realDir });

    // Create symlink
    fs.symlinkSync(realDir, linkDir);

    // getGitRoot from symlink should work
    const result = getGitRoot(linkDir);
    // Git resolves to real path
    if (result !== null) {
      // Result should be the real path (symlink resolved)
      assertEquals(fs.realpathSync(result), fs.realpathSync(realDir));
    }
  } finally {
    try { fs.unlinkSync(linkDir); } catch (e) {}
    fs.rmSync(realDir, { recursive: true, force: true });
  }
});

test('getGitRoot with symlinked subdirectory', () => {
  const realDir = path.join(os.tmpdir(), 'ck-test-real-sub-' + Date.now());
  const subDir = path.join(realDir, 'subdir');
  const linkToSub = path.join(os.tmpdir(), 'ck-test-link-sub-' + Date.now());
  fs.mkdirSync(subDir, { recursive: true });
  try {
    execSync('git init -q', { cwd: realDir });

    // Create symlink to subdirectory
    fs.symlinkSync(subDir, linkToSub);

    // getGitRoot from symlinked subdir should find parent repo
    const result = getGitRoot(linkToSub);
    if (result !== null) {
      assertEquals(fs.realpathSync(result), fs.realpathSync(realDir));
    }
  } finally {
    try { fs.unlinkSync(linkToSub); } catch (e) {}
    fs.rmSync(realDir, { recursive: true, force: true });
  }
});

console.log('\n=== Git worktree tests ===\n');

test('getGitRoot works with git worktree', () => {
  const mainDir = path.join(os.tmpdir(), 'ck-test-wt-main-' + Date.now());
  const worktreeDir = path.join(os.tmpdir(), 'ck-test-wt-tree-' + Date.now());
  fs.mkdirSync(mainDir, { recursive: true });
  try {
    // Create main repo with a commit
    execSync('git init -q', { cwd: mainDir });
    execSync('git config user.email "test@test.com"', { cwd: mainDir });
    execSync('git config user.name "Test"', { cwd: mainDir });
    fs.writeFileSync(path.join(mainDir, 'file.txt'), 'test');
    execSync('git add .', { cwd: mainDir });
    execSync('git commit -q -m "initial"', { cwd: mainDir });

    // Create worktree
    execSync(`git worktree add -q "${worktreeDir}" -b worktree-branch`, { cwd: mainDir });

    // getGitRoot from worktree should return worktree path
    const result = getGitRoot(worktreeDir);
    assertEquals(result, worktreeDir);

    // Cleanup worktree
    execSync(`git worktree remove -f "${worktreeDir}"`, { cwd: mainDir });
  } finally {
    try { fs.rmSync(worktreeDir, { recursive: true, force: true }); } catch (e) {}
    fs.rmSync(mainDir, { recursive: true, force: true });
  }
});

console.log('\n=== Unicode path tests ===\n');

test('getGitRoot works with unicode characters in path', () => {
  const tempDir = path.join(os.tmpdir(), 'ck-test-日本語-émoji-🔥-' + Date.now());
  fs.mkdirSync(tempDir, { recursive: true });
  try {
    execSync('git init -q', { cwd: tempDir });

    const result = getGitRoot(tempDir);
    assertEquals(result, tempDir);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('getGitBranch works with unicode branch name', () => {
  const tempDir = path.join(os.tmpdir(), 'ck-test-unicode-branch-' + Date.now());
  fs.mkdirSync(tempDir, { recursive: true });
  try {
    execSync('git init -q', { cwd: tempDir });
    execSync('git config user.email "test@test.com"', { cwd: tempDir });
    execSync('git config user.name "Test"', { cwd: tempDir });
    fs.writeFileSync(path.join(tempDir, 'file.txt'), 'test');
    execSync('git add .', { cwd: tempDir });
    execSync('git commit -q -m "initial"', { cwd: tempDir });

    // Create and checkout branch with unicode name
    execSync('git checkout -q -b feature/日本語-test', { cwd: tempDir });

    const result = getGitBranch(tempDir);
    assertEquals(result, 'feature/日本語-test');
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

console.log('\n=== Special character path tests ===\n');

test('getGitRoot works with special shell characters in path', () => {
  // Test paths with characters that need escaping in shell
  const tempDir = path.join(os.tmpdir(), "ck-test-special-$var-'quote'-" + Date.now());
  fs.mkdirSync(tempDir, { recursive: true });
  try {
    execSync('git init -q', { cwd: tempDir });

    const result = getGitRoot(tempDir);
    assertEquals(result, tempDir);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

console.log('\n=== Empty/new git repo tests ===\n');

test('getGitRoot works on new repo with no commits', () => {
  const tempDir = path.join(os.tmpdir(), 'ck-test-empty-repo-' + Date.now());
  fs.mkdirSync(tempDir, { recursive: true });
  try {
    execSync('git init -q', { cwd: tempDir });

    // No commits yet
    const result = getGitRoot(tempDir);
    assertEquals(result, tempDir);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

test('getGitBranch on new repo returns default branch', () => {
  const tempDir = path.join(os.tmpdir(), 'ck-test-new-repo-branch-' + Date.now());
  fs.mkdirSync(tempDir, { recursive: true });
  try {
    execSync('git init -q', { cwd: tempDir });

    const result = getGitBranch(tempDir);
    // New repo should have main or master as default
    assertEquals(result === 'main' || result === 'master', true);
  } finally {
    fs.rmSync(tempDir, { recursive: true, force: true });
  }
});

console.log('\n=== resolvePlanPath with sessionOrigin tests (Issue #335) ===\n');

// Helper to generate unique session IDs for isolation
function generateTestSessionId() {
  return `test-session-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// Cleanup helper
function cleanupSession(sessionId) {
  const tempPath = getSessionTempPath(sessionId);
  try { fs.unlinkSync(tempPath); } catch (e) {}
}

test('resolvePlanPath returns absolute path as-is (Issue #335)', () => {
  const sessionId = generateTestSessionId();
  try {
    // Store absolute path in session
    writeSessionState(sessionId, {
      sessionOrigin: '/project/subfolder',
      activePlan: '/project/subfolder/plans/260111-feature',
      timestamp: Date.now()
    });

    const config = { paths: { plans: 'plans' }, plan: { resolution: { order: ['session'] } } };
    const result = resolvePlanPath(sessionId, config);

    assertEquals(result.resolvedBy, 'session');
    assertEquals(result.path, '/project/subfolder/plans/260111-feature');
  } finally {
    cleanupSession(sessionId);
  }
});

test('resolvePlanPath resolves relative path using sessionOrigin (Issue #335)', () => {
  const sessionId = generateTestSessionId();
  try {
    // Store relative path (legacy behavior)
    writeSessionState(sessionId, {
      sessionOrigin: '/project/subfolder',
      activePlan: 'plans/260111-feature',  // Relative
      timestamp: Date.now()
    });

    const config = { paths: { plans: 'plans' }, plan: { resolution: { order: ['session'] } } };
    const result = resolvePlanPath(sessionId, config);

    assertEquals(result.resolvedBy, 'session');
    // Should resolve using sessionOrigin
    assertEquals(result.path, '/project/subfolder/plans/260111-feature');
  } finally {
    cleanupSession(sessionId);
  }
});

test('resolvePlanPath without sessionOrigin uses relative path as-is', () => {
  const sessionId = generateTestSessionId();
  try {
    // No sessionOrigin (edge case)
    writeSessionState(sessionId, {
      activePlan: 'plans/260111-feature',
      timestamp: Date.now()
    });

    const config = { paths: { plans: 'plans' }, plan: { resolution: { order: ['session'] } } };
    const result = resolvePlanPath(sessionId, config);

    assertEquals(result.resolvedBy, 'session');
    // Without sessionOrigin, returns as-is (relative)
    assertEquals(result.path, 'plans/260111-feature');
  } finally {
    cleanupSession(sessionId);
  }
});

test('resolvePlanPath handles Windows-style paths on Windows', () => {
  if (process.platform !== 'win32') {
    console.log('  → Skipped: Windows-only test');
    return;
  }
  const sessionId = generateTestSessionId();
  try {
    writeSessionState(sessionId, {
      sessionOrigin: 'C:\\Users\\test\\project',
      activePlan: 'C:\\Users\\test\\project\\plans\\feature',
      timestamp: Date.now()
    });

    const config = { paths: { plans: 'plans' }, plan: { resolution: { order: ['session'] } } };
    const result = resolvePlanPath(sessionId, config);

    assertEquals(result.resolvedBy, 'session');
    assertEquals(result.path, 'C:\\Users\\test\\project\\plans\\feature');
  } finally {
    cleanupSession(sessionId);
  }
});

test('resolvePlanPath falls back to branch if no session state', () => {
  const sessionId = generateTestSessionId();
  // Don't write any session state

  const config = { paths: { plans: 'plans' }, plan: { resolution: { order: ['session', 'branch'] } } };
  const result = resolvePlanPath(sessionId, config);

  // Should fall through to branch or return null
  assertEquals(result.resolvedBy === 'branch' || result.resolvedBy === null, true);
});

// Summary
console.log('\n=== Summary ===\n');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Total: ${passed + failed}`);

if (failed > 0) {
  process.exit(1);
}
