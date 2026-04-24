#!/usr/bin/env node
/**
 * broad-pattern-detector.test.cjs - Unit tests for glob breadth detection
 *
 * Covers: broad pattern detection, scoped patterns, high-level path checks,
 * specific directory detection, suggestion generation.
 *
 * Run: node --test .claude/hooks/tests/scout-block/broad-pattern-detector.test.cjs
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');

const {
  isBroadPattern,
  hasSpecificDirectory,
  isHighLevelPath,
  suggestSpecificPatterns,
  detectBroadPatternIssue
} = require('../../scout-block/broad-pattern-detector.cjs');


// ═══════════════════════════════════════════════════════════════════════════
// isBroadPattern
// ═══════════════════════════════════════════════════════════════════════════

describe('isBroadPattern', () => {
  it('detects ** as broad', () => {
    assert.ok(isBroadPattern('**'));
  });

  it('detects * as broad', () => {
    assert.ok(isBroadPattern('*'));
  });

  it('detects **/* as broad', () => {
    assert.ok(isBroadPattern('**/*'));
  });

  it('detects *.ext as broad', () => {
    assert.ok(isBroadPattern('*.ts'));
    assert.ok(isBroadPattern('*.js'));
    assert.ok(isBroadPattern('*.py'));
  });

  it('detects *.{ext,ext2} as broad', () => {
    assert.ok(isBroadPattern('*.{ts,tsx}'));
    assert.ok(isBroadPattern('*.{js,jsx}'));
  });

  it('does NOT detect scoped patterns as broad', () => {
    assert.ok(!isBroadPattern('src/**/*.ts'));
    assert.ok(!isBroadPattern('lib/*.js'));
    assert.ok(!isBroadPattern('components/**/*.tsx'));
  });

  it('does NOT detect specific file patterns as broad', () => {
    assert.ok(!isBroadPattern('package.json'));
    assert.ok(!isBroadPattern('tsconfig.json'));
    assert.ok(!isBroadPattern('README.md'));
  });

  it('returns false for null/empty', () => {
    assert.ok(!isBroadPattern(null));
    assert.ok(!isBroadPattern(''));
    assert.ok(!isBroadPattern(undefined));
  });
});


// ═══════════════════════════════════════════════════════════════════════════
// hasSpecificDirectory
// ═══════════════════════════════════════════════════════════════════════════

describe('hasSpecificDirectory', () => {
  it('detects src/ prefix', () => {
    assert.ok(hasSpecificDirectory('src/**/*.ts'));
  });

  it('detects lib/ prefix', () => {
    assert.ok(hasSpecificDirectory('lib/*.js'));
  });

  it('detects app/ prefix', () => {
    assert.ok(hasSpecificDirectory('app/**/*.tsx'));
  });

  it('detects components/ prefix', () => {
    assert.ok(hasSpecificDirectory('components/**/*.tsx'));
  });

  it('detects tests/ prefix', () => {
    assert.ok(hasSpecificDirectory('tests/**/*.test.js'));
  });

  it('detects ./src/ prefix', () => {
    assert.ok(hasSpecificDirectory('./src/**/*.ts'));
  });

  it('detects any non-glob first segment as specific', () => {
    assert.ok(hasSpecificDirectory('mydir/**/*.ts'));
    assert.ok(hasSpecificDirectory('custom-folder/*.js'));
  });

  it('returns false for broad root patterns', () => {
    assert.ok(!hasSpecificDirectory('**/*.ts'));
    assert.ok(!hasSpecificDirectory('*.js'));
  });

  it('returns false for null', () => {
    assert.ok(!hasSpecificDirectory(null));
    assert.ok(!hasSpecificDirectory(''));
  });
});


// ═══════════════════════════════════════════════════════════════════════════
// isHighLevelPath
// ═══════════════════════════════════════════════════════════════════════════

describe('isHighLevelPath', () => {
  it('treats no path (null) as high-level', () => {
    assert.ok(isHighLevelPath(null));
    assert.ok(isHighLevelPath(undefined));
  });

  it('treats empty/root path as high-level', () => {
    assert.ok(isHighLevelPath('.'));
    assert.ok(isHighLevelPath('./'));
    assert.ok(isHighLevelPath('/'));
  });

  it('treats shallow paths as high-level', () => {
    assert.ok(isHighLevelPath('mydir'));
    assert.ok(isHighLevelPath('mydir/'));
  });

  it('treats worktree paths as high-level', () => {
    assert.ok(isHighLevelPath('/path/worktrees/feature-x/'));
  });

  it('treats paths without specific dirs as high-level', () => {
    assert.ok(isHighLevelPath('random'));
  });

  it('treats paths WITH specific dirs as NOT high-level', () => {
    assert.ok(!isHighLevelPath('src/components'));
    assert.ok(!isHighLevelPath('lib/utils'));
    assert.ok(!isHighLevelPath('app/pages'));
  });
});


// ═══════════════════════════════════════════════════════════════════════════
// detectBroadPatternIssue — main function
// ═══════════════════════════════════════════════════════════════════════════

describe('detectBroadPatternIssue', () => {
  it('blocks **/*.ts at project root', () => {
    const result = detectBroadPatternIssue({ pattern: '**/*.ts' });
    assert.ok(result.blocked);
    assert.ok(result.suggestions.length > 0);
  });

  it('blocks *.js at project root', () => {
    const result = detectBroadPatternIssue({ pattern: '*.js' });
    assert.ok(result.blocked);
  });

  it('blocks **/* at project root', () => {
    const result = detectBroadPatternIssue({ pattern: '**/*' });
    assert.ok(result.blocked);
  });

  it('allows src/**/*.ts (scoped)', () => {
    const result = detectBroadPatternIssue({ pattern: 'src/**/*.ts' });
    assert.ok(!result.blocked);
  });

  it('allows lib/**/*.js (scoped)', () => {
    const result = detectBroadPatternIssue({ pattern: 'lib/**/*.js' });
    assert.ok(!result.blocked);
  });

  it('allows **/*.ts with specific base path', () => {
    const result = detectBroadPatternIssue({ pattern: '**/*.ts', path: 'src/components' });
    assert.ok(!result.blocked);
  });

  it('allows specific file pattern', () => {
    const result = detectBroadPatternIssue({ pattern: 'package.json' });
    assert.ok(!result.blocked);
  });

  it('returns not-blocked for null input', () => {
    assert.ok(!detectBroadPatternIssue(null).blocked);
    assert.ok(!detectBroadPatternIssue({}).blocked);
  });

  it('returns not-blocked for no pattern', () => {
    assert.ok(!detectBroadPatternIssue({ path: 'src' }).blocked);
  });
});


// ═══════════════════════════════════════════════════════════════════════════
// suggestSpecificPatterns
// ═══════════════════════════════════════════════════════════════════════════

describe('suggestSpecificPatterns', () => {
  it('suggests TypeScript-specific dirs for *.ts', () => {
    const suggestions = suggestSpecificPatterns('*.ts');
    assert.ok(suggestions.some(s => s.includes('src/')));
    assert.ok(suggestions.some(s => s.includes('.ts')));
  });

  it('suggests JavaScript-specific dirs for *.js', () => {
    const suggestions = suggestSpecificPatterns('*.js');
    assert.ok(suggestions.some(s => s.includes('.js')));
  });

  it('returns at most 4 suggestions', () => {
    const suggestions = suggestSpecificPatterns('**/*');
    assert.ok(suggestions.length <= 4);
  });

  it('returns suggestions for generic broad patterns', () => {
    const suggestions = suggestSpecificPatterns('**/*');
    assert.ok(suggestions.length > 0);
  });
});
