#!/usr/bin/env node
/**
 * pattern-matcher.test.cjs - Unit tests for gitignore-spec pattern matching
 *
 * Covers: dir name matching, nested paths, negation, globs,
 * Windows backslash normalization, edge cases.
 *
 * Run: node --test .claude/hooks/tests/scout-block/pattern-matcher.test.cjs
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

const {
  loadPatterns,
  createMatcher,
  matchPath,
  findMatchingPattern,
  DEFAULT_PATTERNS
} = require('../../scout-block/pattern-matcher.cjs');

const FIXTURES_DIR = path.join(__dirname, 'fixtures');


// ═══════════════════════════════════════════════════════════════════════════
// loadPatterns
// ═══════════════════════════════════════════════════════════════════════════

describe('loadPatterns', () => {
  it('loads patterns from fixture file', () => {
    const patterns = loadPatterns(path.join(FIXTURES_DIR, 'ckignore-default.txt'));
    assert.ok(patterns.includes('node_modules'));
    assert.ok(patterns.includes('dist'));
    assert.ok(patterns.includes('build'));
  });

  it('returns DEFAULT_PATTERNS for non-existent file', () => {
    const patterns = loadPatterns('/non/existent/.ckignore');
    assert.deepStrictEqual(patterns, DEFAULT_PATTERNS);
  });

  it('returns DEFAULT_PATTERNS for null path', () => {
    const patterns = loadPatterns(null);
    assert.deepStrictEqual(patterns, DEFAULT_PATTERNS);
  });

  it('filters out comments', () => {
    const patterns = loadPatterns(path.join(FIXTURES_DIR, 'ckignore-default.txt'));
    assert.ok(!patterns.some(p => p.startsWith('#')));
  });

  it('filters out empty lines', () => {
    const patterns = loadPatterns(path.join(FIXTURES_DIR, 'ckignore-default.txt'));
    assert.ok(!patterns.includes(''));
  });

  it('loads custom patterns', () => {
    const patterns = loadPatterns(path.join(FIXTURES_DIR, 'ckignore-custom.txt'));
    assert.ok(patterns.includes('out'));
    assert.ok(patterns.includes('.cache'));
    assert.ok(patterns.includes('*.pyc'));
  });

  it('loads negation patterns', () => {
    const patterns = loadPatterns(path.join(FIXTURES_DIR, 'ckignore-negation.txt'));
    assert.ok(patterns.includes('!src/vendor'));
    assert.ok(patterns.includes('!dist/public'));
  });
});


// ═══════════════════════════════════════════════════════════════════════════
// matchPath — simple directory names
// ═══════════════════════════════════════════════════════════════════════════

describe('matchPath - directory blocking', () => {
  const matcher = createMatcher(DEFAULT_PATTERNS);

  it('blocks node_modules at root', () => {
    assert.ok(matchPath(matcher, 'node_modules').blocked);
  });

  it('blocks node_modules/pkg/index.js', () => {
    assert.ok(matchPath(matcher, 'node_modules/pkg/index.js').blocked);
  });

  it('blocks nested node_modules', () => {
    assert.ok(matchPath(matcher, 'packages/web/node_modules').blocked);
    assert.ok(matchPath(matcher, 'packages/web/node_modules/pkg').blocked);
  });

  it('blocks dist at root', () => {
    assert.ok(matchPath(matcher, 'dist').blocked);
  });

  it('blocks dist/bundle.js', () => {
    const result = matchPath(matcher, 'dist/bundle.js');
    assert.ok(result.blocked);
    assert.strictEqual(result.pattern, 'dist');
  });

  it('blocks build directory', () => {
    assert.ok(matchPath(matcher, 'build').blocked);
    assert.ok(matchPath(matcher, 'build/output.js').blocked);
  });

  it('blocks .next directory', () => {
    assert.ok(matchPath(matcher, '.next').blocked);
    assert.ok(matchPath(matcher, '.next/cache/webpack').blocked);
  });

  it('blocks .venv directory', () => {
    assert.ok(matchPath(matcher, '.venv').blocked);
    assert.ok(matchPath(matcher, '.venv/lib/python3.11/site.py').blocked);
  });

  it('blocks venv directory', () => {
    assert.ok(matchPath(matcher, 'venv').blocked);
    assert.ok(matchPath(matcher, 'venv/bin/python3').blocked);
  });

  it('blocks __pycache__', () => {
    assert.ok(matchPath(matcher, '__pycache__').blocked);
    assert.ok(matchPath(matcher, 'src/__pycache__/module.pyc').blocked);
  });

  it('blocks .git directory', () => {
    assert.ok(matchPath(matcher, '.git').blocked);
    assert.ok(matchPath(matcher, '.git/objects/pack').blocked);
  });

  it('blocks coverage directory', () => {
    assert.ok(matchPath(matcher, 'coverage').blocked);
    assert.ok(matchPath(matcher, 'coverage/lcov-report/index.html').blocked);
  });

  it('blocks vendor directory', () => {
    assert.ok(matchPath(matcher, 'vendor').blocked);
  });

  it('blocks target directory', () => {
    assert.ok(matchPath(matcher, 'target').blocked);
    assert.ok(matchPath(matcher, 'target/release/binary').blocked);
  });
});


// ═══════════════════════════════════════════════════════════════════════════
// matchPath — allowed paths
// ═══════════════════════════════════════════════════════════════════════════

describe('matchPath - allowed paths', () => {
  const matcher = createMatcher(DEFAULT_PATTERNS);

  it('allows src/', () => {
    assert.ok(!matchPath(matcher, 'src').blocked);
    assert.ok(!matchPath(matcher, 'src/index.ts').blocked);
  });

  it('allows lib/', () => {
    assert.ok(!matchPath(matcher, 'lib/utils.js').blocked);
  });

  it('allows app/', () => {
    assert.ok(!matchPath(matcher, 'app/page.tsx').blocked);
  });

  it('allows tests/', () => {
    assert.ok(!matchPath(matcher, 'tests/unit/test.js').blocked);
  });

  it('allows package.json at root', () => {
    assert.ok(!matchPath(matcher, 'package.json').blocked);
  });

  it('allows README.md', () => {
    assert.ok(!matchPath(matcher, 'README.md').blocked);
  });

  it('allows .env files', () => {
    assert.ok(!matchPath(matcher, '.env').blocked);
    assert.ok(!matchPath(matcher, '.env.local').blocked);
  });
});


// ═══════════════════════════════════════════════════════════════════════════
// matchPath — negation patterns
// ═══════════════════════════════════════════════════════════════════════════

describe('matchPath - negation patterns', () => {
  const patterns = loadPatterns(path.join(FIXTURES_DIR, 'ckignore-negation.txt'));
  const matcher = createMatcher(patterns);

  it('blocks vendor by default', () => {
    assert.ok(matchPath(matcher, 'vendor').blocked);
    assert.ok(matchPath(matcher, 'vendor/pkg/lib.go').blocked);
  });

  it('allows src/vendor via negation', () => {
    assert.ok(!matchPath(matcher, 'src/vendor').blocked);
    assert.ok(!matchPath(matcher, 'src/vendor/lib.go').blocked);
  });

  it('blocks dist by default', () => {
    assert.ok(matchPath(matcher, 'dist').blocked);
    assert.ok(matchPath(matcher, 'dist/app.js').blocked);
  });

  // gitignore spec: "It is not possible to re-include a file if a parent
  // directory of that file is excluded." dist/public is INSIDE excluded dist/,
  // so negation !dist/public cannot override. This is expected gitignore behavior.
  it('cannot negate dist/public (parent dir excluded — gitignore spec)', () => {
    assert.ok(matchPath(matcher, 'dist/public').blocked);
    assert.ok(matchPath(matcher, 'dist/public/index.html').blocked);
  });
});


// ═══════════════════════════════════════════════════════════════════════════
// matchPath — path normalization
// ═══════════════════════════════════════════════════════════════════════════

describe('matchPath - normalization', () => {
  const matcher = createMatcher(DEFAULT_PATTERNS);

  it('normalizes Windows backslashes', () => {
    assert.ok(matchPath(matcher, 'node_modules\\pkg\\index.js').blocked);
  });

  it('strips leading ./', () => {
    assert.ok(matchPath(matcher, './node_modules').blocked);
    assert.ok(!matchPath(matcher, './src/index.ts').blocked);
  });

  it('returns not-blocked for null/empty path', () => {
    assert.ok(!matchPath(matcher, null).blocked);
    assert.ok(!matchPath(matcher, '').blocked);
    assert.ok(!matchPath(matcher, undefined).blocked);
  });
});


// ═══════════════════════════════════════════════════════════════════════════
// matchPath — custom patterns
// ═══════════════════════════════════════════════════════════════════════════

describe('matchPath - custom .ckignore', () => {
  const patterns = loadPatterns(path.join(FIXTURES_DIR, 'ckignore-custom.txt'));
  const matcher = createMatcher(patterns);

  it('blocks "out" directory', () => {
    assert.ok(matchPath(matcher, 'out').blocked);
    assert.ok(matchPath(matcher, 'out/index.html').blocked);
  });

  it('blocks ".cache" directory', () => {
    assert.ok(matchPath(matcher, '.cache').blocked);
    assert.ok(matchPath(matcher, '.cache/webpack').blocked);
  });

  it('blocks *.pyc glob pattern', () => {
    assert.ok(matchPath(matcher, 'module.pyc').blocked);
    assert.ok(matchPath(matcher, 'src/module.pyc').blocked);
  });

  it('still blocks node_modules', () => {
    assert.ok(matchPath(matcher, 'node_modules').blocked);
  });
});


// ═══════════════════════════════════════════════════════════════════════════
// findMatchingPattern
// ═══════════════════════════════════════════════════════════════════════════

describe('findMatchingPattern', () => {
  it('identifies matching pattern for node_modules path', () => {
    const pattern = findMatchingPattern(DEFAULT_PATTERNS, 'node_modules/pkg');
    assert.strictEqual(pattern, 'node_modules');
  });

  it('identifies matching pattern for dist path', () => {
    const pattern = findMatchingPattern(DEFAULT_PATTERNS, 'dist/bundle.js');
    assert.strictEqual(pattern, 'dist');
  });

  it('returns first non-negation pattern as fallback', () => {
    const pattern = findMatchingPattern(['!.env', 'node_modules'], 'something_unknown');
    assert.strictEqual(pattern, 'node_modules');
  });
});
