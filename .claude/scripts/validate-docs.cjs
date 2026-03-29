#!/usr/bin/env node
/**
 * Validate documentation accuracy against codebase.
 * Detects potential hallucinations: invented APIs, broken links, missing env vars.
 *
 * Usage:
 *   node .claude/scripts/validate-docs.cjs [docs-dir] [--src dir1,dir2]
 *
 * Checks:
 *   1. Code references - verify `functionName()` and `ClassName` exist
 *   2. Internal links - verify markdown links point to existing files
 *   3. Config keys - verify ENV_VAR exist in .env.example
 *
 * Exit: Always 0 (non-blocking, warn-only mode)
 */

const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

// Patterns
const CODE_REF_PATTERN = /`([A-Za-z_][A-Za-z0-9_]*(?:\(\))?)`/g;
const LINK_PATTERN = /\[([^\]]+)\]\(([^)]+)\)/g;
const ENV_PATTERN = /`([A-Z][A-Z0-9_]{2,})`|\$([A-Z][A-Z0-9_]{2,})/g;

// Common code terms to ignore (not actual code refs)
const IGNORE_CODE_REFS = new Set([
  'true', 'false', 'null', 'undefined', 'string', 'number', 'boolean',
  'object', 'array', 'function', 'async', 'await', 'const', 'let', 'var',
  'if', 'else', 'for', 'while', 'return', 'import', 'export', 'default',
  'npm', 'npx', 'node', 'yarn', 'pnpm', 'git', 'bash', 'sh', 'zsh',
  'GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS',
  'JSON', 'XML', 'HTML', 'CSS', 'SQL', 'API', 'URL', 'URI', 'HTTP', 'HTTPS',
  'OK', 'ERROR', 'WARNING', 'INFO', 'DEBUG', 'TRACE',
  'README', 'LICENSE', 'CHANGELOG', 'TODO', 'FIXME', 'NOTE', 'HACK',
  'dev', 'prod', 'test', 'staging', 'production', 'development',
  'src', 'lib', 'dist', 'build', 'docs', 'tests', 'config',
  'index', 'main', 'app', 'server', 'client', 'utils', 'helpers'
]);

// Common env var prefixes to ignore (not project-specific)
const IGNORE_ENV_PREFIXES = ['NODE_', 'PATH', 'HOME', 'USER', 'SHELL', 'TERM', 'PWD', 'CI'];

// Markdown template variables (not actual env vars)
const IGNORE_ENV_VARS = new Set(['ARGUMENTS']);

/**
 * Find all markdown files in directory.
 */
function findMarkdownFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.md'))
    .map(f => path.join(dir, f));
}

/**
 * Extract code references from markdown content.
 */
function extractCodeRefs(content, filepath) {
  const refs = [];
  let match;
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    // Skip code blocks
    if (line.trim().startsWith('```')) return;

    while ((match = CODE_REF_PATTERN.exec(line)) !== null) {
      const ref = match[1];
      // Filter out common terms
      if (IGNORE_CODE_REFS.has(ref.replace('()', '').toLowerCase())) continue;
      // Only check function calls and PascalCase classes
      if (ref.endsWith('()') || /^[A-Z][a-z]/.test(ref)) {
        refs.push({ ref, file: filepath, line: idx + 1 });
      }
    }
  });

  return refs;
}

/**
 * Extract internal links from markdown content.
 */
function extractLinks(content, filepath) {
  const links = [];
  let match;
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    while ((match = LINK_PATTERN.exec(line)) !== null) {
      const href = match[2];
      // Skip external links and anchors
      if (href.startsWith('http') || href.startsWith('#') || href.startsWith('mailto:')) continue;
      links.push({ href, file: filepath, line: idx + 1, text: match[1] });
    }
  });

  return links;
}

/**
 * Extract env var references from markdown content.
 */
function extractEnvVars(content, filepath) {
  const vars = [];
  let match;
  const lines = content.split('\n');

  lines.forEach((line, idx) => {
    // Skip code blocks
    if (line.trim().startsWith('```')) return;

    while ((match = ENV_PATTERN.exec(line)) !== null) {
      const envVar = match[1] || match[2];
      // Filter common system vars and template variables
      if (IGNORE_ENV_PREFIXES.some(p => envVar.startsWith(p))) continue;
      if (IGNORE_ENV_VARS.has(envVar)) continue;
      vars.push({ envVar, file: filepath, line: idx + 1 });
    }
  });

  return vars;
}

/**
 * Check if code reference exists in source directories.
 */
function checkCodeRefExists(ref, srcDirs) {
  const name = ref.replace('()', '');
  const patterns = [
    `function ${name}`,
    `const ${name}`,
    `class ${name}`,
    `def ${name}`,
    `export.*${name}`,
    `${name}:`  // object methods
  ];

  for (const srcDir of srcDirs) {
    if (!fs.existsSync(srcDir)) continue;
    for (const pattern of patterns) {
      // Use spawnSync with args array to prevent command injection
      const result = spawnSync('grep', ['-rl', pattern, srcDir], {
        encoding: 'utf8',
        stdio: ['pipe', 'pipe', 'pipe'],
        timeout: 5000
      });
      if (result.status === 0 && result.stdout.trim()) {
        return true;
      }
    }
  }
  return false;
}

/**
 * Check if internal link target exists.
 */
function checkLinkExists(href, sourceFile) {
  const sourceDir = path.dirname(sourceFile);
  const targetPath = path.resolve(sourceDir, href.split('#')[0]);
  return fs.existsSync(targetPath);
}

/**
 * Load env vars from .env.example.
 */
function loadEnvExample(projectRoot) {
  const envPath = path.join(projectRoot, '.env.example');
  if (!fs.existsSync(envPath)) return new Set();

  const content = fs.readFileSync(envPath, 'utf8');
  const vars = new Set();

  content.split('\n').forEach(line => {
    const match = line.match(/^([A-Z][A-Z0-9_]+)=/);
    if (match) vars.add(match[1]);
  });

  return vars;
}

/**
 * Run all validations and generate report.
 */
function validate(docsDir, srcDirs, projectRoot) {
  const issues = {
    codeRefs: [],
    links: [],
    envVars: []
  };
  const stats = {
    filesChecked: 0,
    codeRefsChecked: 0,
    linksChecked: 0,
    envVarsChecked: 0,
    codeRefsValid: 0,
    linksValid: 0,
    envVarsValid: 0
  };

  const mdFiles = findMarkdownFiles(docsDir);
  stats.filesChecked = mdFiles.length;

  if (mdFiles.length === 0) {
    console.log(`No markdown files found in ${docsDir}`);
    return;
  }

  const envExample = loadEnvExample(projectRoot);

  for (const filepath of mdFiles) {
    let content;
    try {
      content = fs.readFileSync(filepath, 'utf8');
    } catch (err) {
      // File deleted during validation - skip
      continue;
    }
    const relPath = path.relative(projectRoot, filepath);

    // Check code references
    const codeRefs = extractCodeRefs(content, relPath);
    stats.codeRefsChecked += codeRefs.length;
    for (const { ref, file, line } of codeRefs) {
      if (checkCodeRefExists(ref, srcDirs)) {
        stats.codeRefsValid++;
      } else {
        issues.codeRefs.push({ ref, file, line });
      }
    }

    // Check internal links
    const links = extractLinks(content, filepath);
    stats.linksChecked += links.length;
    for (const { href, file, line, text } of links) {
      if (checkLinkExists(href, file)) {
        stats.linksValid++;
      } else {
        issues.links.push({ href, file: relPath, line, text });
      }
    }

    // Check env vars
    const envVars = extractEnvVars(content, relPath);
    stats.envVarsChecked += envVars.length;
    for (const { envVar, file, line } of envVars) {
      if (envExample.has(envVar)) {
        stats.envVarsValid++;
      } else {
        issues.envVars.push({ envVar, file, line });
      }
    }
  }

  // Generate report
  console.log('\n## Docs Validation Report\n');
  console.log(`**Files Checked:** ${stats.filesChecked}`);
  console.log(`**Scan Date:** ${new Date().toISOString().split('T')[0]}\n`);

  const hasIssues = issues.codeRefs.length || issues.links.length || issues.envVars.length;

  if (hasIssues) {
    console.log('### Potential Issues\n');

    if (issues.codeRefs.length) {
      console.log(`⚠️ **Code References** (${issues.codeRefs.length} issues)`);
      for (const { ref, file, line } of issues.codeRefs.slice(0, 10)) {
        console.log(`- \`${ref}\` in ${file}:${line} - not found in codebase`);
      }
      if (issues.codeRefs.length > 10) {
        console.log(`- ... and ${issues.codeRefs.length - 10} more`);
      }
      console.log('');
    }

    if (issues.links.length) {
      console.log(`⚠️ **Internal Links** (${issues.links.length} issues)`);
      for (const { href, file, line } of issues.links.slice(0, 10)) {
        console.log(`- \`${href}\` in ${file}:${line} - file not found`);
      }
      if (issues.links.length > 10) {
        console.log(`- ... and ${issues.links.length - 10} more`);
      }
      console.log('');
    }

    if (issues.envVars.length) {
      console.log(`⚠️ **Config Keys** (${issues.envVars.length} issues)`);
      for (const { envVar, file, line } of issues.envVars.slice(0, 10)) {
        console.log(`- \`${envVar}\` in ${file}:${line} - not in .env.example`);
      }
      if (issues.envVars.length > 10) {
        console.log(`- ... and ${issues.envVars.length - 10} more`);
      }
      console.log('');
    }
  }

  console.log('### Verified OK\n');
  if (stats.codeRefsValid > 0) console.log(`✅ ${stats.codeRefsValid} code references validated`);
  if (stats.linksValid > 0) console.log(`✅ ${stats.linksValid} internal links working`);
  if (stats.envVarsValid > 0) console.log(`✅ ${stats.envVarsValid} config keys confirmed`);
  if (stats.codeRefsValid === 0 && stats.linksValid === 0 && stats.envVarsValid === 0) {
    console.log('ℹ️ No validatable references found');
  }
  console.log('');
}

/**
 * Parse CLI arguments.
 */
function parseArgs(args) {
  const result = {
    docsDir: 'docs',
    srcDirs: ['src', 'lib', 'app', 'scripts', '.claude']
  };

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--src' && args[i + 1]) {
      result.srcDirs = args[++i].split(',');
    } else if (!arg.startsWith('-')) {
      result.docsDir = arg;
    }
  }

  return result;
}

// Main
const args = parseArgs(process.argv.slice(2));
const projectRoot = process.cwd();
const docsDir = path.resolve(projectRoot, args.docsDir);
const srcDirs = args.srcDirs.map(d => path.resolve(projectRoot, d));

validate(docsDir, srcDirs, projectRoot);

// Always exit 0 (non-blocking)
process.exit(0);
