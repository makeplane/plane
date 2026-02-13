#!/usr/bin/env node
/**
 * context-builder.cjs - Context/reminder building for session injection
 *
 * Extracted from dev-rules-reminder.cjs for reuse in both Claude hooks and OpenCode plugins.
 * Builds session context, rules, paths, and plan information.
 *
 * @module context-builder
 */

const fs = require('fs');
const os = require('os');
const path = require('path');
const { execSync } = require('child_process');

// Usage cache file path (written by usage-context-awareness.cjs hook)
const USAGE_CACHE_FILE = path.join(os.tmpdir(), 'ck-usage-limits-cache.json');
const WARN_THRESHOLD = 70;
const CRITICAL_THRESHOLD = 90;
const {
  loadConfig,
  resolvePlanPath,
  getReportsPath,
  resolveNamingPattern,
  normalizePath
} = require('./ck-config-utils.cjs');

// ═══════════════════════════════════════════════════════════════════════════
// HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Safely execute a command with timeout
 * @param {string} cmd - Command to execute
 * @returns {string|null} Output or null on error
 */
function execSafe(cmd) {
  try {
    return execSync(cmd, { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
  } catch (e) {
    return null;
  }
}

/**
 * Resolve rules file path (local or global) with backward compat
 * @param {string} filename - Rules filename
 * @param {string} [configDirName='.claude'] - Config directory name
 * @returns {string|null} Resolved path or null
 */
function resolveRulesPath(filename, configDirName = '.claude') {
  // Try rules/ first (new location)
  const localRulesPath = path.join(process.cwd(), configDirName, 'rules', filename);
  const globalRulesPath = path.join(os.homedir(), '.claude', 'rules', filename);

  if (fs.existsSync(localRulesPath)) return `${configDirName}/rules/${filename}`;
  if (fs.existsSync(globalRulesPath)) return `~/.claude/rules/${filename}`;

  // Backward compat: try workflows/ (legacy location)
  const localWorkflowsPath = path.join(process.cwd(), configDirName, 'workflows', filename);
  const globalWorkflowsPath = path.join(os.homedir(), '.claude', 'workflows', filename);

  if (fs.existsSync(localWorkflowsPath)) return `${configDirName}/workflows/${filename}`;
  if (fs.existsSync(globalWorkflowsPath)) return `~/.claude/workflows/${filename}`;

  return null;
}

/**
 * Resolve script file path (local or global)
 * @param {string} filename - Script filename
 * @param {string} [configDirName='.claude'] - Config directory name
 * @returns {string|null} Resolved path or null
 */
function resolveScriptPath(filename, configDirName = '.claude') {
  const localPath = path.join(process.cwd(), configDirName, 'scripts', filename);
  const globalPath = path.join(os.homedir(), '.claude', 'scripts', filename);
  if (fs.existsSync(localPath)) return `${configDirName}/scripts/${filename}`;
  if (fs.existsSync(globalPath)) return `~/.claude/scripts/${filename}`;
  return null;
}

/**
 * Resolve skills venv Python path (local or global)
 * @param {string} [configDirName='.claude'] - Config directory name
 * @returns {string|null} Resolved venv Python path or null
 */
function resolveSkillsVenv(configDirName = '.claude') {
  const isWindows = process.platform === 'win32';
  const venvBin = isWindows ? 'Scripts' : 'bin';
  const pythonExe = isWindows ? 'python.exe' : 'python3';

  const localVenv = path.join(process.cwd(), configDirName, 'skills', '.venv', venvBin, pythonExe);
  const globalVenv = path.join(os.homedir(), '.claude', 'skills', '.venv', venvBin, pythonExe);

  if (fs.existsSync(localVenv)) {
    return isWindows
      ? `${configDirName}\\skills\\.venv\\Scripts\\python.exe`
      : `${configDirName}/skills/.venv/bin/python3`;
  }
  if (fs.existsSync(globalVenv)) {
    return isWindows
      ? '~\\.claude\\skills\\.venv\\Scripts\\python.exe'
      : '~/.claude/skills/.venv/bin/python3';
  }
  return null;
}

/**
 * Build plan context from config and git info
 * @param {string|null} sessionId - Session ID
 * @param {Object} config - Loaded config
 * @returns {Object} Plan context object
 */
function buildPlanContext(sessionId, config) {
  const { plan, paths } = config;
  const gitBranch = execSafe('git branch --show-current');
  const resolved = resolvePlanPath(sessionId, config);
  const reportsPath = getReportsPath(resolved.path, resolved.resolvedBy, plan, paths);

  // Compute naming pattern directly for reliable injection
  const namePattern = resolveNamingPattern(plan, gitBranch);

  const planLine = resolved.resolvedBy === 'session'
    ? `- Plan: ${resolved.path}`
    : resolved.resolvedBy === 'branch'
      ? `- Plan: none | Suggested: ${resolved.path}`
      : `- Plan: none`;

  // Validation config (injected so LLM can reference it)
  const validation = plan.validation || {};
  const validationMode = validation.mode || 'prompt';
  const validationMin = validation.minQuestions || 3;
  const validationMax = validation.maxQuestions || 8;

  return { reportsPath, gitBranch, planLine, namePattern, validationMode, validationMin, validationMax };
}

/**
 * Check if context was recently injected (prevent duplicate injection)
 * @param {string} transcriptPath - Path to transcript file
 * @returns {boolean} true if recently injected
 */
function wasRecentlyInjected(transcriptPath) {
  try {
    if (!transcriptPath || !fs.existsSync(transcriptPath)) return false;
    const transcript = fs.readFileSync(transcriptPath, 'utf-8');
    // Check last 150 lines (hook output is ~30 lines, so this covers ~5 user prompts)
    return transcript.split('\n').slice(-150).some(line => line.includes('[IMPORTANT] Consider Modularization'));
  } catch (e) {
    return false;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// SECTION BUILDERS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Build language section
 * @param {Object} params
 * @param {string} [params.thinkingLanguage] - Language for thinking
 * @param {string} [params.responseLanguage] - Language for response
 * @returns {string[]} Lines for language section
 */
function buildLanguageSection({ thinkingLanguage, responseLanguage }) {
  // Auto-default thinkingLanguage to 'en' when only responseLanguage is set
  const effectiveThinking = thinkingLanguage || (responseLanguage ? 'en' : null);
  const hasThinking = effectiveThinking && effectiveThinking !== responseLanguage;
  const hasResponse = responseLanguage;
  const lines = [];

  if (hasThinking || hasResponse) {
    lines.push(`## Language`);
    if (hasThinking) {
      lines.push(`- Thinking: Use ${effectiveThinking} for reasoning (logic, precision).`);
    }
    if (hasResponse) {
      lines.push(`- Response: Respond in ${responseLanguage} (natural, fluent).`);
    }
    lines.push(``);
  }

  return lines;
}

/**
 * Build session section
 * @param {Object} [staticEnv] - Pre-computed static environment info
 * @returns {string[]} Lines for session section
 */
function buildSessionSection(staticEnv = {}) {
  const memUsed = Math.round(process.memoryUsage().heapUsed / 1024 / 1024);
  const memTotal = Math.round(os.totalmem() / 1024 / 1024);
  const memPercent = Math.round((memUsed / memTotal) * 100);
  const cpuUsage = Math.round((process.cpuUsage().user / 1000000) * 100);
  const cpuSystem = Math.round((process.cpuUsage().system / 1000000) * 100);

  return [
    `## Session`,
    `- DateTime: ${new Date().toLocaleString()}`,
    `- CWD: ${staticEnv.cwd || process.cwd()}`,
    `- Timezone: ${staticEnv.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone}`,
    `- Working directory: ${staticEnv.cwd || process.cwd()}`,
    `- OS: ${staticEnv.osPlatform || process.platform}`,
    `- User: ${staticEnv.user || process.env.USERNAME || process.env.USER}`,
    `- Locale: ${staticEnv.locale || process.env.LANG || ''}`,
    `- Memory usage: ${memUsed}MB/${memTotal}MB (${memPercent}%)`,
    `- CPU usage: ${cpuUsage}% user / ${cpuSystem}% system`,
    `- Spawning multiple subagents can cause performance issues, spawn and delegate tasks intelligently based on the available system resources.`,
    `- Remember that each subagent only has 200K tokens in context window, spawn and delegate tasks intelligently to make sure their context windows don't get bloated.`,
    `- IMPORTANT: Include these environment information when prompting subagents to perform tasks.`,
    ``
  ];
}

/**
 * Read usage limits from cache file (written by usage-context-awareness.cjs)
 * @returns {Object|null} Usage data or null if unavailable
 */
function readUsageCache() {
  try {
    if (fs.existsSync(USAGE_CACHE_FILE)) {
      const cache = JSON.parse(fs.readFileSync(USAGE_CACHE_FILE, 'utf-8'));
      // Cache is valid for 5 minutes for injection purposes
      if (Date.now() - cache.timestamp < 300000 && cache.data) {
        return cache.data;
      }
    }
  } catch { }
  return null;
}

/**
 * Format time until reset
 * @param {string} resetAt - ISO timestamp
 * @returns {string|null} Formatted time or null
 */
function formatTimeUntilReset(resetAt) {
  if (!resetAt) return null;
  const resetTime = new Date(resetAt);
  const remaining = Math.floor(resetTime.getTime() / 1000) - Math.floor(Date.now() / 1000);
  if (remaining <= 0 || remaining > 18000) return null; // Only show if < 5 hours
  const hours = Math.floor(remaining / 3600);
  const mins = Math.floor((remaining % 3600) / 60);
  return `${hours}h ${mins}m`;
}

/**
 * Format percentage with warning level
 * @param {number} value - Percentage value
 * @param {string} label - Label prefix
 * @returns {string} Formatted string with warning if applicable
 */
function formatUsagePercent(value, label) {
  const pct = Math.round(value);
  if (pct >= CRITICAL_THRESHOLD) return `${label}: ${pct}% [CRITICAL]`;
  if (pct >= WARN_THRESHOLD) return `${label}: ${pct}% [WARNING]`;
  return `${label}: ${pct}%`;
}

/**
 * Build context window section from statusline cache
 * @param {string} sessionId - Session ID
 * @returns {string[]} Lines for context section
 */
function buildContextSection(sessionId) {
  if (!sessionId) return [];

  try {
    const contextPath = path.join(os.tmpdir(), `ck-context-${sessionId}.json`);
    if (!fs.existsSync(contextPath)) return [];

    const data = JSON.parse(fs.readFileSync(contextPath, 'utf-8'));
    // Only use fresh data (< 5 min old - statusline updates every 300ms when active)
    if (Date.now() - data.timestamp > 300000) return [];

    const lines = [`## Current Session's Context`];

    // Format: 48% used (96K/200K tokens)
    const usedK = Math.round(data.tokens / 1000);
    const sizeK = Math.round(data.size / 1000);
    lines.push(`- Context: ${data.percent}% used (${usedK}K/${sizeK}K tokens)`);
    lines.push(`- **NOTE:** Optimize the workflow for token efficiency`);

    // Warning if high usage
    if (data.percent >= CRITICAL_THRESHOLD) {
      lines.push(`- **CRITICAL:** Context nearly full - consider compaction or being concise, update current phase's status before the compaction.`);
    } else if (data.percent >= WARN_THRESHOLD) {
      lines.push(`- **WARNING:** Context usage moderate - being concise and optimize token efficiency.`);
    }

    lines.push(``);
    return lines;
  } catch {
    return [];
  }
}

/**
 * Build usage section from cache
 * @returns {string[]} Lines for usage section
 */
function buildUsageSection() {
  const usage = readUsageCache();
  if (!usage) return [];

  const lines = [];
  const parts = [];

  // 5-hour limit
  if (usage.five_hour) {
    const util = usage.five_hour.utilization;
    if (typeof util === 'number') {
      parts.push(formatUsagePercent(util, '5h'));
    }
    const timeLeft = formatTimeUntilReset(usage.five_hour.resets_at);
    if (timeLeft) {
      parts.push(`resets in ${timeLeft}`);
    }
  }

  // 7-day limit
  if (usage.seven_day?.utilization != null) {
    parts.push(formatUsagePercent(usage.seven_day.utilization, '7d'));
  }

  if (parts.length > 0) {
    lines.push(`## Usage Limits`);
    lines.push(`- ${parts.join(' | ')}`);
    lines.push(``);
  }

  return lines;
}

/**
 * Build rules section
 * @param {Object} params
 * @param {string} [params.devRulesPath] - Path to dev rules
 * @param {string} [params.catalogScript] - Path to catalog script
 * @param {string} [params.skillsVenv] - Path to skills venv
 * @returns {string[]} Lines for rules section
 */
function buildRulesSection({ devRulesPath, catalogScript, skillsVenv }) {
  const lines = [`## Rules`];

  if (devRulesPath) {
    lines.push(`- Read and follow development rules: "${devRulesPath}"`);
  }

  lines.push(`- Markdown files are organized in: Plans → "plans/" directory, Docs → "docs/" directory`);
  lines.push(`- **IMPORTANT:** DO NOT create markdown files out of "plans/" or "docs/" directories UNLESS the user explicitly requests it.`);

  if (catalogScript) {
    lines.push(`- Activate skills: Run \`python ${catalogScript} --skills\` to generate a skills catalog and analyze it, then activate the relevant skills that are needed for the task during the process.`);
    lines.push(`- Execute commands: Run \`python ${catalogScript} --commands\` to generate a commands catalog and analyze it, then execute the relevant SlashCommands that are needed for the task during the process.`);
  }

  if (skillsVenv) {
    lines.push(`- Python scripts in .claude/skills/: Use \`${skillsVenv}\``);
  }

  lines.push(`- When skills' scripts are failed to execute, always fix them and run again, repeat until success.`);
  lines.push(`- Follow **YAGNI (You Aren't Gonna Need It) - KISS (Keep It Simple, Stupid) - DRY (Don't Repeat Yourself)** principles`);
  lines.push(`- Sacrifice grammar for the sake of concision when writing reports.`);
  lines.push(`- In reports, list any unresolved questions at the end, if any.`);
  lines.push(`- IMPORTANT: Ensure token consumption efficiency while maintaining high quality.`);
  lines.push(``);

  return lines;
}

/**
 * Build modularization section
 * @returns {string[]} Lines for modularization section
 */
function buildModularizationSection() {
  return [
    `## **[IMPORTANT] Consider Modularization:**`,
    `- Check existing modules before creating new`,
    `- Analyze logical separation boundaries (functions, classes, concerns)`,
    `- Prefer kebab-case for JS/TS/Python/shell; respect language conventions (C#/Java use PascalCase, Go/Rust use snake_case)`,
    `- Write descriptive code comments`,
    `- After modularization, continue with main task`,
    `- When not to modularize: Markdown files, plain text files, bash scripts, configuration files, environment variables files, etc.`,
    ``
  ];
}

/**
 * Build paths section
 * @param {Object} params
 * @param {string} params.reportsPath - Reports path
 * @param {string} params.plansPath - Plans path
 * @param {string} params.docsPath - Docs path
 * @param {number} [params.docsMaxLoc=800] - Max lines of code for docs
 * @returns {string[]} Lines for paths section
 */
function buildPathsSection({ reportsPath, plansPath, docsPath, docsMaxLoc = 800 }) {
  return [
    `## Paths`,
    `Reports: ${reportsPath} | Plans: ${plansPath}/ | Docs: ${docsPath}/ | docs.maxLoc: ${docsMaxLoc}`,
    ``
  ];
}

/**
 * Build plan context section
 * @param {Object} params
 * @param {string} params.planLine - Plan status line
 * @param {string} params.reportsPath - Reports path
 * @param {string} [params.gitBranch] - Git branch
 * @param {string} params.validationMode - Validation mode
 * @param {number} params.validationMin - Min questions
 * @param {number} params.validationMax - Max questions
 * @returns {string[]} Lines for plan context section
 */
function buildPlanContextSection({ planLine, reportsPath, gitBranch, validationMode, validationMin, validationMax }) {
  const lines = [
    `## Plan Context`,
    planLine,
    `- Reports: ${reportsPath}`
  ];

  if (gitBranch) {
    lines.push(`- Branch: ${gitBranch}`);
  }

  lines.push(`- Validation: mode=${validationMode}, questions=${validationMin}-${validationMax}`);
  lines.push(``);

  return lines;
}

/**
 * Build naming section
 * @param {Object} params
 * @param {string} params.reportsPath - Reports path
 * @param {string} params.plansPath - Plans path
 * @param {string} params.namePattern - Naming pattern
 * @returns {string[]} Lines for naming section
 */
function buildNamingSection({ reportsPath, plansPath, namePattern }) {
  return [
    `## Naming`,
    `- Report: \`${reportsPath}{type}-${namePattern}.md\``,
    `- Plan dir: \`${plansPath}/${namePattern}/\``,
    `- Replace \`{type}\` with: agent name, report type, or context`,
    `- Replace \`{slug}\` in pattern with: descriptive-kebab-slug`
  ];
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN ENTRY POINTS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Build full reminder content from all sections
 * @param {Object} params - All parameters for building reminder
 * @returns {string[]} Array of lines
 */
function buildReminder(params) {
  const {
    sessionId,
    thinkingLanguage,
    responseLanguage,
    devRulesPath,
    catalogScript,
    skillsVenv,
    reportsPath,
    plansPath,
    docsPath,
    docsMaxLoc,
    planLine,
    gitBranch,
    namePattern,
    validationMode,
    validationMin,
    validationMax,
    staticEnv,
    hooks
  } = params;

  // Respect hooks config — skip sections when their corresponding hook is disabled
  const hooksConfig = hooks || {};
  const contextEnabled = hooksConfig['context-tracking'] !== false;
  const usageEnabled = hooksConfig['usage-context-awareness'] !== false;

  return [
    ...buildLanguageSection({ thinkingLanguage, responseLanguage }),
    ...buildSessionSection(staticEnv),
    ...(contextEnabled ? buildContextSection(sessionId) : []),
    ...(usageEnabled ? buildUsageSection() : []),
    ...buildRulesSection({ devRulesPath, catalogScript, skillsVenv }),
    ...buildModularizationSection(),
    ...buildPathsSection({ reportsPath, plansPath, docsPath, docsMaxLoc }),
    ...buildPlanContextSection({ planLine, reportsPath, gitBranch, validationMode, validationMin, validationMax }),
    ...buildNamingSection({ reportsPath, plansPath, namePattern })
  ];
}

/**
 * Build complete reminder context (unified entry point for plugins)
 *
 * @param {Object} [params]
 * @param {string} [params.sessionId] - Session ID
 * @param {Object} [params.config] - CK config (auto-loaded if not provided)
 * @param {Object} [params.staticEnv] - Pre-computed static environment info
 * @param {string} [params.configDirName='.claude'] - Config directory name
 * @param {string} [params.baseDir] - Base directory for absolute path resolution (Issue #327)
 * @returns {{
 *   content: string,
 *   lines: string[],
 *   sections: Object
 * }}
 */
function buildReminderContext({ sessionId, config, staticEnv, configDirName = '.claude', baseDir } = {}) {
  // Load config if not provided
  const cfg = config || loadConfig({ includeProject: false, includeAssertions: false });

  // Resolve paths
  const devRulesPath = resolveRulesPath('development-rules.md', configDirName);
  const catalogScript = resolveScriptPath('generate_catalogs.py', configDirName);
  const skillsVenv = resolveSkillsVenv(configDirName);

  // Build plan context
  const planCtx = buildPlanContext(sessionId, cfg);

  // Issue #327: Use baseDir for absolute path resolution (subdirectory workflow support)
  // If baseDir provided, resolve paths as absolute; otherwise use relative paths
  const effectiveBaseDir = baseDir || null;
  const plansPathRel = normalizePath(cfg.paths?.plans) || 'plans';
  const docsPathRel = normalizePath(cfg.paths?.docs) || 'docs';

  // Build all parameters with absolute paths if baseDir provided
  const params = {
    sessionId,
    thinkingLanguage: cfg.locale?.thinkingLanguage,
    responseLanguage: cfg.locale?.responseLanguage,
    devRulesPath,
    catalogScript,
    skillsVenv,
    reportsPath: effectiveBaseDir ? path.join(effectiveBaseDir, planCtx.reportsPath) : planCtx.reportsPath,
    plansPath: effectiveBaseDir ? path.join(effectiveBaseDir, plansPathRel) : plansPathRel,
    docsPath: effectiveBaseDir ? path.join(effectiveBaseDir, docsPathRel) : docsPathRel,
    docsMaxLoc: Math.max(1, parseInt(cfg.docs?.maxLoc, 10) || 800),
    planLine: planCtx.planLine,
    gitBranch: planCtx.gitBranch,
    namePattern: planCtx.namePattern,
    validationMode: planCtx.validationMode,
    validationMin: planCtx.validationMin,
    validationMax: planCtx.validationMax,
    staticEnv,
    hooks: cfg.hooks
  };

  const lines = buildReminder(params);

  // Respect hooks config for sections object too
  const hooksConfig = cfg.hooks || {};
  const contextEnabled = hooksConfig['context-tracking'] !== false;
  const usageEnabled = hooksConfig['usage-context-awareness'] !== false;

  return {
    content: lines.join('\n'),
    lines,
    sections: {
      language: buildLanguageSection({ thinkingLanguage: params.thinkingLanguage, responseLanguage: params.responseLanguage }),
      session: buildSessionSection(staticEnv),
      context: contextEnabled ? buildContextSection(sessionId) : [],
      usage: usageEnabled ? buildUsageSection() : [],
      rules: buildRulesSection({ devRulesPath, catalogScript, skillsVenv }),
      modularization: buildModularizationSection(),
      paths: buildPathsSection({ reportsPath: params.reportsPath, plansPath: params.plansPath, docsPath: params.docsPath, docsMaxLoc: params.docsMaxLoc }),
      planContext: buildPlanContextSection(planCtx),
      naming: buildNamingSection({ reportsPath: params.reportsPath, plansPath: params.plansPath, namePattern: params.namePattern })
    }
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════

module.exports = {
  // Main entry points
  buildReminderContext,
  buildReminder,

  // Section builders
  buildLanguageSection,
  buildSessionSection,
  buildContextSection,
  buildUsageSection,
  buildRulesSection,
  buildModularizationSection,
  buildPathsSection,
  buildPlanContextSection,
  buildNamingSection,

  // Helpers
  execSafe,
  resolveRulesPath,
  resolveScriptPath,
  resolveSkillsVenv,
  buildPlanContext,
  wasRecentlyInjected,

  // Backward compat alias
  resolveWorkflowPath: resolveRulesPath
};
