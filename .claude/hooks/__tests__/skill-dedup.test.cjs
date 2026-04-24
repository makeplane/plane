#!/usr/bin/env node
/**
 * Tests for skill-dedup.cjs hook
 * Run: node --test .claude/hooks/__tests__/skill-dedup.test.cjs
 *
 * Uses real temp directories (no mocks) to test actual filesystem behavior.
 */

const { describe, it, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

const {
  listSkillNames,
  findOverlaps,
  resolvePaths,
  handleSessionStart,
  handleSessionEnd,
  doShadow,
  restoreOrphanedSkills,
  cleanupShadowedDir,
  SKIP_DIRS
} = require('../skill-dedup.cjs');

// -- Test helpers ------------------------------------------------------------

/** Create a temp directory structure for testing */
function createTestEnv() {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'skill-dedup-test-'));
  const globalDir = path.join(tmpDir, 'global-skills');
  const localDir = path.join(tmpDir, 'local-skills');
  fs.mkdirSync(globalDir, { recursive: true });
  fs.mkdirSync(localDir, { recursive: true });
  return { tmpDir, paths: resolvePaths(globalDir, localDir) };
}

/** Create a valid skill directory with SKILL.md */
function createSkill(skillsRoot, name, content) {
  const dir = path.join(skillsRoot, name);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, 'SKILL.md'), content || `# ${name}`);
  return dir;
}

/** Check if a skill directory exists in a given root */
function skillExists(skillsRoot, name) {
  return fs.existsSync(path.join(skillsRoot, name, 'SKILL.md'));
}

/** Remove temp dir recursively */
function cleanup(tmpDir) {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}

// -- Unit Tests: listSkillNames ----------------------------------------------

describe('listSkillNames', () => {
  let tmpDir, globalDir;

  beforeEach(() => {
    const env = createTestEnv();
    tmpDir = env.tmpDir;
    globalDir = env.paths.globalDir;
  });

  afterEach(() => cleanup(tmpDir));

  it('returns empty array for non-existent directory', () => {
    assert.deepStrictEqual(listSkillNames('/nonexistent/path'), []);
  });

  it('returns empty array for empty directory', () => {
    assert.deepStrictEqual(listSkillNames(globalDir), []);
  });

  it('returns skill names that have SKILL.md', () => {
    createSkill(globalDir, 'cook');
    createSkill(globalDir, 'brainstorm');
    const result = listSkillNames(globalDir);
    assert.deepStrictEqual(result.sort(), ['brainstorm', 'cook']);
  });

  it('ignores directories without SKILL.md', () => {
    createSkill(globalDir, 'valid-skill');
    fs.mkdirSync(path.join(globalDir, 'no-skill-md'));
    const result = listSkillNames(globalDir);
    assert.deepStrictEqual(result, ['valid-skill']);
  });

  it('ignores infrastructure directories (.venv, node_modules, etc.)', () => {
    createSkill(globalDir, 'real-skill');
    for (const skip of ['.shadowed', '.venv', 'node_modules', '__pycache__']) {
      const dir = path.join(globalDir, skip);
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, 'SKILL.md'), '# skip');
    }
    const result = listSkillNames(globalDir);
    assert.deepStrictEqual(result, ['real-skill']);
  });

  it('handles files (not directories) gracefully', () => {
    createSkill(globalDir, 'real-skill');
    fs.writeFileSync(path.join(globalDir, 'not-a-dir.txt'), 'test');
    const result = listSkillNames(globalDir);
    assert.deepStrictEqual(result, ['real-skill']);
  });
});

// -- Unit Tests: findOverlaps ------------------------------------------------

describe('findOverlaps', () => {
  it('returns empty array when no overlaps', () => {
    assert.deepStrictEqual(findOverlaps(['a', 'b'], ['c', 'd']), []);
  });

  it('finds overlapping names', () => {
    assert.deepStrictEqual(
      findOverlaps(['cook', 'brainstorm', 'git'], ['cook', 'seo', 'brainstorm']),
      ['cook', 'brainstorm']
    );
  });

  it('returns empty array when global is empty', () => {
    assert.deepStrictEqual(findOverlaps([], ['cook']), []);
  });

  it('returns empty array when local is empty', () => {
    assert.deepStrictEqual(findOverlaps(['cook'], []), []);
  });

  it('handles identical lists', () => {
    assert.deepStrictEqual(findOverlaps(['a', 'b'], ['a', 'b']), ['a', 'b']);
  });
});

// -- Unit Tests: resolvePaths ------------------------------------------------

describe('resolvePaths', () => {
  it('computes shadowed dir and manifest paths correctly', () => {
    const result = resolvePaths('/global', '/local');
    assert.strictEqual(result.globalDir, '/global');
    assert.strictEqual(result.localDir, '/local');
    assert.strictEqual(result.shadowedDir, '/local/.shadowed');
    assert.strictEqual(result.manifestFile, '/local/.shadowed/.dedup-manifest.json');
  });
});

// -- Unit Tests: SKIP_DIRS ---------------------------------------------------

describe('SKIP_DIRS', () => {
  it('contains expected infrastructure directories', () => {
    assert.ok(SKIP_DIRS.has('.shadowed'));
    assert.ok(SKIP_DIRS.has('.venv'));
    assert.ok(SKIP_DIRS.has('node_modules'));
    assert.ok(SKIP_DIRS.has('__pycache__'));
  });

  it('does not contain regular skill names', () => {
    assert.ok(!SKIP_DIRS.has('cook'));
    assert.ok(!SKIP_DIRS.has('brainstorm'));
  });
});

// -- Integration Tests: handleSessionStart -----------------------------------

describe('handleSessionStart', () => {
  let tmpDir, paths;

  beforeEach(() => {
    const env = createTestEnv();
    tmpDir = env.tmpDir;
    paths = env.paths;
  });

  afterEach(() => cleanup(tmpDir));

  it('does nothing when no global skills exist', () => {
    createSkill(paths.localDir, 'cook');
    const result = handleSessionStart(paths);
    assert.deepStrictEqual(result.shadowed, []);
    assert.ok(skillExists(paths.localDir, 'cook'));
  });

  it('does nothing when no local skills exist', () => {
    createSkill(paths.globalDir, 'cook');
    const result = handleSessionStart(paths);
    assert.deepStrictEqual(result.shadowed, []);
  });

  it('does nothing when no overlaps', () => {
    createSkill(paths.globalDir, 'engineer-only');
    createSkill(paths.localDir, 'marketing-only');
    const result = handleSessionStart(paths);
    assert.deepStrictEqual(result.shadowed, []);
    assert.ok(skillExists(paths.localDir, 'marketing-only'));
  });

  it('shadows overlapping local skills', () => {
    createSkill(paths.globalDir, 'cook', '# Cook v2.1.1 (engineer)');
    createSkill(paths.globalDir, 'brainstorm', '# Brainstorm (engineer)');
    createSkill(paths.localDir, 'cook', '# Cook v2.0.0 (marketing)');
    createSkill(paths.localDir, 'brainstorm', '# Brainstorm (marketing)');
    createSkill(paths.localDir, 'seo', '# SEO (marketing only)');

    const result = handleSessionStart(paths);

    // Overlapping skills moved to .shadowed
    assert.deepStrictEqual(result.shadowed.sort(), ['brainstorm', 'cook']);
    assert.ok(!skillExists(paths.localDir, 'cook'));
    assert.ok(!skillExists(paths.localDir, 'brainstorm'));
    assert.ok(skillExists(paths.shadowedDir, 'cook'));
    assert.ok(skillExists(paths.shadowedDir, 'brainstorm'));

    // Non-overlapping skill untouched
    assert.ok(skillExists(paths.localDir, 'seo'));
  });

  it('writes a manifest file with shadowed skill names', () => {
    createSkill(paths.globalDir, 'cook');
    createSkill(paths.localDir, 'cook');

    handleSessionStart(paths);

    assert.ok(fs.existsSync(paths.manifestFile));
    const manifest = JSON.parse(fs.readFileSync(paths.manifestFile, 'utf8'));
    assert.deepStrictEqual(manifest.skills, ['cook']);
    assert.ok(manifest.shadowedAt);
    assert.strictEqual(manifest.globalDir, paths.globalDir);
    assert.strictEqual(manifest.localDir, paths.localDir);
  });

  it('recovers from crashed previous session before shadowing', () => {
    // Simulate crashed session: .shadowed exists with orphaned skill
    createSkill(paths.globalDir, 'cook');
    createSkill(paths.localDir, 'seo');
    fs.mkdirSync(paths.shadowedDir, { recursive: true });
    createSkill(paths.shadowedDir, 'cook', '# Cook orphaned');

    const result = handleSessionStart(paths);

    // Should have restored cook first, then re-shadowed it
    assert.ok(skillExists(paths.shadowedDir, 'cook'));
    assert.ok(!skillExists(paths.localDir, 'cook'));
  });
});

// -- Integration Tests: handleSessionEnd -------------------------------------

describe('handleSessionEnd', () => {
  let tmpDir, paths;

  beforeEach(() => {
    const env = createTestEnv();
    tmpDir = env.tmpDir;
    paths = env.paths;
  });

  afterEach(() => cleanup(tmpDir));

  it('does nothing when no .shadowed directory exists', () => {
    const result = handleSessionEnd(paths);
    assert.deepStrictEqual(result.restored, []);
  });

  it('restores shadowed skills from manifest', () => {
    // Simulate state after SessionStart
    createSkill(paths.localDir, 'seo');
    fs.mkdirSync(paths.shadowedDir, { recursive: true });
    createSkill(paths.shadowedDir, 'cook', '# Cook (marketing)');
    createSkill(paths.shadowedDir, 'brainstorm', '# Brainstorm (marketing)');
    fs.writeFileSync(paths.manifestFile, JSON.stringify({
      shadowedAt: new Date().toISOString(),
      skills: ['cook', 'brainstorm']
    }));

    const result = handleSessionEnd(paths);

    assert.deepStrictEqual(result.restored.sort(), ['brainstorm', 'cook']);
    assert.ok(skillExists(paths.localDir, 'cook'));
    assert.ok(skillExists(paths.localDir, 'brainstorm'));
    assert.ok(skillExists(paths.localDir, 'seo'));
    assert.ok(!fs.existsSync(paths.shadowedDir));
  });

  it('cleans up .shadowed directory after restore', () => {
    fs.mkdirSync(paths.shadowedDir, { recursive: true });
    createSkill(paths.shadowedDir, 'cook');
    fs.writeFileSync(paths.manifestFile, JSON.stringify({ skills: ['cook'] }));

    handleSessionEnd(paths);

    assert.ok(!fs.existsSync(paths.shadowedDir));
    assert.ok(!fs.existsSync(paths.manifestFile));
  });

  it('handles corrupt manifest by restoring orphaned skills', () => {
    fs.mkdirSync(paths.shadowedDir, { recursive: true });
    createSkill(paths.shadowedDir, 'cook');
    fs.writeFileSync(paths.manifestFile, 'NOT VALID JSON!!!');

    const result = handleSessionEnd(paths);

    assert.deepStrictEqual(result.restored, ['cook']);
    assert.ok(skillExists(paths.localDir, 'cook'));
    assert.ok(!fs.existsSync(paths.shadowedDir));
  });

  it('handles orphaned .shadowed dir without manifest', () => {
    fs.mkdirSync(paths.shadowedDir, { recursive: true });
    createSkill(paths.shadowedDir, 'cook');
    createSkill(paths.shadowedDir, 'brainstorm');
    // No manifest file

    const result = handleSessionEnd(paths);

    assert.deepStrictEqual(result.restored.sort(), ['brainstorm', 'cook']);
    assert.ok(skillExists(paths.localDir, 'cook'));
    assert.ok(skillExists(paths.localDir, 'brainstorm'));
    assert.ok(!fs.existsSync(paths.shadowedDir));
  });

  it('skips restore if local skill already exists (no overwrite)', () => {
    createSkill(paths.localDir, 'cook', '# Cook local version');
    fs.mkdirSync(paths.shadowedDir, { recursive: true });
    createSkill(paths.shadowedDir, 'cook', '# Cook shadowed version');
    fs.writeFileSync(paths.manifestFile, JSON.stringify({ skills: ['cook'] }));

    const result = handleSessionEnd(paths);

    // Should not overwrite existing local
    assert.deepStrictEqual(result.restored, []);
    // Local version preserved
    const content = fs.readFileSync(path.join(paths.localDir, 'cook', 'SKILL.md'), 'utf8');
    assert.strictEqual(content, '# Cook local version');
  });
});

// -- Integration Tests: Full Cycle -------------------------------------------

describe('full session cycle', () => {
  let tmpDir, paths;

  beforeEach(() => {
    const env = createTestEnv();
    tmpDir = env.tmpDir;
    paths = env.paths;
  });

  afterEach(() => cleanup(tmpDir));

  it('SessionStart -> SessionEnd restores original state', () => {
    // Setup: global engineer + local marketing with overlaps
    createSkill(paths.globalDir, 'cook', '# Cook v2.1.1');
    createSkill(paths.globalDir, 'brainstorm', '# Brainstorm v2.0.0');
    createSkill(paths.globalDir, 'git', '# Git v1.0.0');
    createSkill(paths.localDir, 'cook', '# Cook v2.0.0');
    createSkill(paths.localDir, 'brainstorm', '# Brainstorm v2.0.0');
    createSkill(paths.localDir, 'seo', '# SEO marketing-only');

    // --- SessionStart ---
    const startResult = handleSessionStart(paths);
    assert.deepStrictEqual(startResult.shadowed.sort(), ['brainstorm', 'cook']);

    // During session: only non-overlapping local + global are visible
    assert.ok(!skillExists(paths.localDir, 'cook'));
    assert.ok(!skillExists(paths.localDir, 'brainstorm'));
    assert.ok(skillExists(paths.localDir, 'seo'));
    assert.ok(skillExists(paths.shadowedDir, 'cook'));
    assert.ok(skillExists(paths.shadowedDir, 'brainstorm'));

    // --- SessionEnd ---
    const endResult = handleSessionEnd(paths);
    assert.deepStrictEqual(endResult.restored.sort(), ['brainstorm', 'cook']);

    // After session: everything back to original
    assert.ok(skillExists(paths.localDir, 'cook'));
    assert.ok(skillExists(paths.localDir, 'brainstorm'));
    assert.ok(skillExists(paths.localDir, 'seo'));
    assert.ok(!fs.existsSync(paths.shadowedDir));

    // Content preserved
    const cookContent = fs.readFileSync(path.join(paths.localDir, 'cook', 'SKILL.md'), 'utf8');
    assert.strictEqual(cookContent, '# Cook v2.0.0');
  });

  it('multiple sessions cycle without corruption', () => {
    createSkill(paths.globalDir, 'cook');
    createSkill(paths.localDir, 'cook');

    // Session 1
    handleSessionStart(paths);
    assert.ok(!skillExists(paths.localDir, 'cook'));
    handleSessionEnd(paths);
    assert.ok(skillExists(paths.localDir, 'cook'));

    // Session 2
    handleSessionStart(paths);
    assert.ok(!skillExists(paths.localDir, 'cook'));
    handleSessionEnd(paths);
    assert.ok(skillExists(paths.localDir, 'cook'));

    // Session 3
    handleSessionStart(paths);
    assert.ok(!skillExists(paths.localDir, 'cook'));
    handleSessionEnd(paths);
    assert.ok(skillExists(paths.localDir, 'cook'));

    // Filesystem clean
    assert.ok(!fs.existsSync(paths.shadowedDir));
  });

  it('handles crash recovery: SessionStart after crashed session', () => {
    createSkill(paths.globalDir, 'cook');
    createSkill(paths.localDir, 'cook', '# Original local');

    // Session 1: start but don't end (simulating crash)
    handleSessionStart(paths);
    assert.ok(skillExists(paths.shadowedDir, 'cook'));

    // Session 2: start should recover from crash first
    handleSessionStart(paths);

    // cook should still be shadowed (recovered then re-shadowed)
    assert.ok(!skillExists(paths.localDir, 'cook'));
    assert.ok(skillExists(paths.shadowedDir, 'cook'));

    // End session 2: everything clean
    handleSessionEnd(paths);
    assert.ok(skillExists(paths.localDir, 'cook'));
    assert.ok(!fs.existsSync(paths.shadowedDir));

    // Content preserved through crash recovery
    const content = fs.readFileSync(path.join(paths.localDir, 'cook', 'SKILL.md'), 'utf8');
    assert.strictEqual(content, '# Original local');
  });

  it('no-op when only global skills installed (no local kit)', () => {
    createSkill(paths.globalDir, 'cook');
    // No local skills dir content

    const result = handleSessionStart(paths);
    assert.deepStrictEqual(result.shadowed, []);
    assert.ok(!fs.existsSync(paths.shadowedDir));
  });

  it('no-op when only local skills installed (no global kit)', () => {
    createSkill(paths.localDir, 'cook');
    // No global skills

    const result = handleSessionStart(paths);
    assert.deepStrictEqual(result.shadowed, []);
  });
});

// -- Edge Cases --------------------------------------------------------------

describe('edge cases', () => {
  let tmpDir, paths;

  beforeEach(() => {
    const env = createTestEnv();
    tmpDir = env.tmpDir;
    paths = env.paths;
  });

  afterEach(() => cleanup(tmpDir));

  it('handles large number of overlapping skills', () => {
    const skillNames = Array.from({ length: 39 }, (_, i) => `skill-${i}`);
    for (const name of skillNames) {
      createSkill(paths.globalDir, name);
      createSkill(paths.localDir, name);
    }

    const startResult = handleSessionStart(paths);
    assert.strictEqual(startResult.shadowed.length, 39);

    const endResult = handleSessionEnd(paths);
    assert.strictEqual(endResult.restored.length, 39);

    // All restored
    for (const name of skillNames) {
      assert.ok(skillExists(paths.localDir, name));
    }
    assert.ok(!fs.existsSync(paths.shadowedDir));
  });

  it('preserves skill directory contents (not just SKILL.md)', () => {
    createSkill(paths.globalDir, 'cook');
    createSkill(paths.localDir, 'cook');
    // Add extra files to local skill
    fs.writeFileSync(path.join(paths.localDir, 'cook', 'README.md'), '# Readme');
    fs.mkdirSync(path.join(paths.localDir, 'cook', 'scripts'));
    fs.writeFileSync(path.join(paths.localDir, 'cook', 'scripts', 'run.sh'), '#!/bin/bash');

    handleSessionStart(paths);
    handleSessionEnd(paths);

    // All files preserved
    assert.ok(fs.existsSync(path.join(paths.localDir, 'cook', 'SKILL.md')));
    assert.ok(fs.existsSync(path.join(paths.localDir, 'cook', 'README.md')));
    assert.ok(fs.existsSync(path.join(paths.localDir, 'cook', 'scripts', 'run.sh')));
  });

  it('handles empty .shadowed directory on SessionEnd', () => {
    fs.mkdirSync(paths.shadowedDir, { recursive: true });
    // Empty .shadowed, no manifest
    const result = handleSessionEnd(paths);
    assert.deepStrictEqual(result.restored, []);
    assert.ok(!fs.existsSync(paths.shadowedDir));
  });

  it('handles manifest referencing skills not in .shadowed', () => {
    fs.mkdirSync(paths.shadowedDir, { recursive: true });
    fs.writeFileSync(paths.manifestFile, JSON.stringify({
      skills: ['cook', 'ghost-skill']
    }));
    createSkill(paths.shadowedDir, 'cook');
    // ghost-skill doesn't exist in .shadowed

    const result = handleSessionEnd(paths);
    assert.deepStrictEqual(result.restored, ['cook']);
    assert.ok(skillExists(paths.localDir, 'cook'));
  });
});
