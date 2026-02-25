#!/usr/bin/env node
/**
 * SessionStart Hook - Initializes session environment with project detection
 *
 * Fires: Once per session (startup, resume, clear, compact)
 * Purpose: Load config, detect project info, persist to env vars, output context
 *
 * Exit Codes:
 *   0 - Success (non-blocking, allows continuation)
 *
 * Core detection logic extracted to lib/project-detector.cjs for OpenCode plugin reuse.
 */

const fs = require('fs');
const path = require('path');
const {
  loadConfig,
  writeEnv,
  writeSessionState,
  resolvePlanPath,
  getReportsPath,
  resolveNamingPattern,
  extractTaskListId,
  isHookEnabled
} = require('./lib/ck-config-utils.cjs');

// Early exit if hook disabled in config
if (!isHookEnabled('session-init')) {
  process.exit(0);
}

// Import shared project detection logic
const {
  detectProjectType,
  detectPackageManager,
  detectFramework,
  getPythonVersion,
  getGitRemoteUrl,
  getGitBranch,
  getCodingLevelStyleName,
  getCodingLevelGuidelines,
  buildContextOutput,
  execSafe
} = require('./lib/project-detector.cjs');

/**
 * One-time cleanup for orphaned .shadowed/ directories from skill-dedup hook (Issue #422)
 * The hook was disabled due to race conditions; this restores any orphaned skills.
 */
function cleanupOrphanedShadowedSkills() {
  const shadowedDir = path.join(process.cwd(), '.claude', 'skills', '.shadowed');
  if (!fs.existsSync(shadowedDir)) return { restored: [], skipped: [], kept: [] };

  const skillsDir = path.join(process.cwd(), '.claude', 'skills');
  const restored = [];
  const skipped = [];
  const kept = []; // Skills kept for manual review (content differs)

  try {
    const entries = fs.readdirSync(shadowedDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const src = path.join(shadowedDir, entry.name);
      const dest = path.join(skillsDir, entry.name);

      try {
        if (!fs.existsSync(dest)) {
          fs.renameSync(src, dest);
          restored.push(entry.name);
        } else {
          // Skill exists in local - verify content match before deleting orphaned copy
          const orphanedSkill = path.join(src, 'SKILL.md');
          const localSkill = path.join(dest, 'SKILL.md');
          if (fs.existsSync(orphanedSkill) && fs.existsSync(localSkill)) {
            const orphanedContent = fs.readFileSync(orphanedSkill, 'utf8');
            const localContent = fs.readFileSync(localSkill, 'utf8');
            if (orphanedContent === localContent) {
              // Content identical - safe to remove orphaned duplicate
              fs.rmSync(src, { recursive: true, force: true });
              skipped.push(entry.name);
            } else {
              // Content differs - user may have edited orphaned version, keep for review
              kept.push(entry.name);
            }
          } else {
            // Missing SKILL.md - safe to remove orphaned copy
            fs.rmSync(src, { recursive: true, force: true });
            skipped.push(entry.name);
          }
        }
      } catch (err) {
        process.stderr.write(`[session-init] Failed to process "${entry.name}": ${err.message}\n`);
      }
    }
    // Clean up manifest and shadowed dir if empty
    const manifestFile = path.join(shadowedDir, '.dedup-manifest.json');
    if (fs.existsSync(manifestFile)) fs.unlinkSync(manifestFile);
    // Only remove shadowed dir if empty (kept skills may remain)
    const remaining = fs.readdirSync(shadowedDir);
    if (remaining.length === 0) fs.rmdirSync(shadowedDir);
    return { restored, skipped, kept };
  } catch (err) {
    process.stderr.write(`[session-init] Shadowed cleanup error: ${err.message}\n`);
    return { restored, skipped, kept };
  }
}

/**
 * Main hook execution
 */
async function main() {
  try {
    // Issue #422: One-time cleanup of orphaned .shadowed/ from disabled skill-dedup hook
    const shadowedCleanup = cleanupOrphanedShadowedSkills();

    const stdin = fs.readFileSync(0, 'utf-8').trim();
    const data = stdin ? JSON.parse(stdin) : {};
    const envFile = process.env.CLAUDE_ENV_FILE;
    const source = data.source || 'unknown';
    const sessionId = data.session_id || null;

    const config = loadConfig();

    const detections = {
      type: detectProjectType(config.project?.type),
      pm: detectPackageManager(config.project?.packageManager),
      framework: detectFramework(config.project?.framework)
    };

    // Resolve plan - now returns { path, resolvedBy }
    const resolved = resolvePlanPath(null, config);

    // CRITICAL FIX: Only persist explicitly-set plans to session state
    // Branch-matched plans are "suggested" - stored separately, not as activePlan
    // This prevents stale plan pollution on fresh sessions
    if (sessionId) {
      writeSessionState(sessionId, {
        sessionOrigin: process.cwd(),
        // Only session-resolved plans are truly "active"
        activePlan: resolved.resolvedBy === 'session' ? resolved.path : null,
        // Track suggested plan separately (for UI hints, not for report paths)
        suggestedPlan: resolved.resolvedBy === 'branch' ? resolved.path : null,
        timestamp: Date.now(),
        source
      });
    }

    // Reports path only uses active plans, not suggested ones
    const reportsPath = getReportsPath(resolved.path, resolved.resolvedBy, config.plan, config.paths);

    // Extract task list ID for Claude Code Tasks coordination (shared helper)
    const taskListId = extractTaskListId(resolved);

    // Collect static environment info (computed once per session)
    const staticEnv = {
      nodeVersion: process.version,
      pythonVersion: getPythonVersion(),
      osPlatform: process.platform,
      gitUrl: getGitRemoteUrl(),
      gitBranch: getGitBranch(),
      gitRoot: execSafe('git rev-parse --show-toplevel'),
      user: process.env.USERNAME || process.env.USER || process.env.LOGNAME || os.userInfo().username,
      locale: process.env.LANG || '',
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      claudeSettingsDir: path.resolve(__dirname, '..')
    };

    // Compute base directory for absolute paths (Issue #327: use CWD for subdirectory support)
    // Git root is kept in staticEnv for reference, but CWD determines where files are created
    const baseDir = process.cwd();

    // Compute resolved naming pattern (date + issue resolved, {slug} kept as placeholder)
    const namePattern = resolveNamingPattern(config.plan, staticEnv.gitBranch);

    if (envFile) {
      // Session & plan config
      writeEnv(envFile, 'CK_SESSION_ID', sessionId || '');
      writeEnv(envFile, 'CK_PLAN_NAMING_FORMAT', config.plan.namingFormat);
      writeEnv(envFile, 'CK_PLAN_DATE_FORMAT', config.plan.dateFormat);
      writeEnv(envFile, 'CK_PLAN_ISSUE_PREFIX', config.plan.issuePrefix || '');
      writeEnv(envFile, 'CK_PLAN_REPORTS_DIR', config.plan.reportsDir);

      // NEW: Resolved naming pattern for DRY file naming in agents
      // Example: "251212-1830-GH-88-{slug}" or "251212-1830-{slug}"
      // Agents use: `{agent-type}-$CK_NAME_PATTERN.md` and substitute {slug}
      writeEnv(envFile, 'CK_NAME_PATTERN', namePattern);

      // Plan resolution
      writeEnv(envFile, 'CK_ACTIVE_PLAN', resolved.resolvedBy === 'session' ? resolved.path : '');
      writeEnv(envFile, 'CK_SUGGESTED_PLAN', resolved.resolvedBy === 'branch' ? resolved.path : '');

      // Claude Code Tasks integration - enables multi-session/subagent coordination
      // Task list ID = plan directory name (shared across all sessions working on same plan)
      if (taskListId) {
        writeEnv(envFile, 'CLAUDE_CODE_TASK_LIST_ID', taskListId);
      }

      // Paths - use absolute paths based on CWD for subdirectory workflow support (Issue #327)
      writeEnv(envFile, 'CK_GIT_ROOT', staticEnv.gitRoot || '');
      writeEnv(envFile, 'CK_REPORTS_PATH', path.join(baseDir, reportsPath));
      writeEnv(envFile, 'CK_DOCS_PATH', path.join(baseDir, config.paths.docs));
      writeEnv(envFile, 'CK_PLANS_PATH', path.join(baseDir, config.paths.plans));
      writeEnv(envFile, 'CK_PROJECT_ROOT', process.cwd());

      // Project detection
      writeEnv(envFile, 'CK_PROJECT_TYPE', detections.type || '');
      writeEnv(envFile, 'CK_PACKAGE_MANAGER', detections.pm || '');
      writeEnv(envFile, 'CK_FRAMEWORK', detections.framework || '');

      // NEW: Static environment info (so other hooks don't need to recompute)
      writeEnv(envFile, 'CK_NODE_VERSION', staticEnv.nodeVersion);
      writeEnv(envFile, 'CK_PYTHON_VERSION', staticEnv.pythonVersion || '');
      writeEnv(envFile, 'CK_OS_PLATFORM', staticEnv.osPlatform);
      writeEnv(envFile, 'CK_GIT_URL', staticEnv.gitUrl || '');
      writeEnv(envFile, 'CK_GIT_BRANCH', staticEnv.gitBranch || '');
      writeEnv(envFile, 'CK_USER', staticEnv.user);
      writeEnv(envFile, 'CK_LOCALE', staticEnv.locale);
      writeEnv(envFile, 'CK_TIMEZONE', staticEnv.timezone);
      writeEnv(envFile, 'CK_CLAUDE_SETTINGS_DIR', staticEnv.claudeSettingsDir);

      // Locale config
      if (config.locale?.thinkingLanguage) {
        writeEnv(envFile, 'CK_THINKING_LANGUAGE', config.locale.thinkingLanguage);
      }
      if (config.locale?.responseLanguage) {
        writeEnv(envFile, 'CK_RESPONSE_LANGUAGE', config.locale.responseLanguage);
      }

      // Plan validation config (for /plan:validate, /plan:hard, /plan:parallel)
      const validation = config.plan?.validation || {};
      writeEnv(envFile, 'CK_VALIDATION_MODE', validation.mode || 'prompt');
      writeEnv(envFile, 'CK_VALIDATION_MIN_QUESTIONS', validation.minQuestions || 3);
      writeEnv(envFile, 'CK_VALIDATION_MAX_QUESTIONS', validation.maxQuestions || 8);
      writeEnv(envFile, 'CK_VALIDATION_FOCUS_AREAS', (validation.focusAreas || ['assumptions', 'risks', 'tradeoffs', 'architecture']).join(','));

      // Coding level config (for output style selection)
      const codingLevel = config.codingLevel ?? 5;
      writeEnv(envFile, 'CK_CODING_LEVEL', codingLevel);
      writeEnv(envFile, 'CK_CODING_LEVEL_STYLE', getCodingLevelStyleName(codingLevel));
    }

    console.log(`Session ${source}. ${buildContextOutput(config, detections, resolved, staticEnv.gitRoot)}`);

    // Issue #422: Notify user if orphaned skills were recovered from .shadowed/
    const hasCleanup = shadowedCleanup.restored.length > 0 || shadowedCleanup.skipped.length > 0 || shadowedCleanup.kept.length > 0;
    if (hasCleanup) {
      console.log(`\n[!] SKILL-DEDUP CLEANUP (Issue #422):`);
      console.log(`Recovered orphaned .shadowed/ directory from disabled skill-dedup hook.`);
      if (shadowedCleanup.restored.length > 0) {
        console.log(`Restored ${shadowedCleanup.restored.length} skill(s): ${shadowedCleanup.restored.join(', ')}`);
      }
      if (shadowedCleanup.skipped.length > 0) {
        console.log(`Removed ${shadowedCleanup.skipped.length} duplicate(s): ${shadowedCleanup.skipped.join(', ')}`);
      }
      if (shadowedCleanup.kept.length > 0) {
        console.log(`[!] Kept ${shadowedCleanup.kept.length} skill(s) for manual review (content differs): ${shadowedCleanup.kept.join(', ')}`);
        console.log(`    Review .claude/skills/.shadowed/ and merge changes manually.`);
      }
    }

    // Info: Show git root when running from subdirectory (Issue #327: now supported)
    if (staticEnv.gitRoot && staticEnv.gitRoot !== process.cwd()) {
      console.log(`📁 Subdirectory mode: Plans/docs will be created in current directory`);
      console.log(`   Git root: ${staticEnv.gitRoot}`);
    }

    // MITIGATION: Issue #277 - Auto-compact can bypass AskUserQuestion approval gates
    // When context is compacted mid-workflow, the summarization may lose "pending approval" state.
    // This warning reminds Claude to verify if user approval was pending before proceeding.
    // Upstream bug: Claude Code CLI should preserve pending interactive state during compaction.
    if (source === 'compact') {
      console.log(`\n⚠️ CONTEXT COMPACTED - APPROVAL STATE CHECK:`);
      console.log(`If you were waiting for user approval via AskUserQuestion (e.g., Step 4 review gate),`);
      console.log(`you MUST re-confirm with the user before proceeding. Do NOT assume approval was given.`);
      console.log(`Use AskUserQuestion to verify: "Context was compacted. Please confirm approval to continue."`);
    }

    // Auto-inject coding level guidelines (if not disabled)
    const codingLevel = config.codingLevel ?? -1;
    const guidelines = getCodingLevelGuidelines(codingLevel);
    if (guidelines) {
      console.log(`\n${guidelines}`);
    }

    if (config.assertions?.length > 0) {
      console.log(`\nUser Assertions:`);
      config.assertions.forEach((assertion, i) => {
        console.log(`  ${i + 1}. ${assertion}`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error(`SessionStart hook error: ${error.message}`);
    process.exit(0);
  }
}

main();
