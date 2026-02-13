#!/usr/bin/env node
/**
 * project-detector.cjs - Project and environment detection logic
 *
 * Extracted from session-init.cjs for reuse in both Claude hooks and OpenCode plugins.
 * Detects project type, package manager, framework, and runtime versions.
 *
 * @module project-detector
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const { execSync, execFileSync } = require('child_process');

// ═══════════════════════════════════════════════════════════════════════════
// SAFE EXECUTION HELPERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Safely execute shell command with optional timeout
 * @param {string} cmd - Command to execute
 * @param {number} [timeoutMs=5000] - Timeout in milliseconds
 * @returns {string|null} Output or null on error
 */
function execSafe(cmd, timeoutMs = 5000) {
  try {
    return execSync(cmd, {
      encoding: 'utf8',
      timeout: timeoutMs,
      stdio: ['pipe', 'pipe', 'pipe']
    }).trim();
  } catch (e) {
    return null;
  }
}

/**
 * Safely execute a binary with arguments (no shell interpolation)
 * @param {string} binary - Path to the executable
 * @param {string[]} args - Arguments array
 * @param {number} [timeoutMs=2000] - Timeout in milliseconds
 * @returns {string|null} Output or null on error
 */
function execFileSafe(binary, args, timeoutMs = 2000) {
  try {
    return execFileSync(binary, args, {
      encoding: 'utf8',
      timeout: timeoutMs,
      stdio: ['pipe', 'pipe', 'pipe']
    }).trim();
  } catch (e) {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// PYTHON DETECTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Validate that a path is a file and doesn't contain shell metacharacters
 * @param {string} p - Path to validate
 * @returns {boolean}
 */
function isValidPythonPath(p) {
  if (!p || typeof p !== 'string') return false;
  if (/[;&|`$(){}[\]<>!#*?]/.test(p)) return false;
  try {
    const stat = fs.statSync(p);
    return stat.isFile();
  } catch (e) {
    return false;
  }
}

/**
 * Build platform-specific Python paths for fast filesystem check
 * @returns {string[]} Array of potential Python paths
 */
function getPythonPaths() {
  const paths = [];

  if (process.env.PYTHON_PATH) {
    paths.push(process.env.PYTHON_PATH);
  }

  if (process.platform === 'win32') {
    const localAppData = process.env.LOCALAPPDATA;
    const programFiles = process.env.ProgramFiles || 'C:\\Program Files';
    const programFilesX86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';

    if (localAppData) {
      paths.push(path.join(localAppData, 'Microsoft', 'WindowsApps', 'python.exe'));
      paths.push(path.join(localAppData, 'Microsoft', 'WindowsApps', 'python3.exe'));
      for (const ver of ['313', '312', '311', '310', '39']) {
        paths.push(path.join(localAppData, 'Programs', 'Python', `Python${ver}`, 'python.exe'));
      }
    }

    for (const ver of ['313', '312', '311', '310', '39']) {
      paths.push(path.join(programFiles, `Python${ver}`, 'python.exe'));
      paths.push(path.join(programFilesX86, `Python${ver}`, 'python.exe'));
    }

    paths.push('C:\\Python313\\python.exe');
    paths.push('C:\\Python312\\python.exe');
    paths.push('C:\\Python311\\python.exe');
    paths.push('C:\\Python310\\python.exe');
    paths.push('C:\\Python39\\python.exe');
  } else {
    paths.push('/usr/bin/python3');
    paths.push('/usr/local/bin/python3');
    paths.push('/opt/homebrew/bin/python3');
    paths.push('/opt/homebrew/bin/python');
    paths.push('/usr/bin/python');
    paths.push('/usr/local/bin/python');
  }

  return paths;
}

/**
 * Find Python binary using fast filesystem check
 * @returns {string|null} Python binary path or null
 */
function findPythonBinary() {
  const paths = getPythonPaths();
  for (const p of paths) {
    if (isValidPythonPath(p)) return p;
  }
  return null;
}

/**
 * Get Python version with optimized detection
 * @returns {string|null} Python version string or null
 */
function getPythonVersion() {
  const pythonPath = findPythonBinary();
  if (pythonPath) {
    const result = execFileSafe(pythonPath, ['--version']);
    if (result) return result;
  }

  const commands = ['python3', 'python'];
  for (const cmd of commands) {
    const result = execFileSafe(cmd, ['--version']);
    if (result) return result;
  }

  return null;
}

// ═══════════════════════════════════════════════════════════════════════════
// GIT DETECTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get git remote URL
 * @returns {string|null}
 */
function getGitRemoteUrl() {
  return execSafe('git config --get remote.origin.url');
}

/**
 * Get current git branch
 * @returns {string|null}
 */
function getGitBranch() {
  return execSafe('git branch --show-current');
}

/**
 * Get git repository root
 * @returns {string|null}
 */
function getGitRoot() {
  return execSafe('git rev-parse --show-toplevel');
}

// ═══════════════════════════════════════════════════════════════════════════
// PROJECT DETECTION
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Detect project type based on workspace indicators
 * @param {string} [configOverride] - Manual override from config
 * @returns {'monorepo' | 'library' | 'single-repo'}
 */
function detectProjectType(configOverride) {
  if (configOverride && configOverride !== 'auto') return configOverride;

  if (fs.existsSync('pnpm-workspace.yaml')) return 'monorepo';
  if (fs.existsSync('lerna.json')) return 'monorepo';

  if (fs.existsSync('package.json')) {
    try {
      const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
      if (pkg.workspaces) return 'monorepo';
      if (pkg.main || pkg.exports) return 'library';
    } catch (e) { /* ignore */ }
  }

  return 'single-repo';
}

/**
 * Detect package manager from lock files
 * @param {string} [configOverride] - Manual override from config
 * @returns {'npm' | 'pnpm' | 'yarn' | 'bun' | null}
 */
function detectPackageManager(configOverride) {
  if (configOverride && configOverride !== 'auto') return configOverride;

  if (fs.existsSync('bun.lockb')) return 'bun';
  if (fs.existsSync('pnpm-lock.yaml')) return 'pnpm';
  if (fs.existsSync('yarn.lock')) return 'yarn';
  if (fs.existsSync('package-lock.json')) return 'npm';

  return null;
}

/**
 * Detect framework from package.json dependencies
 * @param {string} [configOverride] - Manual override from config
 * @returns {string|null}
 */
function detectFramework(configOverride) {
  if (configOverride && configOverride !== 'auto') return configOverride;
  if (!fs.existsSync('package.json')) return null;

  try {
    const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
    const deps = { ...pkg.dependencies, ...pkg.devDependencies };

    if (deps['next']) return 'next';
    if (deps['nuxt']) return 'nuxt';
    if (deps['astro']) return 'astro';
    if (deps['@remix-run/node'] || deps['@remix-run/react']) return 'remix';
    if (deps['svelte'] || deps['@sveltejs/kit']) return 'svelte';
    if (deps['vue']) return 'vue';
    if (deps['react']) return 'react';
    if (deps['express']) return 'express';
    if (deps['fastify']) return 'fastify';
    if (deps['hono']) return 'hono';
    if (deps['elysia']) return 'elysia';

    return null;
  } catch (e) {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// CODING LEVEL
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Get coding level style name mapping
 * @param {number} level - Coding level (0-5)
 * @returns {string} Style name
 */
function getCodingLevelStyleName(level) {
  const styleMap = {
    0: 'coding-level-0-eli5',
    1: 'coding-level-1-junior',
    2: 'coding-level-2-mid',
    3: 'coding-level-3-senior',
    4: 'coding-level-4-lead',
    5: 'coding-level-5-god'
  };
  return styleMap[level] || 'coding-level-5-god';
}

/**
 * Get coding level guidelines by reading from output-styles .md files
 * @param {number} level - Coding level (-1 to 5)
 * @param {string} [configDir] - Config directory path
 * @returns {string|null} Guidelines text or null if disabled
 */
function getCodingLevelGuidelines(level, configDir) {
  if (level === -1 || level === null || level === undefined) return null;

  const styleName = getCodingLevelStyleName(level);
  const basePath = configDir || path.join(process.cwd(), '.claude');
  const stylePath = path.join(basePath, 'output-styles', `${styleName}.md`);

  try {
    if (!fs.existsSync(stylePath)) return null;
    const content = fs.readFileSync(stylePath, 'utf8');
    const withoutFrontmatter = content.replace(/^---[\s\S]*?---\n*/, '').trim();
    return withoutFrontmatter;
  } catch (e) {
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// CONTEXT OUTPUT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Build context summary for output (compact, single line)
 * @param {Object} config - Loaded config
 * @param {Object} detections - Project detections
 * @param {{ path: string|null, resolvedBy: string|null }} resolved - Plan resolution
 * @param {string|null} gitRoot - Git repository root
 * @returns {string}
 */
function buildContextOutput(config, detections, resolved, gitRoot) {
  const lines = [`Project: ${detections.type || 'unknown'}`];
  if (detections.pm) lines.push(`PM: ${detections.pm}`);
  lines.push(`Plan naming: ${config.plan.namingFormat}`);

  if (gitRoot && gitRoot !== process.cwd()) {
    lines.push(`Root: ${gitRoot}`);
  }

  if (resolved.path) {
    if (resolved.resolvedBy === 'session') {
      lines.push(`Plan: ${resolved.path}`);
    } else {
      lines.push(`Suggested: ${resolved.path}`);
    }
  }

  return lines.join(' | ');
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN ENTRY POINT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Detect all project information
 *
 * @param {Object} [options]
 * @param {Object} [options.configOverrides] - Override auto-detection
 * @returns {{
 *   type: 'monorepo' | 'library' | 'single-repo',
 *   packageManager: 'npm' | 'pnpm' | 'yarn' | 'bun' | null,
 *   framework: string | null,
 *   pythonVersion: string | null,
 *   nodeVersion: string,
 *   gitBranch: string | null,
 *   gitRoot: string | null,
 *   gitUrl: string | null,
 *   osPlatform: string,
 *   user: string,
 *   locale: string,
 *   timezone: string
 * }}
 */
function detectProject(options = {}) {
  const { configOverrides = {} } = options;

  return {
    type: detectProjectType(configOverrides.type),
    packageManager: detectPackageManager(configOverrides.packageManager),
    framework: detectFramework(configOverrides.framework),
    pythonVersion: getPythonVersion(),
    nodeVersion: process.version,
    gitBranch: getGitBranch(),
    gitRoot: getGitRoot(),
    gitUrl: getGitRemoteUrl(),
    osPlatform: process.platform,
    user: process.env.USERNAME || process.env.USER || process.env.LOGNAME || os.userInfo().username,
    locale: process.env.LANG || '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
  };
}

/**
 * Build static environment info object
 * @param {string} [configDir] - Config directory path
 * @returns {Object} Static environment info
 */
function buildStaticEnv(configDir) {
  return {
    nodeVersion: process.version,
    pythonVersion: getPythonVersion(),
    osPlatform: process.platform,
    gitUrl: getGitRemoteUrl(),
    gitBranch: getGitBranch(),
    gitRoot: getGitRoot(),
    user: process.env.USERNAME || process.env.USER || process.env.LOGNAME || os.userInfo().username,
    locale: process.env.LANG || '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    configDir: configDir || path.join(process.cwd(), '.claude')
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  // Main entry points
  detectProject,
  buildStaticEnv,

  // Detection functions
  detectProjectType,
  detectPackageManager,
  detectFramework,

  // Python detection
  getPythonVersion,
  findPythonBinary,
  getPythonPaths,
  isValidPythonPath,

  // Git detection
  getGitRemoteUrl,
  getGitBranch,
  getGitRoot,

  // Coding level
  getCodingLevelStyleName,
  getCodingLevelGuidelines,

  // Output
  buildContextOutput,

  // Helpers
  execSafe,
  execFileSafe
};
