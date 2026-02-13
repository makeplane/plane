#!/usr/bin/env node
/**
 * Skill Dedup Hook - Prevents local skills from shadowing global versions
 *
 * @deprecated DISABLED in v2.9.1 due to race condition with parallel sessions.
 * See issue #422: concurrent sessions overwrite manifest, orphaning skills.
 * Hook file kept for reference; will be redesigned in future release.
 *
 * Original design:
 *   SessionStart: move overlapping local skills to .claude/skills/.shadowed/
 *   SessionEnd:   restore .shadowed/ skills back to .claude/skills/
 *
 * Problem: Non-atomic file operations + shared manifest = race condition
 * when multiple Claude Code sessions run in the same directory.
 */

const fs = require('fs');
const path = require('path');
const os = require('os');

// Directories to never shadow (internal infrastructure, not real skills)
const SKIP_DIRS = new Set(['.shadowed', '.venv', 'node_modules', '__pycache__']);

// -- Helpers -----------------------------------------------------------------

/**
 * List skill directory names in a given skills root
 * Only returns directories that contain a SKILL.md (valid skills)
 */
function listSkillNames(skillsRoot) {
  if (!fs.existsSync(skillsRoot)) return [];
  try {
    return fs.readdirSync(skillsRoot, { withFileTypes: true })
      .filter(d => d.isDirectory() && !SKIP_DIRS.has(d.name))
      .filter(d => fs.existsSync(path.join(skillsRoot, d.name, 'SKILL.md')))
      .map(d => d.name);
  } catch {
    return [];
  }
}

/**
 * Find overlapping skill names between global and local installations
 */
function findOverlaps(globalSkills, localSkills) {
  const globalSet = new Set(globalSkills);
  return localSkills.filter(name => globalSet.has(name));
}

/**
 * Move a skill directory from source to destination
 */
function moveSkillDir(src, dest) {
  fs.renameSync(src, dest);
}

/**
 * Resolve paths for a given context (injectable for testing)
 */
function resolvePaths(globalDir, localDir) {
  const shadowedDir = path.join(localDir, '.shadowed');
  const manifestFile = path.join(shadowedDir, '.dedup-manifest.json');
  return { globalDir, localDir, shadowedDir, manifestFile };
}

/**
 * Get default paths based on environment
 */
function getDefaultPaths() {
  const globalDir = path.join(os.homedir(), '.claude', 'skills');
  const localDir = path.join(process.cwd(), '.claude', 'skills');
  return resolvePaths(globalDir, localDir);
}

// -- SessionStart: Shadow local duplicates -----------------------------------

function handleSessionStart(paths) {
  const { globalDir, localDir, shadowedDir } = paths;

  const globalSkills = listSkillNames(globalDir);
  const localSkills = listSkillNames(localDir);

  if (globalSkills.length === 0 || localSkills.length === 0) return { shadowed: [] };

  const overlaps = findOverlaps(globalSkills, localSkills);
  if (overlaps.length === 0) return { shadowed: [] };

  // If .shadowed/ already exists from a crashed previous session, restore first
  if (fs.existsSync(shadowedDir)) {
    handleSessionEnd(paths);
    // Re-evaluate overlaps after restoration
    const freshLocal = listSkillNames(localDir);
    const freshOverlaps = findOverlaps(globalSkills, freshLocal);
    if (freshOverlaps.length === 0) return { shadowed: [] };
    return doShadow(freshOverlaps, paths);
  }

  return doShadow(overlaps, paths);
}

function doShadow(overlaps, paths) {
  const { localDir, shadowedDir, manifestFile } = paths;

  // Create .shadowed directory
  fs.mkdirSync(shadowedDir, { recursive: true });

  const shadowed = [];
  for (const name of overlaps) {
    try {
      moveSkillDir(path.join(localDir, name), path.join(shadowedDir, name));
      shadowed.push(name);
    } catch (err) {
      process.stderr.write(`[skill-dedup] Failed to shadow "${name}": ${err.message}\n`);
    }
  }

  if (shadowed.length === 0) return { shadowed: [] };

  // Write manifest so SessionEnd knows what to restore
  const manifest = {
    shadowedAt: new Date().toISOString(),
    skills: shadowed,
    globalDir: paths.globalDir,
    localDir: paths.localDir
  };
  fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2));

  console.log(`Skill dedup: ${shadowed.length} local skill(s) shadowed — global versions active: ${shadowed.join(', ')}`);
  return { shadowed };
}

// -- SessionEnd: Restore shadowed skills -------------------------------------

function handleSessionEnd(paths) {
  const { shadowedDir, manifestFile } = paths;

  if (!fs.existsSync(manifestFile)) {
    if (fs.existsSync(shadowedDir)) {
      return restoreOrphanedSkills(paths);
    }
    return { restored: [] };
  }

  let manifest;
  try {
    manifest = JSON.parse(fs.readFileSync(manifestFile, 'utf8'));
  } catch {
    return restoreOrphanedSkills(paths);
  }

  const restored = [];
  for (const name of manifest.skills || []) {
    try {
      const src = path.join(shadowedDir, name);
      const dest = path.join(paths.localDir, name);
      if (fs.existsSync(src) && !fs.existsSync(dest)) {
        moveSkillDir(src, dest);
        restored.push(name);
      }
    } catch (err) {
      process.stderr.write(`[skill-dedup] Failed to restore "${name}": ${err.message}\n`);
    }
  }

  cleanupShadowedDir(paths);

  if (restored.length > 0) {
    console.log(`Skill dedup: restored ${restored.length} local skill(s): ${restored.join(', ')}`);
  }
  return { restored };
}

/**
 * Restore any skill directories found in .shadowed/ without a manifest
 * Safety net for crashed sessions or corrupt manifests
 */
function restoreOrphanedSkills(paths) {
  const { shadowedDir, localDir } = paths;
  const restored = [];
  try {
    const entries = fs.readdirSync(shadowedDir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory()) {
        const src = path.join(shadowedDir, entry.name);
        const dest = path.join(localDir, entry.name);
        if (fs.existsSync(src) && !fs.existsSync(dest)) {
          moveSkillDir(src, dest);
          restored.push(entry.name);
        }
      }
    }
  } catch {
    // Best effort
  }
  cleanupShadowedDir(paths);
  return { restored };
}

/**
 * Remove the .shadowed directory and manifest
 */
function cleanupShadowedDir(paths) {
  const { shadowedDir, manifestFile } = paths;
  try {
    if (fs.existsSync(manifestFile)) fs.unlinkSync(manifestFile);
    if (fs.existsSync(shadowedDir)) fs.rmdirSync(shadowedDir);
  } catch {
    // Non-fatal: leftover empty dir is harmless
  }
}

// -- Main --------------------------------------------------------------------

function main() {
  try {
    let payload = {};
    try {
      const input = fs.readFileSync('/dev/stdin', 'utf8').trim();
      if (input) payload = JSON.parse(input);
    } catch {
      // No stdin or invalid JSON
    }

    const paths = getDefaultPaths();
    const event = payload.hook_event_name || '';

    if (event === 'SessionEnd' || event === 'Stop') {
      handleSessionEnd(paths);
    } else {
      handleSessionStart(paths);
    }
  } catch (err) {
    process.stderr.write(`[skill-dedup] Error: ${err.message}\n`);
  }

  process.exit(0);
}

// Export for testing
if (require.main === module) {
  main();
}

module.exports = {
  listSkillNames,
  findOverlaps,
  resolvePaths,
  handleSessionStart,
  handleSessionEnd,
  doShadow,
  restoreOrphanedSkills,
  cleanupShadowedDir,
  SKIP_DIRS
};
