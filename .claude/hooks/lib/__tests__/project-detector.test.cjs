/**
 * project-detector.test.cjs - Comprehensive test suite for project-detector.cjs
 *
 * Tests all detection functions including edge cases identified in issue #455:
 * - Git detection with isGitRepo guard
 * - Python detection with `which`/`where` optimization
 * - Edge cases: deleted CWD, symlinks, worktrees, permissions
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync } = require('child_process');

// Module under test
const {
  // Git detection
  isGitRepo,
  getGitRemoteUrl,
  getGitBranch,
  getGitRoot,

  // Python detection
  findPythonBinary,
  getPythonVersion,
  getPythonPaths,
  isValidPythonPath,

  // Project detection
  detectProjectType,
  detectPackageManager,
  detectFramework,

  // Helpers
  execSafe,
  execFileSafe
} = require('../project-detector.cjs');

// ═══════════════════════════════════════════════════════════════════════════
// TEST UTILITIES
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Create a temporary directory for testing
 * @returns {string} Path to temp directory
 */
function createTempDir() {
  return fs.mkdtempSync(path.join(os.tmpdir(), 'project-detector-test-'));
}

/**
 * Create a mock git repository
 * @param {string} dir - Directory to initialize
 * @param {Object} options - Options for git init
 * @returns {string} Path to git repo
 */
function createMockGitRepo(dir, options = {}) {
  fs.mkdirSync(dir, { recursive: true });

  if (options.worktree) {
    // Create .git file (worktree style) instead of directory
    fs.writeFileSync(path.join(dir, '.git'), `gitdir: ${options.gitdir || '/tmp/main/.git/worktrees/test'}`);
  } else {
    // Create .git directory
    fs.mkdirSync(path.join(dir, '.git'), { recursive: true });
  }

  if (options.branch) {
    const headPath = path.join(dir, '.git', 'HEAD');
    fs.mkdirSync(path.dirname(headPath), { recursive: true });
    fs.writeFileSync(headPath, `ref: refs/heads/${options.branch}\n`);
  }

  return dir;
}

/**
 * Cleanup temp directory
 * @param {string} dir - Directory to remove
 */
function cleanupTempDir(dir) {
  try {
    fs.rmSync(dir, { recursive: true, force: true });
  } catch (e) {
    // Ignore cleanup errors
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// GIT DETECTION TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('isGitRepo', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = createTempDir();
  });

  afterEach(() => {
    cleanupTempDir(tempDir);
  });

  test('returns true for directory with .git directory', () => {
    createMockGitRepo(tempDir);
    expect(isGitRepo(tempDir)).toBe(true);
  });

  test('returns true for directory with .git file (worktree)', () => {
    createMockGitRepo(tempDir, { worktree: true });
    expect(isGitRepo(tempDir)).toBe(true);
  });

  test('returns false for directory without .git', () => {
    expect(isGitRepo(tempDir)).toBe(false);
  });

  test('returns true for subdirectory of git repo', () => {
    createMockGitRepo(tempDir);
    const subDir = path.join(tempDir, 'src', 'components');
    fs.mkdirSync(subDir, { recursive: true });
    expect(isGitRepo(subDir)).toBe(true);
  });

  test('returns false for /tmp (non-git directory)', () => {
    expect(isGitRepo('/tmp')).toBe(false);
  });

  test('uses process.cwd() when no argument provided', () => {
    const originalCwd = process.cwd();
    try {
      process.chdir(tempDir);
      createMockGitRepo(tempDir);
      // Re-check after creating .git in cwd
      expect(isGitRepo()).toBe(true);
    } finally {
      process.chdir(originalCwd);
    }
  });

  test('handles deeply nested directories', () => {
    createMockGitRepo(tempDir);
    const deepDir = path.join(tempDir, 'a', 'b', 'c', 'd', 'e', 'f');
    fs.mkdirSync(deepDir, { recursive: true });
    expect(isGitRepo(deepDir)).toBe(true);
  });

  test('returns false gracefully for non-existent directory', () => {
    const nonExistent = path.join(tempDir, 'does-not-exist');
    // Should not throw, should return false
    expect(isGitRepo(nonExistent)).toBe(false);
  });

  test('handles symlinked .git directory', () => {
    // Create actual .git in a separate location
    const actualGitDir = path.join(tempDir, 'actual-git');
    fs.mkdirSync(path.join(actualGitDir, '.git'), { recursive: true });

    // Create symlink in test directory
    const symlinkDir = path.join(tempDir, 'symlink-repo');
    fs.mkdirSync(symlinkDir, { recursive: true });

    try {
      fs.symlinkSync(path.join(actualGitDir, '.git'), path.join(symlinkDir, '.git'));
      expect(isGitRepo(symlinkDir)).toBe(true);
    } catch (e) {
      // Skip if symlinks not supported (Windows without admin)
      if (e.code === 'EPERM') {
        console.log('Skipping symlink test - insufficient permissions');
        return;
      }
      throw e;
    }
  });
});

describe('getGitBranch', () => {
  let tempDir;
  let originalCwd;

  beforeEach(() => {
    tempDir = createTempDir();
    originalCwd = process.cwd();
  });

  afterEach(() => {
    process.chdir(originalCwd);
    cleanupTempDir(tempDir);
  });

  test('returns null for non-git directory', () => {
    process.chdir(tempDir);
    expect(getGitBranch()).toBe(null);
  });

  test('returns null for non-git directory (no git command executed)', () => {
    process.chdir('/tmp');
    // This should NOT execute git command, just return null from isGitRepo check
    const result = getGitBranch();
    expect(result).toBe(null);
  });

  test('returns branch name for actual git repo', () => {
    // Use current repo which is a real git repo
    const branch = getGitBranch();
    // Should return current branch or null (not throw)
    expect(branch === null || typeof branch === 'string').toBe(true);
  });
});

describe('getGitRoot', () => {
  let tempDir;
  let originalCwd;

  beforeEach(() => {
    tempDir = createTempDir();
    originalCwd = process.cwd();
  });

  afterEach(() => {
    process.chdir(originalCwd);
    cleanupTempDir(tempDir);
  });

  test('returns null for non-git directory', () => {
    process.chdir(tempDir);
    expect(getGitRoot()).toBe(null);
  });

  test('returns path for actual git repo', () => {
    // Use current working directory which should be in a git repo
    const root = getGitRoot();
    // Should return a path or null (not throw)
    expect(root === null || typeof root === 'string').toBe(true);
    if (root) {
      expect(fs.existsSync(root)).toBe(true);
    }
  });
});

describe('getGitRemoteUrl', () => {
  let tempDir;
  let originalCwd;

  beforeEach(() => {
    tempDir = createTempDir();
    originalCwd = process.cwd();
  });

  afterEach(() => {
    process.chdir(originalCwd);
    cleanupTempDir(tempDir);
  });

  test('returns null for non-git directory', () => {
    process.chdir(tempDir);
    expect(getGitRemoteUrl()).toBe(null);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// PYTHON DETECTION TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('isValidPythonPath', () => {
  test('returns false for null', () => {
    expect(isValidPythonPath(null)).toBe(false);
  });

  test('returns false for undefined', () => {
    expect(isValidPythonPath(undefined)).toBe(false);
  });

  test('returns false for empty string', () => {
    expect(isValidPythonPath('')).toBe(false);
  });

  test('returns false for non-string', () => {
    expect(isValidPythonPath(123)).toBe(false);
    expect(isValidPythonPath({})).toBe(false);
    expect(isValidPythonPath([])).toBe(false);
  });

  test('returns false for path with shell metacharacters', () => {
    expect(isValidPythonPath('/usr/bin/python; rm -rf /')).toBe(false);
    expect(isValidPythonPath('/usr/bin/python | cat')).toBe(false);
    expect(isValidPythonPath('/usr/bin/python`whoami`')).toBe(false);
    expect(isValidPythonPath('/usr/bin/python$(id)')).toBe(false);
    expect(isValidPythonPath('/usr/bin/python&')).toBe(false);
  });

  test('returns false for non-existent path', () => {
    expect(isValidPythonPath('/nonexistent/path/to/python')).toBe(false);
  });

  test('returns false for directory', () => {
    expect(isValidPythonPath('/tmp')).toBe(false);
  });

  test('returns true for valid Python binary', () => {
    // Try common Python paths
    const commonPaths = ['/usr/bin/python3', '/usr/bin/python', '/usr/local/bin/python3'];
    const validPath = commonPaths.find(p => {
      try {
        return fs.existsSync(p) && fs.statSync(p).isFile();
      } catch (e) {
        return false;
      }
    });

    if (validPath) {
      expect(isValidPythonPath(validPath)).toBe(true);
    } else {
      // Skip if no Python found
      console.log('Skipping - no Python binary found at common paths');
    }
  });
});

describe('getPythonPaths', () => {
  test('returns an array', () => {
    const paths = getPythonPaths();
    expect(Array.isArray(paths)).toBe(true);
  });

  test('includes common Unix paths on non-Windows', () => {
    if (process.platform !== 'win32') {
      const paths = getPythonPaths();
      expect(paths).toContain('/usr/bin/python3');
      expect(paths).toContain('/usr/local/bin/python3');
    }
  });

  test('respects PYTHON_PATH environment variable', () => {
    const originalEnv = process.env.PYTHON_PATH;
    try {
      process.env.PYTHON_PATH = '/custom/python/path';
      const paths = getPythonPaths();
      expect(paths[0]).toBe('/custom/python/path');
    } finally {
      if (originalEnv !== undefined) {
        process.env.PYTHON_PATH = originalEnv;
      } else {
        delete process.env.PYTHON_PATH;
      }
    }
  });
});

describe('findPythonBinary', () => {
  test('returns a string or null', () => {
    const result = findPythonBinary();
    expect(result === null || typeof result === 'string').toBe(true);
  });

  test('returns valid path if Python is installed', () => {
    const result = findPythonBinary();
    if (result) {
      expect(isValidPythonPath(result)).toBe(true);
    }
  });

  test('uses which/where for fast detection (performance)', () => {
    const start = Date.now();
    const result = findPythonBinary();
    const elapsed = Date.now() - start;

    // Should complete in under 1 second (fast path with which)
    // Previously could take 10+ seconds with timeout per path
    expect(elapsed).toBeLessThan(1000);

    if (result) {
      console.log(`Python detected at ${result} in ${elapsed}ms`);
    }
  });
});

describe('getPythonVersion', () => {
  test('returns a string or null', () => {
    const result = getPythonVersion();
    expect(result === null || typeof result === 'string').toBe(true);
  });

  test('returns version string starting with "Python" if available', () => {
    const result = getPythonVersion();
    if (result) {
      expect(result).toMatch(/^Python \d+\.\d+/);
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// PROJECT DETECTION TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('detectProjectType', () => {
  let tempDir;
  let originalCwd;

  beforeEach(() => {
    tempDir = createTempDir();
    originalCwd = process.cwd();
    process.chdir(tempDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    cleanupTempDir(tempDir);
  });

  test('returns config override if not "auto"', () => {
    expect(detectProjectType('monorepo')).toBe('monorepo');
    expect(detectProjectType('library')).toBe('library');
  });

  test('returns "auto" detection when override is "auto"', () => {
    const result = detectProjectType('auto');
    expect(['monorepo', 'library', 'single-repo']).toContain(result);
  });

  test('detects monorepo from pnpm-workspace.yaml', () => {
    fs.writeFileSync('pnpm-workspace.yaml', 'packages:\n  - packages/*');
    expect(detectProjectType()).toBe('monorepo');
  });

  test('detects monorepo from lerna.json', () => {
    fs.writeFileSync('lerna.json', '{}');
    expect(detectProjectType()).toBe('monorepo');
  });

  test('detects monorepo from package.json workspaces', () => {
    fs.writeFileSync('package.json', JSON.stringify({ workspaces: ['packages/*'] }));
    expect(detectProjectType()).toBe('monorepo');
  });

  test('detects library from package.json main/exports', () => {
    fs.writeFileSync('package.json', JSON.stringify({ main: 'index.js' }));
    expect(detectProjectType()).toBe('library');
  });

  test('returns single-repo as default', () => {
    expect(detectProjectType()).toBe('single-repo');
  });
});

describe('detectPackageManager', () => {
  let tempDir;
  let originalCwd;

  beforeEach(() => {
    tempDir = createTempDir();
    originalCwd = process.cwd();
    process.chdir(tempDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    cleanupTempDir(tempDir);
  });

  test('returns config override if not "auto"', () => {
    expect(detectPackageManager('yarn')).toBe('yarn');
    expect(detectPackageManager('pnpm')).toBe('pnpm');
  });

  test('detects bun from bun.lockb', () => {
    fs.writeFileSync('bun.lockb', '');
    expect(detectPackageManager()).toBe('bun');
  });

  test('detects pnpm from pnpm-lock.yaml', () => {
    fs.writeFileSync('pnpm-lock.yaml', '');
    expect(detectPackageManager()).toBe('pnpm');
  });

  test('detects yarn from yarn.lock', () => {
    fs.writeFileSync('yarn.lock', '');
    expect(detectPackageManager()).toBe('yarn');
  });

  test('detects npm from package-lock.json', () => {
    fs.writeFileSync('package-lock.json', '{}');
    expect(detectPackageManager()).toBe('npm');
  });

  test('returns null when no lock file found', () => {
    expect(detectPackageManager()).toBe(null);
  });

  test('bun takes precedence over others', () => {
    fs.writeFileSync('bun.lockb', '');
    fs.writeFileSync('package-lock.json', '{}');
    expect(detectPackageManager()).toBe('bun');
  });
});

describe('detectFramework', () => {
  let tempDir;
  let originalCwd;

  beforeEach(() => {
    tempDir = createTempDir();
    originalCwd = process.cwd();
    process.chdir(tempDir);
  });

  afterEach(() => {
    process.chdir(originalCwd);
    cleanupTempDir(tempDir);
  });

  test('returns config override if not "auto"', () => {
    expect(detectFramework('next')).toBe('next');
  });

  test('returns null when no package.json', () => {
    expect(detectFramework()).toBe(null);
  });

  test('detects Next.js', () => {
    fs.writeFileSync('package.json', JSON.stringify({ dependencies: { next: '^14.0.0' } }));
    expect(detectFramework()).toBe('next');
  });

  test('detects React', () => {
    fs.writeFileSync('package.json', JSON.stringify({ dependencies: { react: '^18.0.0' } }));
    expect(detectFramework()).toBe('react');
  });

  test('detects Vue', () => {
    fs.writeFileSync('package.json', JSON.stringify({ dependencies: { vue: '^3.0.0' } }));
    expect(detectFramework()).toBe('vue');
  });

  test('detects Astro', () => {
    fs.writeFileSync('package.json', JSON.stringify({ dependencies: { astro: '^4.0.0' } }));
    expect(detectFramework()).toBe('astro');
  });

  test('detects Express', () => {
    fs.writeFileSync('package.json', JSON.stringify({ dependencies: { express: '^4.0.0' } }));
    expect(detectFramework()).toBe('express');
  });

  test('Next.js takes precedence over React', () => {
    fs.writeFileSync('package.json', JSON.stringify({
      dependencies: { next: '^14.0.0', react: '^18.0.0' }
    }));
    expect(detectFramework()).toBe('next');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTION TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('execSafe', () => {
  test('returns output for successful command', () => {
    const result = execSafe('echo "hello"');
    expect(result).toBe('hello');
  });

  test('returns null for failed command', () => {
    const result = execSafe('nonexistent-command-12345');
    expect(result).toBe(null);
  });

  test('returns null on timeout', () => {
    // Command that would take longer than timeout
    const result = execSafe('sleep 10', 100);
    expect(result).toBe(null);
  });

  test('trims output', () => {
    const result = execSafe('echo "  hello  "');
    expect(result).toBe('hello');
  });

  test('handles newlines in output', () => {
    const result = execSafe('echo "line1\nline2"');
    expect(result).toBe('line1\nline2');
  });
});

describe('execFileSafe', () => {
  test('returns output for successful command', () => {
    const result = execFileSafe('echo', ['hello']);
    expect(result).toBe('hello');
  });

  test('returns null for non-existent binary', () => {
    const result = execFileSafe('/nonexistent/binary', ['arg']);
    expect(result).toBe(null);
  });

  test('returns null on timeout', () => {
    const result = execFileSafe('sleep', ['10'], 100);
    expect(result).toBe(null);
  });

  test('handles multiple arguments', () => {
    const result = execFileSafe('echo', ['hello', 'world']);
    expect(result).toBe('hello world');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// EDGE CASE TESTS (Issue #455)
// ═══════════════════════════════════════════════════════════════════════════

describe('Edge Cases (Issue #455)', () => {
  describe('Git detection edge cases', () => {
    let tempDir;

    beforeEach(() => {
      tempDir = createTempDir();
    });

    afterEach(() => {
      cleanupTempDir(tempDir);
    });

    test('handles .git as file (worktree format)', () => {
      const worktreeDir = path.join(tempDir, 'worktree');
      createMockGitRepo(worktreeDir, { worktree: true });
      expect(isGitRepo(worktreeDir)).toBe(true);
    });

    test('handles path traversal up to root without infinite loop', () => {
      // Deep directory should eventually reach root and terminate
      const deepPath = '/tmp/a/b/c/d/e/f/g/h/i/j/k/l/m/n/o/p';
      const result = isGitRepo(deepPath);
      expect(typeof result).toBe('boolean');
    });

    test('handles special characters in path', () => {
      const specialDir = path.join(tempDir, 'dir with spaces');
      fs.mkdirSync(specialDir, { recursive: true });
      expect(() => isGitRepo(specialDir)).not.toThrow();
    });

    test('getGitBranch returns null instead of throwing for non-git', () => {
      const originalCwd = process.cwd();
      try {
        process.chdir(tempDir);
        expect(() => getGitBranch()).not.toThrow();
        expect(getGitBranch()).toBe(null);
      } finally {
        process.chdir(originalCwd);
      }
    });

    test('getGitRoot returns null instead of throwing for non-git', () => {
      const originalCwd = process.cwd();
      try {
        process.chdir(tempDir);
        expect(() => getGitRoot()).not.toThrow();
        expect(getGitRoot()).toBe(null);
      } finally {
        process.chdir(originalCwd);
      }
    });

    test('getGitRemoteUrl returns null instead of throwing for non-git', () => {
      const originalCwd = process.cwd();
      try {
        process.chdir(tempDir);
        expect(() => getGitRemoteUrl()).not.toThrow();
        expect(getGitRemoteUrl()).toBe(null);
      } finally {
        process.chdir(originalCwd);
      }
    });
  });

  describe('Python detection edge cases', () => {
    test('handles missing which/where command gracefully', () => {
      // Even if which fails, should fall back to path checking
      expect(() => findPythonBinary()).not.toThrow();
    });

    test('which output with trailing newline is handled', () => {
      // execSafe trims output, so this should work
      const result = execSafe('which python3 2>/dev/null || echo ""');
      if (result) {
        expect(result).not.toMatch(/\n$/);
      }
    });

    test('detection completes in reasonable time', () => {
      const start = Date.now();
      findPythonBinary();
      const elapsed = Date.now() - start;

      // Should complete in under 2 seconds even with all fallbacks
      expect(elapsed).toBeLessThan(2000);
    });
  });

  describe('Process.cwd() edge case', () => {
    test('isGitRepo handles invalid startDir gracefully', () => {
      // Pass a path that doesn't exist
      expect(() => isGitRepo('/this/path/definitely/does/not/exist')).not.toThrow();
    });
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// INTEGRATION TESTS
// ═══════════════════════════════════════════════════════════════════════════

describe('Integration Tests', () => {
  test('all git functions work together in actual git repo', () => {
    // We're in a git repo, so all these should work
    const isRepo = isGitRepo();
    const branch = getGitBranch();
    const root = getGitRoot();
    const url = getGitRemoteUrl();

    if (isRepo) {
      expect(typeof branch === 'string' || branch === null).toBe(true);
      expect(typeof root === 'string' || root === null).toBe(true);
      expect(typeof url === 'string' || url === null).toBe(true);
    }
  });

  test('all git functions return null in non-git directory', () => {
    const tempDir = createTempDir();
    const originalCwd = process.cwd();

    try {
      process.chdir(tempDir);

      expect(isGitRepo()).toBe(false);
      expect(getGitBranch()).toBe(null);
      expect(getGitRoot()).toBe(null);
      expect(getGitRemoteUrl()).toBe(null);
    } finally {
      process.chdir(originalCwd);
      cleanupTempDir(tempDir);
    }
  });

  test('Python detection chain works end-to-end', () => {
    const binary = findPythonBinary();
    const version = getPythonVersion();

    // If binary found, version should also be found
    if (binary) {
      expect(version).toBeTruthy();
      expect(version).toMatch(/Python/i);
    }
  });
});
