#!/usr/bin/env node
/**
 * Git Worktree Manager for ClaudeKit
 * Cross-platform Node.js script for creating isolated git worktrees
 *
 * Usage: node worktree.cjs <command> [options]
 * Commands:
 *   create <project> <feature>  Create a new worktree (project optional for standalone)
 *   remove <name-or-path>       Remove a worktree and its branch
 *   info                        Get repo info (type, projects, env files)
 *   list                        List existing worktrees
 *
 * Options:
 *   --prefix <type>        Branch prefix (feat|fix|refactor|docs|test|chore|perf)
 *   --worktree-root <path> Explicit worktree directory (Claude's decision)
 *   --json                 Output in JSON format for LLM consumption
 *   --env <files>          Comma-separated list of .env files to copy (legacy)
 *   --dry-run              Show what would be done without executing
 *   --no-prefix            Skip branch prefix and preserve original case
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

function sanitizeBranchPrefix(value) {
  const raw = String(value || '').trim().toLowerCase();
  if (!raw) return 'feat';
  const safe = raw
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 20);
  return safe || 'feat';
}

function isSafeEnvFileName(fileName) {
  if (!fileName || typeof fileName !== 'string') return false;
  if (fileName.includes('\0')) return false;
  if (path.isAbsolute(fileName)) return false;
  const normalized = path.normalize(fileName.trim());
  if (normalized.startsWith('..') || normalized.includes(`..${path.sep}`)) return false;
  if (normalized.includes(path.sep)) return false;
  return /^\.env[\w.-]*$/.test(normalized);
}

// Minimum Node.js version check
const MIN_NODE_VERSION = 18;
const nodeVersion = parseInt(process.version.slice(1).split('.')[0], 10);
if (nodeVersion < MIN_NODE_VERSION) {
  outputError('NODE_VERSION_ERROR', `Node.js ${MIN_NODE_VERSION}+ required. Current: ${process.version}`);
  process.exit(1);
}

// Parse arguments
const args = process.argv.slice(2);
const jsonOutput = args.includes('--json');
const jsonIndex = args.indexOf('--json');
if (jsonIndex > -1) args.splice(jsonIndex, 1);

const prefixIndex = args.indexOf('--prefix');
let branchPrefix = 'feat';
let branchPrefixWarning = null;
if (prefixIndex > -1) {
  const rawPrefix = args[prefixIndex + 1] || 'feat';
  branchPrefix = sanitizeBranchPrefix(rawPrefix);
  if (branchPrefix !== rawPrefix.toLowerCase()) {
    branchPrefixWarning = `Branch prefix sanitized: "${rawPrefix}" → "${branchPrefix}"`;
  }
  args.splice(prefixIndex, 2);
}

const envIndex = args.indexOf('--env');
let envFilesToCopy = [];
if (envIndex > -1) {
  envFilesToCopy = (args[envIndex + 1] || '').split(',').map(v => v.trim()).filter(Boolean);
  args.splice(envIndex, 2);
}

const dryRunIndex = args.indexOf('--dry-run');
const dryRun = dryRunIndex > -1;
if (dryRunIndex > -1) args.splice(dryRunIndex, 1);

// --no-prefix: skip branch prefix and preserve original case in feature name
const noPrefixIndex = args.indexOf('--no-prefix');
const noPrefix = noPrefixIndex > -1;
if (noPrefixIndex > -1) args.splice(noPrefixIndex, 1);

// --worktree-root: explicit override for worktree location (Claude's decision)
const worktreeRootIndex = args.indexOf('--worktree-root');
let explicitWorktreeRoot = null;
if (worktreeRootIndex > -1) {
  explicitWorktreeRoot = args[worktreeRootIndex + 1];
  args.splice(worktreeRootIndex, 2);
}

const command = args[0];
// For create: args[1] is project (or feature for standalone), args[2] is feature
// For remove: args[1] is worktree name or path
const arg1 = args[1];
const arg2 = args[2];

// Output helpers
function output(data) {
  if (jsonOutput) {
    console.log(JSON.stringify(data, null, 2));
  } else {
    if (data.success) {
      console.log(`\n✅ ${data.message}`);
      if (data.worktreePath) {
        console.log(`\n📋 Next Steps:`);
        console.log(`   1. cd ${data.worktreePath}`);
        console.log(`   2. claude`);
        console.log(`   3. Start working on your feature`);
        console.log(`\n🧹 Cleanup when done:`);
        console.log(`   git worktree remove ${data.worktreePath}`);
        console.log(`   git branch -d ${data.branch}`);
      }
      if (data.envTemplatesCopied && data.envTemplatesCopied.length > 0) {
        console.log(`\n📄 Environment templates copied:`);
        data.envTemplatesCopied.forEach(t => console.log(`   ✓ ${t.from} → ${t.to}`));
      } else if (data.envFilesCopied && data.envFilesCopied.length > 0) {
        console.log(`\n📄 Environment files copied:`);
        data.envFilesCopied.forEach(f => console.log(`   ✓ ${f}`));
      }
      if (data.warnings && data.warnings.length > 0) {
        console.log(`\n⚠️  Warnings:`);
        data.warnings.forEach(w => console.log(`   ${w}`));
      }
    } else if (data.info) {
      // Info output
      console.log(`\n📦 Repository Info:`);
      console.log(`   Type: ${data.repoType}`);
      console.log(`   Base branch: ${data.baseBranch}`);
      if (data.worktreeRoot) {
        console.log(`\n📂 Worktree location:`);
        console.log(`   Path: ${data.worktreeRoot}`);
        console.log(`   Source: ${data.worktreeRootSource}`);
      }
      if (data.projects && data.projects.length > 0) {
        console.log(`\n📁 Available projects:`);
        data.projects.forEach(p => console.log(`   - ${p.name} (${p.path})`));
      }
      if (data.envFiles && data.envFiles.length > 0) {
        console.log(`\n🔐 Environment files found:`);
        data.envFiles.forEach(f => console.log(`   - ${f}`));
      }
      if (data.dirtyState) {
        console.log(`\n⚠️  Working directory has uncommitted changes`);
      }
    }
  }
}

function outputError(code, message, details = {}) {
  const errorData = {
    success: false,
    error: { code, message, ...details }
  };
  if (jsonOutput) {
    console.log(JSON.stringify(errorData, null, 2));
  } else {
    console.error(`\n❌ Error [${code}]: ${message}`);
    if (details.suggestion) {
      console.error(`   💡 ${details.suggestion}`);
    }
    if (details.availableProjects) {
      console.error(`\n   Available projects:`);
      details.availableProjects.forEach(p => console.error(`     - ${p}`));
    }
  }
  process.exit(1);
}

// Git command wrapper with error handling
function git(command, options = {}) {
  try {
    const result = execSync(`git ${command}`, {
      encoding: 'utf-8',
      stdio: options.silent ? 'pipe' : ['pipe', 'pipe', 'pipe'],
      cwd: options.cwd || process.cwd()
    });
    return { success: true, output: result.trim() };
  } catch (error) {
    return {
      success: false,
      error: error.message,
      stderr: error.stderr?.toString().trim() || '',
      code: error.status
    };
  }
}

// Check if in git repo
function checkGitRepo() {
  const result = git('rev-parse --show-toplevel', { silent: true });
  if (!result.success) {
    outputError('NOT_GIT_REPO', 'Not in a git repository', {
      suggestion: 'Run this command from within a git repository'
    });
  }
  return result.output;
}

// Check git version supports worktree
function checkGitVersion() {
  const result = git('worktree list', { silent: true });
  if (!result.success && result.stderr.includes('not a git command')) {
    outputError('GIT_VERSION_ERROR', 'Git version too old (worktree requires git 2.5+)', {
      suggestion: 'Upgrade git to version 2.5 or newer'
    });
  }
}

// Detect base branch
function detectBaseBranch(cwd) {
  const branches = ['dev', 'develop', 'main', 'master'];
  for (const branch of branches) {
    const local = git(`show-ref --verify --quiet refs/heads/${branch}`, { silent: true, cwd });
    if (local.success) return branch;
    const remote = git(`show-ref --verify --quiet refs/remotes/origin/${branch}`, { silent: true, cwd });
    if (remote.success) return branch;
  }
  return 'main'; // fallback
}

// Find the topmost superproject by walking up the directory tree
// This handles submodules within monorepos - worktrees go to the root monorepo
// Safety limit prevents infinite loops in edge cases (max 10 levels deep)
const MAX_SUPERPROJECT_DEPTH = 10;

function findTopmostSuperproject(gitRoot) {
  let current = gitRoot;
  let topmost = gitRoot;
  let depth = 0;

  // Keep walking up while we find superprojects (with safety limit)
  while (depth < MAX_SUPERPROJECT_DEPTH) {
    const result = git('rev-parse --show-superproject-working-tree', { silent: true, cwd: current });
    if (!result.success || !result.output) {
      break; // No more superprojects above
    }
    topmost = result.output;
    current = result.output;
    depth++;
  }

  return topmost;
}

// Validate that a path can be used as worktree root (exists or can be created)
function validateWorktreeRoot(rootPath) {
  if (typeof rootPath !== 'string' || rootPath.trim().length === 0) {
    return { valid: false, error: 'Worktree root path is empty' };
  }
  if (/[\0\r\n]/.test(rootPath)) {
    return { valid: false, error: 'Worktree root contains invalid control characters' };
  }
  const resolved = path.resolve(rootPath);

  // Check if path exists and is a directory
  if (fs.existsSync(resolved)) {
    const stat = fs.statSync(resolved);
    if (!stat.isDirectory()) {
      return { valid: false, error: `Path exists but is not a directory: ${resolved}` };
    }
    return { valid: true, path: resolved };
  }

  // Check if parent directory exists (we can create the worktree dir)
  const parent = path.dirname(resolved);
  if (fs.existsSync(parent)) {
    const parentStat = fs.statSync(parent);
    if (!parentStat.isDirectory()) {
      return { valid: false, error: `Parent path is not a directory: ${parent}` };
    }
    return { valid: true, path: resolved };
  }

  // Parent doesn't exist - check if grandparent exists (allows mkdir -p one level)
  const grandparent = path.dirname(parent);
  if (fs.existsSync(grandparent)) {
    return { valid: true, path: resolved };
  }

  return { valid: false, error: `Cannot create worktree directory: parent path does not exist: ${parent}` };
}

// Determine the worktree root directory with priority:
// 1. Explicit --worktree-root flag (Claude's decision)
// 2. WORKTREE_ROOT env var (explicit override)
// 3. Topmost superproject's worktrees/ (for submodules)
// 4. Monorepo: worktrees/ inside repo (keeps related worktrees together)
// 5. Standalone: sibling worktrees/ (avoids polluting repo)
function getWorktreeRoot(gitRoot, isMonorepo, explicitRoot = null) {
  // Priority 0: Explicit --worktree-root flag (Claude's decision)
  if (explicitRoot) {
    const validation = validateWorktreeRoot(explicitRoot);
    if (!validation.valid) {
      outputError('INVALID_WORKTREE_ROOT', validation.error, {
        suggestion: 'Provide a valid directory path that exists or can be created'
      });
    }
    return { dir: validation.path, source: '--worktree-root flag' };
  }

  // Priority 1: Environment variable override
  const envRoot = process.env.WORKTREE_ROOT;
  if (envRoot) {
    const validation = validateWorktreeRoot(envRoot);
    if (!validation.valid) {
      outputError('INVALID_WORKTREE_ROOT', validation.error, {
        suggestion: 'Fix WORKTREE_ROOT env var or unset it'
      });
    }
    return { dir: validation.path, source: 'WORKTREE_ROOT env' };
  }

  // Priority 2: Check for superproject (we might be in a submodule)
  const topmostRoot = findTopmostSuperproject(gitRoot);
  if (topmostRoot !== gitRoot) {
    return {
      dir: path.join(topmostRoot, 'worktrees'),
      source: `superproject (${path.basename(topmostRoot)})`
    };
  }

  // Priority 3: Monorepo - use worktrees/ inside the repo
  // Keeps all project worktrees organized together within the monorepo
  if (isMonorepo) {
    return { dir: path.join(gitRoot, 'worktrees'), source: 'monorepo internal' };
  }

  // Priority 4: Standalone repos - use sibling worktrees/
  // Avoids polluting the repo with worktree directories
  return { dir: path.join(path.dirname(gitRoot), 'worktrees'), source: 'sibling directory' };
}

// Check for uncommitted changes
function checkDirtyState() {
  const diff = git('diff --quiet', { silent: true });
  const diffCached = git('diff --cached --quiet', { silent: true });
  return !diff.success || !diffCached.success;
}

// Get dirty state details
function getDirtyStateDetails() {
  const status = git('status --porcelain', { silent: true });
  if (!status.success) return null;
  const lines = status.output.split('\n').filter(Boolean);
  const modified = lines.filter(l => l.startsWith(' M') || l.startsWith('M ')).length;
  const staged = lines.filter(l => l.startsWith('A ') || l.startsWith('M ') || l.startsWith('D ')).length;
  const untracked = lines.filter(l => l.startsWith('??')).length;
  return { modified, staged, untracked, total: lines.length };
}

// Parse .gitmodules for monorepo detection
function parseGitModules(gitRoot) {
  const modulesPath = path.join(gitRoot, '.gitmodules');
  if (!fs.existsSync(modulesPath)) return [];

  const content = fs.readFileSync(modulesPath, 'utf-8');
  const projects = [];
  const pathRegex = /path\s*=\s*(.+)/g;
  let match;
  while ((match = pathRegex.exec(content)) !== null) {
    const projectPath = match[1].trim();
    projects.push({
      path: projectPath,
      name: path.basename(projectPath)
    });
  }
  return projects;
}

// Find .env files
function findEnvFiles(dir) {
  try {
    const files = fs.readdirSync(dir);
    return files.filter(f => {
      if (!f.startsWith('.env')) return false;
      const fullPath = path.join(dir, f);
      const stat = fs.statSync(fullPath);
      return stat.isFile() && !stat.isSymbolicLink();
    });
  } catch {
    return [];
  }
}

// Find .env template files (*.example)
function findEnvTemplates(dir) {
  try {
    const files = fs.readdirSync(dir);
    return files.filter(f => {
      if (!f.startsWith('.env') || !f.endsWith('.example')) return false;
      const fullPath = path.join(dir, f);
      const stat = fs.statSync(fullPath);
      return stat.isFile() && !stat.isSymbolicLink();
    });
  } catch {
    return [];
  }
}

// Copy env templates to worktree (strips .example suffix)
function copyEnvTemplates(srcDir, destDir) {
  const templates = findEnvTemplates(srcDir);
  const copied = [];
  const warnings = [];

  templates.forEach(template => {
    const srcPath = path.join(srcDir, template);
    const destName = template.replace(/\.example$/, '');
    const destPath = path.join(destDir, destName);

    try {
      fs.copyFileSync(srcPath, destPath);
      copied.push({ from: template, to: destName });
    } catch (err) {
      warnings.push(`Failed to copy ${template}: ${err.message}`);
    }
  });

  return { copied, warnings };
}

// Find matching projects
function findMatchingProjects(projects, query) {
  const queryLower = query.toLowerCase();
  return projects.filter(p =>
    p.name.toLowerCase().includes(queryLower) ||
    p.path.toLowerCase().includes(queryLower)
  );
}

// Check if branch is already checked out
function isBranchCheckedOut(branchName, cwd) {
  const result = git('worktree list --porcelain', { silent: true, cwd });
  if (!result.success) return false;
  return result.output.includes(`branch refs/heads/${branchName}`);
}

// Check if branch exists
function branchExists(branchName, cwd) {
  const local = git(`show-ref --verify --quiet refs/heads/${branchName}`, { silent: true, cwd });
  if (local.success) return 'local';
  const remote = git(`show-ref --verify --quiet refs/remotes/origin/${branchName}`, { silent: true, cwd });
  if (remote.success) return 'remote';
  return false;
}

// Sanitize feature name to valid branch name
function sanitizeFeatureName(name, preserveCase = false) {
  const raw = String(name || '').trim();
  if (!raw) return '';

  // Keep ASCII branch names; drop diacritics first for better readability.
  let ascii = raw
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '');

  // When preserveCase is true (--no-prefix), keep original casing
  if (!preserveCase) ascii = ascii.toLowerCase();

  ascii = ascii
    .replace(preserveCase ? /[^a-zA-Z0-9-]/g : /[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 50); // Limit length

  if (ascii) return ascii;

  // If input had alphanumeric Unicode but collapsed to empty, keep deterministic fallback.
  if (/[\p{L}\p{N}]/u.test(raw)) {
    const hash = crypto.createHash('sha1').update(raw).digest('hex').slice(0, 8);
    return `feature-${hash}`;
  }

  return '';
}

// COMMANDS

function cmdInfo() {
  const gitRoot = checkGitRepo();
  checkGitVersion();

  const projects = parseGitModules(gitRoot);
  const isMonorepo = projects.length > 0;
  const baseBranch = detectBaseBranch(gitRoot);
  const dirtyState = checkDirtyState();
  const dirtyDetails = dirtyState ? getDirtyStateDetails() : null;
  const envFiles = findEnvFiles(gitRoot);

  // Get worktree root info (shows where worktrees will be created)
  const worktreeRoot = getWorktreeRoot(gitRoot, isMonorepo);

  // For monorepo, also check each project for env files
  const projectEnvFiles = {};
  if (isMonorepo) {
    projects.forEach(p => {
      const projectDir = path.join(gitRoot, p.path);
      if (fs.existsSync(projectDir)) {
        const files = findEnvFiles(projectDir);
        if (files.length > 0) {
          projectEnvFiles[p.name] = files;
        }
      }
    });
  }

  output({
    info: true,
    repoType: isMonorepo ? 'monorepo' : 'standalone',
    gitRoot,
    baseBranch,
    worktreeRoot: worktreeRoot.dir,
    worktreeRootSource: worktreeRoot.source,
    projects: isMonorepo ? projects : [],
    envFiles,
    projectEnvFiles: isMonorepo ? projectEnvFiles : {},
    dirtyState,
    dirtyDetails
  });
}

function cmdList() {
  checkGitRepo();
  const result = git('worktree list', { silent: true });
  if (!result.success) {
    outputError('WORKTREE_LIST_ERROR', 'Failed to list worktrees', {
      suggestion: 'Ensure you are in a git repository'
    });
  }

  const worktrees = result.output.split('\n').filter(Boolean).map(line => {
    const parts = line.split(/\s+/);
    return {
      path: parts[0],
      commit: parts[1],
      branch: parts[2]?.replace(/[\[\]]/g, '') || 'detached'
    };
  });

  if (jsonOutput) {
    console.log(JSON.stringify({ success: true, worktrees }, null, 2));
  } else {
    console.log('\n📂 Existing worktrees:');
    worktrees.forEach(w => {
      console.log(`   ${w.path}`);
      console.log(`      Branch: ${w.branch} (${w.commit.slice(0, 7)})`);
    });
  }
}

function cmdCreate() {
  const gitRoot = checkGitRepo();
  checkGitVersion();

  const projects = parseGitModules(gitRoot);
  const isMonorepo = projects.length > 0;
  const warnings = [];
  if (branchPrefixWarning) warnings.push(branchPrefixWarning);
  const safeEnvFilesToCopy = [];
  if (envFilesToCopy.length > 0) {
    envFilesToCopy.forEach(envFile => {
      if (!isSafeEnvFileName(envFile)) {
        warnings.push(`Skipped unsafe env file entry: ${envFile}`);
        return;
      }
      if (!safeEnvFilesToCopy.includes(envFile)) {
        safeEnvFilesToCopy.push(envFile);
      }
    });
  }

  // Parse arguments based on repo type
  // Monorepo: create <project> <feature>
  // Standalone: create <feature>
  let project, feature;
  if (isMonorepo) {
    project = arg1;
    feature = arg2;
    if (!project || !feature) {
      outputError('MISSING_ARGS', 'Both project and feature are required for monorepo', {
        suggestion: 'Usage: node worktree.cjs create <project> <feature> --prefix <type>',
        availableProjects: projects.map(p => p.name)
      });
    }
  } else {
    feature = arg1;
    if (!feature) {
      outputError('MISSING_FEATURE', 'Feature name is required', {
        suggestion: 'Usage: node worktree.cjs create <feature> --prefix <type>'
      });
    }
  }

  // Check dirty state
  if (checkDirtyState()) {
    const details = getDirtyStateDetails();
    warnings.push(`Uncommitted changes: ${details.modified} modified, ${details.staged} staged, ${details.untracked} untracked`);
  }

  // Determine working directory
  let workDir = gitRoot;
  let projectPath = '';
  let projectName = '';

  if (isMonorepo) {
    const matches = findMatchingProjects(projects, project);

    if (matches.length === 0) {
      outputError('PROJECT_NOT_FOUND', `Project "${project}" not found`, {
        suggestion: 'Check available projects with: node worktree.cjs info',
        availableProjects: projects.map(p => p.name)
      });
    }

    if (matches.length > 1) {
      outputError('MULTIPLE_PROJECTS_MATCH', `Multiple projects match "${project}"`, {
        suggestion: 'Use AskUserQuestion to let user select one',
        matchingProjects: matches.map(p => ({ name: p.name, path: p.path }))
      });
    }

    projectPath = matches[0].path;
    projectName = matches[0].name;
    workDir = path.join(gitRoot, projectPath);

    if (!fs.existsSync(workDir)) {
      outputError('PROJECT_DIR_NOT_FOUND', `Project directory not found: ${workDir}`, {
        suggestion: 'Initialize submodules: git submodule update --init'
      });
    }
  }

  // Sanitize feature name
  const sanitizedFeature = sanitizeFeatureName(feature, noPrefix);
  if (!sanitizedFeature) {
    outputError('INVALID_FEATURE_NAME', 'Feature name became empty after sanitization', {
      suggestion: 'Use letters/numbers in feature name (example: "login-validation")'
    });
  }
  if (sanitizedFeature !== feature.toLowerCase().replace(/\s+/g, '-')) {
    warnings.push(`Feature name sanitized: "${feature}" → "${sanitizedFeature}"`);
  }

  // Create branch name — --no-prefix uses sanitized feature as-is
  const branchName = noPrefix ? sanitizedFeature : `${branchPrefix}/${sanitizedFeature}`;

  // Detect base branch
  const baseBranch = detectBaseBranch(workDir);

  // Check if branch already checked out
  if (isBranchCheckedOut(branchName, workDir)) {
    outputError('BRANCH_CHECKED_OUT', `Branch "${branchName}" is already checked out in another worktree`, {
      suggestion: 'Use a different feature name or remove the existing worktree'
    });
  }

  // Determine worktree path using smart root detection
  // explicitWorktreeRoot comes from --worktree-root flag (Claude's decision)
  const worktreeRoot = getWorktreeRoot(gitRoot, isMonorepo, explicitWorktreeRoot);
  const worktreesDir = worktreeRoot.dir;

  // Build worktree name: always include repo name for clarity
  const repoName = path.basename(gitRoot);
  const worktreeName = isMonorepo
    ? `${projectName}-${sanitizedFeature}`
    : `${repoName}-${sanitizedFeature}`;

  const worktreePath = path.join(worktreesDir, worktreeName);

  // Check if worktree already exists
  if (fs.existsSync(worktreePath)) {
    outputError('WORKTREE_EXISTS', `Worktree already exists: ${worktreePath}`, {
      suggestion: `To use: cd ${worktreePath} && claude\nTo remove: git worktree remove ${worktreePath}`
    });
  }

  // Check if branch exists
  const branchStatus = branchExists(branchName, workDir);

  // Dry-run mode: show what would be done
  if (dryRun) {
    output({
      success: true,
      dryRun: true,
      message: 'Dry run - no changes made',
      wouldCreate: {
        worktreePath,
        worktreeRootSource: worktreeRoot.source,
        branch: branchName,
        baseBranch,
        branchExists: !!branchStatus,
        project: isMonorepo ? projectName : null,
        envFilesToCopy: safeEnvFilesToCopy.length > 0 ? safeEnvFilesToCopy : undefined
      },
      warnings: warnings.length > 0 ? warnings : undefined
    });
    return;
  }

  // Create worktrees directory
  try {
    fs.mkdirSync(worktreesDir, { recursive: true });
  } catch (err) {
    outputError('MKDIR_FAILED', `Failed to create worktrees directory: ${worktreesDir}`, {
      suggestion: 'Check write permissions'
    });
  }

  // Fetch remote branch if needed
  if (branchStatus === 'remote') {
    const fetchResult = git(`fetch origin ${branchName}`, { silent: true, cwd: workDir });
    if (!fetchResult.success) {
      outputError('FETCH_FAILED', `Failed to fetch branch from remote: ${branchName}`, {
        suggestion: 'Check network connection and remote repository access'
      });
    }
  }

  // Create worktree
  let createResult;
  if (branchStatus) {
    createResult = git(`worktree add "${worktreePath}" ${branchName}`, { cwd: workDir });
  } else {
    createResult = git(`worktree add -b ${branchName} "${worktreePath}" ${baseBranch}`, { cwd: workDir });
  }

  if (!createResult.success) {
    outputError('WORKTREE_CREATE_FAILED', `Failed to create worktree`, {
      suggestion: createResult.stderr || createResult.error,
      gitError: createResult.stderr
    });
  }

  // Auto-copy env templates (.env*.example → .env*)
  const sourceDir = isMonorepo ? workDir : gitRoot;
  const envResult = copyEnvTemplates(sourceDir, worktreePath);
  envResult.warnings.forEach(w => warnings.push(w));

  // Also copy explicitly specified env files (legacy --env flag support)
  const envFilesCopied = envResult.copied.map(c => c.to);
  if (safeEnvFilesToCopy.length > 0) {
    safeEnvFilesToCopy.forEach(envFile => {
      const sourcePath = path.join(sourceDir, envFile);
      const destPath = path.join(worktreePath, envFile);
      if (fs.existsSync(sourcePath)) {
        try {
          fs.copyFileSync(sourcePath, destPath);
          if (!envFilesCopied.includes(envFile)) {
            envFilesCopied.push(envFile);
          }
        } catch (err) {
          warnings.push(`Failed to copy ${envFile}: ${err.message}`);
        }
      } else {
        warnings.push(`Env file not found: ${envFile}`);
      }
    });
  }

  output({
    success: true,
    message: 'Worktree created successfully!',
    worktreePath,
    worktreeRootSource: worktreeRoot.source,
    branch: branchName,
    baseBranch,
    project: isMonorepo ? projectName : null,
    envFilesCopied,
    envTemplatesCopied: envResult.copied,
    warnings: warnings.length > 0 ? warnings : undefined
  });
}

function cmdRemove() {
  if (!arg1) {
    outputError('MISSING_WORKTREE', 'Worktree name or path is required', {
      suggestion: 'Usage: node worktree.cjs remove <name-or-path>\nUse "node worktree.cjs list" to see available worktrees'
    });
  }

  const gitRoot = checkGitRepo();
  checkGitVersion();

  // Get list of worktrees
  const result = git('worktree list --porcelain', { silent: true });
  if (!result.success) {
    outputError('WORKTREE_LIST_ERROR', 'Failed to list worktrees');
  }

  // Parse worktrees
  const worktrees = [];
  let current = {};
  result.output.split('\n').forEach(line => {
    if (line.startsWith('worktree ')) {
      if (current.path) worktrees.push(current);
      current = { path: line.replace('worktree ', '') };
    } else if (line.startsWith('branch ')) {
      current.branch = line.replace('branch refs/heads/', '');
    }
  });
  if (current.path) worktrees.push(current);

  // Find matching worktree
  const searchTerm = arg1.toLowerCase();
  const removable = worktrees.filter(w => !w.path.includes('.git/'));
  const exactMatches = removable.filter(w => {
    const name = path.basename(w.path).toLowerCase();
    const fullPath = w.path.toLowerCase();
    const branch = (w.branch || '').toLowerCase();
    return name === searchTerm || fullPath === searchTerm || branch === searchTerm;
  });
  const prefixMatches = removable.filter(w => {
    const name = path.basename(w.path).toLowerCase();
    const fullPath = w.path.toLowerCase();
    const branch = (w.branch || '').toLowerCase();
    return name.startsWith(searchTerm) || fullPath.startsWith(searchTerm) || branch.startsWith(searchTerm);
  });
  const containsMatches = removable.filter(w => {
    const name = path.basename(w.path).toLowerCase();
    const fullPath = w.path.toLowerCase();
    const branch = (w.branch || '').toLowerCase();
    return name.includes(searchTerm) || fullPath.includes(searchTerm) || branch.includes(searchTerm);
  });

  let removableMatches = exactMatches;
  if (removableMatches.length === 0) {
    removableMatches = prefixMatches;
  }
  if (removableMatches.length === 0 && searchTerm.length >= 4) {
    removableMatches = containsMatches;
  }

  if (removableMatches.length === 0) {
    outputError('WORKTREE_NOT_FOUND', `No worktree matching "${arg1}" found`, {
      suggestion: 'Use "node worktree.cjs list" to see available worktrees',
      availableWorktrees: removable.map(w => path.basename(w.path))
    });
  }

  if (removableMatches.length > 1) {
    outputError('MULTIPLE_WORKTREES_MATCH', `Multiple worktrees match "${arg1}"`, {
      suggestion: 'Be more specific or use full path',
      matchingWorktrees: removableMatches.map(w => ({ name: path.basename(w.path), path: w.path, branch: w.branch }))
    });
  }

  const worktree = removableMatches[0];
  const worktreePath = worktree.path;
  const branchName = worktree.branch;

  // Dry-run mode
  if (dryRun) {
    output({
      success: true,
      dryRun: true,
      message: 'Dry run - no changes made',
      wouldRemove: {
        worktreePath,
        branch: branchName,
        deleteBranch: !!branchName
      }
    });
    return;
  }

  // Remove worktree
  const removeResult = git(`worktree remove "${worktreePath}" --force`, { silent: true });
  if (!removeResult.success) {
    outputError('WORKTREE_REMOVE_FAILED', `Failed to remove worktree: ${worktreePath}`, {
      suggestion: removeResult.stderr || 'Check if the worktree has uncommitted changes',
      gitError: removeResult.stderr
    });
  }

  // Delete branch if it exists
  let branchDeleted = false;
  let branchDeleteWarning = null;
  if (branchName) {
    const deleteResult = git(`branch -d "${branchName}"`, { silent: true });
    if (deleteResult.success) {
      branchDeleted = true;
    } else {
      branchDeleteWarning = `Branch kept: ${branchName} (${deleteResult.stderr || 'not fully merged'})`;
    }
  }

  output({
    success: true,
    message: 'Worktree removed successfully!',
    removedPath: worktreePath,
    branchDeleted: branchDeleted ? branchName : null,
    branchKept: !branchDeleted && branchName ? branchName : null,
    warnings: branchDeleteWarning ? [branchDeleteWarning] : undefined
  });
}

// Main
function main() {
  switch (command) {
    case 'create':
      cmdCreate();
      break;
    case 'remove':
      cmdRemove();
      break;
    case 'info':
      cmdInfo();
      break;
    case 'list':
      cmdList();
      break;
    default:
      outputError('UNKNOWN_COMMAND', `Unknown command: ${command || '(none)'}`, {
        suggestion: 'Available commands: create, remove, info, list'
      });
  }
}

main();
