#!/usr/bin/env node
/**
 * scout-checker.test.cjs - Integration tests for the scout-block facade
 *
 * Tests the full pipeline: command splitting → allowlist → path extraction → pattern matching.
 * Uses real .ckignore fixtures to validate end-to-end behavior.
 *
 * Run: node --test .claude/hooks/tests/scout-block/scout-checker.test.cjs
 */

const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

const {
  checkScoutBlock,
  isBuildCommand,
  isVenvExecutable,
  isVenvCreationCommand,
  isAllowedCommand,
  splitCompoundCommand,
  stripCommandPrefix,
  unwrapShellExecutor,
  BUILD_COMMAND_PATTERN,
  TOOL_COMMAND_PATTERN,
  VENV_EXECUTABLE_PATTERN,
  VENV_CREATION_PATTERN
} = require('../../lib/scout-checker.cjs');

const FIXTURES_DIR = path.join(__dirname, 'fixtures');
const DEFAULT_OPTS = {
  claudeDir: path.join(__dirname, '..', '..'),
  ckignorePath: path.join(FIXTURES_DIR, 'ckignore-default.txt'),
  checkBroadPatterns: true
};


// ═══════════════════════════════════════════════════════════════════════════
// splitCompoundCommand
// ═══════════════════════════════════════════════════════════════════════════

describe('splitCompoundCommand', () => {
  it('splits on &&', () => {
    const parts = splitCompoundCommand('echo hi && npm run build');
    assert.deepStrictEqual(parts, ['echo hi', 'npm run build']);
  });

  it('splits on ||', () => {
    const parts = splitCompoundCommand('cmd1 || cmd2');
    assert.deepStrictEqual(parts, ['cmd1', 'cmd2']);
  });

  it('splits on ;', () => {
    const parts = splitCompoundCommand('cmd1 ; cmd2');
    assert.deepStrictEqual(parts, ['cmd1', 'cmd2']);
  });

  it('does NOT split on newlines (heredoc protection)', () => {
    // Newlines in command strings are typically heredoc bodies, not operators
    const parts = splitCompoundCommand('echo hi\nnpm run build');
    assert.deepStrictEqual(parts, ['echo hi\nnpm run build']);
  });

  it('splits on mixed operators', () => {
    const parts = splitCompoundCommand('a && b || c ; d');
    assert.strictEqual(parts.length, 4);
  });

  it('returns single-element for simple command', () => {
    const parts = splitCompoundCommand('npm run build');
    assert.deepStrictEqual(parts, ['npm run build']);
  });

  it('filters out empty segments', () => {
    const parts = splitCompoundCommand('a && && b');
    assert.ok(!parts.includes(''));
  });

  it('handles null/undefined gracefully', () => {
    assert.deepStrictEqual(splitCompoundCommand(null), []);
    assert.deepStrictEqual(splitCompoundCommand(undefined), []);
  });

  it('does NOT split on pipe |', () => {
    // Pipe connects stdout→stdin, not a compound separator
    const parts = splitCompoundCommand('cat file.txt | head -5');
    assert.strictEqual(parts.length, 1);
  });
});


// ═══════════════════════════════════════════════════════════════════════════
// stripCommandPrefix
// ═══════════════════════════════════════════════════════════════════════════

describe('stripCommandPrefix', () => {
  it('strips single ENV var', () => {
    assert.strictEqual(stripCommandPrefix('NODE_ENV=production npm run build'), 'npm run build');
  });

  it('strips multiple ENV vars', () => {
    assert.strictEqual(stripCommandPrefix('NODE_ENV=prod CI=true npm run build'), 'npm run build');
  });

  it('strips sudo', () => {
    assert.strictEqual(stripCommandPrefix('sudo npm install'), 'npm install');
  });

  it('strips env wrapper', () => {
    assert.strictEqual(stripCommandPrefix('env npm run build'), 'npm run build');
  });

  it('strips sudo + env vars', () => {
    assert.strictEqual(stripCommandPrefix('sudo NODE_ENV=prod npm start'), 'npm start');
  });

  it('returns original for plain command', () => {
    assert.strictEqual(stripCommandPrefix('npm run build'), 'npm run build');
  });

  it('handles null/undefined', () => {
    assert.strictEqual(stripCommandPrefix(null), null);
    assert.strictEqual(stripCommandPrefix(undefined), undefined);
  });
});


// ═══════════════════════════════════════════════════════════════════════════
// unwrapShellExecutor
// ═══════════════════════════════════════════════════════════════════════════

describe('unwrapShellExecutor', () => {
  it('unwraps bash -c "cmd"', () => {
    assert.strictEqual(unwrapShellExecutor('bash -c "cat node_modules/file"'), 'cat node_modules/file');
  });

  it('unwraps sh -c "cmd"', () => {
    assert.strictEqual(unwrapShellExecutor("sh -c 'ls dist/'"), 'ls dist/');
  });

  it('unwraps eval "cmd"', () => {
    assert.strictEqual(unwrapShellExecutor('eval "cat node_modules/file"'), 'cat node_modules/file');
  });

  it('returns original for non-executor', () => {
    assert.strictEqual(unwrapShellExecutor('cat node_modules/file'), 'cat node_modules/file');
  });

  it('handles null/undefined', () => {
    assert.strictEqual(unwrapShellExecutor(null), null);
    assert.strictEqual(unwrapShellExecutor(undefined), undefined);
  });
});


// ═══════════════════════════════════════════════════════════════════════════
// isBuildCommand
// ═══════════════════════════════════════════════════════════════════════════

describe('isBuildCommand', () => {
  it('matches npm build', () => assert.ok(isBuildCommand('npm build')));
  it('matches npm run build', () => assert.ok(isBuildCommand('npm run build')));
  it('matches pnpm build', () => assert.ok(isBuildCommand('pnpm build')));
  it('matches yarn build', () => assert.ok(isBuildCommand('yarn build')));
  it('matches bun build', () => assert.ok(isBuildCommand('bun build')));
  it('matches npm test', () => assert.ok(isBuildCommand('npm test')));
  it('matches npm run lint', () => assert.ok(isBuildCommand('npm run lint')));
  it('matches npm run dev', () => assert.ok(isBuildCommand('npm run dev')));
  it('matches npm install', () => assert.ok(isBuildCommand('npm install')));
  it('matches npm ci', () => assert.ok(isBuildCommand('npm ci')));
  it('matches pnpm --filter web run build', () => {
    assert.ok(isBuildCommand('pnpm --filter web run build'));
  });
  it('matches yarn workspace app build', () => {
    assert.ok(isBuildCommand('yarn workspace app build'));
  });
  it('matches npm run build with pipes', () => {
    assert.ok(isBuildCommand('npm run build 2>&1 | tail -15'));
  });

  it('does NOT match echo', () => assert.ok(!isBuildCommand('echo hello')));
  it('does NOT match cat', () => assert.ok(!isBuildCommand('cat file.txt')));
  it('does NOT match cd', () => assert.ok(!isBuildCommand('cd node_modules')));
  it('returns false for null', () => assert.ok(!isBuildCommand(null)));
  it('returns false for empty', () => assert.ok(!isBuildCommand('')));
});


// ═══════════════════════════════════════════════════════════════════════════
// TOOL_COMMAND_PATTERN matching via isBuildCommand
// ═══════════════════════════════════════════════════════════════════════════

describe('tool command matching (via isBuildCommand)', () => {
  it('matches npx tsc', () => assert.ok(isBuildCommand('npx tsc')));
  it('matches tsc --noEmit', () => assert.ok(isBuildCommand('tsc --noEmit')));
  it('matches esbuild src/index.ts', () => assert.ok(isBuildCommand('esbuild src/index.ts')));
  it('matches vite build', () => assert.ok(isBuildCommand('vite build')));
  it('matches jest', () => assert.ok(isBuildCommand('jest')));
  it('matches vitest', () => assert.ok(isBuildCommand('vitest')));
  it('matches eslint src/', () => assert.ok(isBuildCommand('eslint src/')));
  it('matches prettier --check', () => assert.ok(isBuildCommand('prettier --check .')));
  it('matches go build', () => assert.ok(isBuildCommand('go build ./cmd/server')));
  it('matches cargo build', () => assert.ok(isBuildCommand('cargo build --release')));
  it('matches make', () => assert.ok(isBuildCommand('make')));
  it('matches docker build', () => assert.ok(isBuildCommand('docker build -t app .')));
  it('matches kubectl', () => assert.ok(isBuildCommand('kubectl apply -f deploy.yaml')));
  it('matches terraform', () => assert.ok(isBuildCommand('terraform plan')));
  it('matches turbo run build', () => assert.ok(isBuildCommand('turbo run build')));
  it('matches nx build', () => assert.ok(isBuildCommand('nx build app')));
  it('matches ./npx (relative)', () => assert.ok(isBuildCommand('./npx tsc')));
});


// ═══════════════════════════════════════════════════════════════════════════
// isVenvExecutable & isVenvCreationCommand
// ═══════════════════════════════════════════════════════════════════════════

describe('isVenvExecutable', () => {
  it('matches .venv/bin/python3', () => {
    assert.ok(isVenvExecutable('.venv/bin/python3 script.py'));
  });
  it('matches venv/bin/python3', () => {
    assert.ok(isVenvExecutable('venv/bin/python3 script.py'));
  });
  it('matches .venv/Scripts/python.exe (Windows)', () => {
    assert.ok(isVenvExecutable('.venv/Scripts/python.exe script.py'));
  });
  it('matches nested .venv path', () => {
    assert.ok(isVenvExecutable('~/.claude/skills/.venv/bin/python3 script.py'));
  });
  it('does NOT match bare python', () => {
    assert.ok(!isVenvExecutable('python3 script.py'));
  });
  it('returns false for null', () => assert.ok(!isVenvExecutable(null)));
});

describe('isVenvCreationCommand', () => {
  it('matches python -m venv .venv', () => {
    assert.ok(isVenvCreationCommand('python -m venv .venv'));
  });
  it('matches python3 -m venv .venv', () => {
    assert.ok(isVenvCreationCommand('python3 -m venv .venv'));
  });
  it('matches py -m venv .venv (Windows)', () => {
    assert.ok(isVenvCreationCommand('py -m venv .venv'));
  });
  it('matches py -3.11 -m venv .venv', () => {
    assert.ok(isVenvCreationCommand('py -3.11 -m venv .venv'));
  });
  it('matches uv venv', () => {
    assert.ok(isVenvCreationCommand('uv venv'));
  });
  it('matches uv venv .venv', () => {
    assert.ok(isVenvCreationCommand('uv venv .venv'));
  });
  it('matches virtualenv .venv', () => {
    assert.ok(isVenvCreationCommand('virtualenv .venv'));
  });
  it('does NOT match python3 --version', () => {
    assert.ok(!isVenvCreationCommand('python3 --version'));
  });
  it('does NOT match uv pip install', () => {
    assert.ok(!isVenvCreationCommand('uv pip install requests'));
  });
  it('returns false for null', () => assert.ok(!isVenvCreationCommand(null)));
});


// ═══════════════════════════════════════════════════════════════════════════
// checkScoutBlock — full pipeline integration
// ═══════════════════════════════════════════════════════════════════════════

describe('checkScoutBlock - Bash commands', () => {
  // --- Should BLOCK ---
  describe('blocked commands', () => {
    it('blocks ls node_modules', () => {
      const r = checkScoutBlock({ toolName: 'Bash', toolInput: { command: 'ls node_modules' }, options: DEFAULT_OPTS });
      assert.ok(r.blocked);
    });

    it('blocks cd build', () => {
      const r = checkScoutBlock({ toolName: 'Bash', toolInput: { command: 'cd build' }, options: DEFAULT_OPTS });
      assert.ok(r.blocked);
    });

    it('blocks cat dist/bundle.js', () => {
      const r = checkScoutBlock({ toolName: 'Bash', toolInput: { command: 'cat dist/bundle.js' }, options: DEFAULT_OPTS });
      assert.ok(r.blocked);
    });

    it('blocks ls packages/web/node_modules', () => {
      const r = checkScoutBlock({ toolName: 'Bash', toolInput: { command: 'ls packages/web/node_modules' }, options: DEFAULT_OPTS });
      assert.ok(r.blocked);
    });

    it('blocks cat .venv/lib/python3.11/site.py', () => {
      const r = checkScoutBlock({ toolName: 'Bash', toolInput: { command: 'cat .venv/lib/python3.11/site.py' }, options: DEFAULT_OPTS });
      assert.ok(r.blocked);
    });

    it('blocks ls -la .venv/', () => {
      const r = checkScoutBlock({ toolName: 'Bash', toolInput: { command: 'ls -la .venv/' }, options: DEFAULT_OPTS });
      assert.ok(r.blocked);
    });
  });

  // --- Should ALLOW (build commands) ---
  describe('allowed build commands', () => {
    it('allows npm build', () => {
      const r = checkScoutBlock({ toolName: 'Bash', toolInput: { command: 'npm build' }, options: DEFAULT_OPTS });
      assert.ok(!r.blocked);
    });

    it('allows npm run build', () => {
      const r = checkScoutBlock({ toolName: 'Bash', toolInput: { command: 'npm run build' }, options: DEFAULT_OPTS });
      assert.ok(!r.blocked);
    });

    it('allows pnpm --filter web run build', () => {
      const r = checkScoutBlock({ toolName: 'Bash', toolInput: { command: 'pnpm --filter web run build 2>&1 | tail -100' }, options: DEFAULT_OPTS });
      assert.ok(!r.blocked);
    });

    it('allows npx tsc', () => {
      const r = checkScoutBlock({ toolName: 'Bash', toolInput: { command: 'npx tsc' }, options: DEFAULT_OPTS });
      assert.ok(!r.blocked);
    });

    it('allows go build', () => {
      const r = checkScoutBlock({ toolName: 'Bash', toolInput: { command: 'go build ./cmd/server' }, options: DEFAULT_OPTS });
      assert.ok(!r.blocked);
    });
  });

  // --- Should ALLOW (venv) ---
  describe('allowed venv commands', () => {
    it('allows .venv/bin/python3 execution', () => {
      const r = checkScoutBlock({ toolName: 'Bash', toolInput: { command: '~/.claude/skills/.venv/bin/python3 script.py' }, options: DEFAULT_OPTS });
      assert.ok(!r.blocked);
    });

    it('allows python3 -m venv .venv', () => {
      const r = checkScoutBlock({ toolName: 'Bash', toolInput: { command: 'python3 -m venv .venv' }, options: DEFAULT_OPTS });
      assert.ok(!r.blocked);
    });

    it('allows uv venv', () => {
      const r = checkScoutBlock({ toolName: 'Bash', toolInput: { command: 'uv venv' }, options: DEFAULT_OPTS });
      assert.ok(!r.blocked);
    });
  });

  // --- Compound commands ---
  describe('compound commands', () => {
    it('allows echo + npm run build (newline)', () => {
      const r = checkScoutBlock({ toolName: 'Bash', toolInput: { command: 'echo "Checking..."\nnpm run build 2>&1 | tail -15' }, options: DEFAULT_OPTS });
      assert.ok(!r.blocked);
    });

    it('allows echo + npm run build (&&)', () => {
      const r = checkScoutBlock({ toolName: 'Bash', toolInput: { command: 'echo "Building..." && npm run build' }, options: DEFAULT_OPTS });
      assert.ok(!r.blocked);
    });

    it('allows npm install + npm run build', () => {
      const r = checkScoutBlock({ toolName: 'Bash', toolInput: { command: 'npm install && npm run build' }, options: DEFAULT_OPTS });
      assert.ok(!r.blocked);
    });

    it('blocks echo + cd node_modules', () => {
      const r = checkScoutBlock({ toolName: 'Bash', toolInput: { command: 'echo test && cd node_modules' }, options: DEFAULT_OPTS });
      assert.ok(r.blocked);
    });

    it('blocks npm run build + cat dist/bundle.js', () => {
      const r = checkScoutBlock({ toolName: 'Bash', toolInput: { command: 'npm run build && cat dist/bundle.js' }, options: DEFAULT_OPTS });
      assert.ok(r.blocked);
    });

    it('allows all-allowed compound command', () => {
      const r = checkScoutBlock({ toolName: 'Bash', toolInput: { command: 'npm install && npm run build && npm test' }, options: DEFAULT_OPTS });
      assert.ok(!r.blocked);
    });

    it('blocks when ONE sub-command accesses blocked dir', () => {
      const r = checkScoutBlock({ toolName: 'Bash', toolInput: { command: 'npm install && ls node_modules && npm test' }, options: DEFAULT_OPTS });
      assert.ok(r.blocked);
    });
  });

  // --- Safe commands (no blocked paths) ---
  describe('safe commands (no blocked paths)', () => {
    it('allows ls src/', () => {
      const r = checkScoutBlock({ toolName: 'Bash', toolInput: { command: 'ls src/' }, options: DEFAULT_OPTS });
      assert.ok(!r.blocked);
    });

    it('allows cat src/index.ts', () => {
      const r = checkScoutBlock({ toolName: 'Bash', toolInput: { command: 'cat src/index.ts' }, options: DEFAULT_OPTS });
      assert.ok(!r.blocked);
    });

    it('allows python3 --version', () => {
      const r = checkScoutBlock({ toolName: 'Bash', toolInput: { command: 'python3 --version' }, options: DEFAULT_OPTS });
      assert.ok(!r.blocked);
    });
  });
});

describe('checkScoutBlock - non-Bash tools', () => {
  it('blocks Read with node_modules file_path', () => {
    const r = checkScoutBlock({ toolName: 'Read', toolInput: { file_path: 'node_modules/package.json' }, options: DEFAULT_OPTS });
    assert.ok(r.blocked);
  });

  it('blocks Grep with node_modules path', () => {
    const r = checkScoutBlock({ toolName: 'Grep', toolInput: { pattern: 'test', path: 'node_modules' }, options: DEFAULT_OPTS });
    assert.ok(r.blocked);
  });

  it('allows Grep with src path', () => {
    const r = checkScoutBlock({ toolName: 'Grep', toolInput: { pattern: 'test', path: 'src' }, options: DEFAULT_OPTS });
    assert.ok(!r.blocked);
  });

  it('allows Read with safe file_path', () => {
    const r = checkScoutBlock({ toolName: 'Read', toolInput: { file_path: 'src/index.js' }, options: DEFAULT_OPTS });
    assert.ok(!r.blocked);
  });

  it('blocks Glob with broad pattern', () => {
    const r = checkScoutBlock({ toolName: 'Glob', toolInput: { pattern: '**/*.ts' }, options: DEFAULT_OPTS });
    assert.ok(r.blocked);
    assert.ok(r.isBroadPattern);
  });

  it('allows Glob with scoped pattern', () => {
    const r = checkScoutBlock({ toolName: 'Glob', toolInput: { pattern: 'src/**/*.ts' }, options: DEFAULT_OPTS });
    assert.ok(!r.blocked);
  });
});

describe('checkScoutBlock - fail-open behavior', () => {
  it('allows on invalid tool_input', () => {
    const r = checkScoutBlock({ toolName: 'Bash', toolInput: {}, options: DEFAULT_OPTS });
    assert.ok(!r.blocked);
  });

  it('allows when no paths extracted', () => {
    const r = checkScoutBlock({ toolName: 'Bash', toolInput: { command: 'echo hello' }, options: DEFAULT_OPTS });
    assert.ok(!r.blocked);
  });

  it('uses defaults when ckignorePath missing', () => {
    const r = checkScoutBlock({ toolName: 'Bash', toolInput: { command: 'ls node_modules' }, options: { ckignorePath: '/nonexistent/.ckignore' } });
    assert.ok(r.blocked, 'Should still block using DEFAULT_PATTERNS');
  });
});

describe('checkScoutBlock - custom .ckignore', () => {
  const customOpts = {
    ...DEFAULT_OPTS,
    ckignorePath: path.join(FIXTURES_DIR, 'ckignore-custom.txt')
  };

  it('blocks "out" directory with custom config', () => {
    const r = checkScoutBlock({ toolName: 'Read', toolInput: { file_path: 'out/index.html' }, options: customOpts });
    assert.ok(r.blocked);
  });

  it('blocks ".cache" with custom config', () => {
    const r = checkScoutBlock({ toolName: 'Bash', toolInput: { command: 'ls .cache' }, options: customOpts });
    assert.ok(r.blocked);
  });
});

describe('checkScoutBlock - negation .ckignore', () => {
  const negOpts = {
    ...DEFAULT_OPTS,
    ckignorePath: path.join(FIXTURES_DIR, 'ckignore-negation.txt')
  };

  it('blocks vendor but allows src/vendor', () => {
    const blocked = checkScoutBlock({ toolName: 'Read', toolInput: { file_path: 'vendor/pkg.go' }, options: negOpts });
    assert.ok(blocked.blocked);

    const allowed = checkScoutBlock({ toolName: 'Read', toolInput: { file_path: 'src/vendor/lib.go' }, options: negOpts });
    assert.ok(!allowed.blocked);
  });

  // gitignore spec: cannot re-include inside excluded parent dir
  it('cannot negate dist/public (parent dir excluded — gitignore spec)', () => {
    const r1 = checkScoutBlock({ toolName: 'Read', toolInput: { file_path: 'dist/app.js' }, options: negOpts });
    assert.ok(r1.blocked);

    // dist/public is still blocked — gitignore limitation
    const r2 = checkScoutBlock({ toolName: 'Read', toolInput: { file_path: 'dist/public/index.html' }, options: negOpts });
    assert.ok(r2.blocked);
  });
});


// ═══════════════════════════════════════════════════════════════════════════
// P0: Absolute and relative path normalization
// ═══════════════════════════════════════════════════════════════════════════

describe('P0 - absolute and relative paths', () => {
  it('blocks absolute path to node_modules', () => {
    const r = checkScoutBlock({ toolName: 'Read', toolInput: { file_path: '/home/user/project/node_modules/pkg/index.js' }, options: DEFAULT_OPTS });
    assert.ok(r.blocked);
  });

  it('blocks absolute path to dist', () => {
    const r = checkScoutBlock({ toolName: 'Read', toolInput: { file_path: '/Users/kai/project/dist/bundle.js' }, options: DEFAULT_OPTS });
    assert.ok(r.blocked);
  });

  it('blocks ../ relative path to node_modules', () => {
    const r = checkScoutBlock({ toolName: 'Read', toolInput: { file_path: '../node_modules/pkg/file.js' }, options: DEFAULT_OPTS });
    assert.ok(r.blocked);
  });

  it('blocks ../../node_modules path', () => {
    const r = checkScoutBlock({ toolName: 'Read', toolInput: { file_path: '../../node_modules/pkg' }, options: DEFAULT_OPTS });
    assert.ok(r.blocked);
  });

  it('allows absolute path to src', () => {
    const r = checkScoutBlock({ toolName: 'Read', toolInput: { file_path: '/home/user/project/src/index.ts' }, options: DEFAULT_OPTS });
    assert.ok(!r.blocked);
  });

  it('allows ../ path to safe dir', () => {
    const r = checkScoutBlock({ toolName: 'Read', toolInput: { file_path: '../src/utils.ts' }, options: DEFAULT_OPTS });
    assert.ok(!r.blocked);
  });

  it('blocks cat with absolute node_modules path', () => {
    const r = checkScoutBlock({ toolName: 'Bash', toolInput: { command: 'cat /home/user/project/node_modules/pkg/index.js' }, options: DEFAULT_OPTS });
    assert.ok(r.blocked);
  });
});


// ═══════════════════════════════════════════════════════════════════════════
// P1a: ENV prefix handling
// ═══════════════════════════════════════════════════════════════════════════

describe('P1a - ENV prefix commands', () => {
  it('allows NODE_ENV=production npm run build', () => {
    const r = checkScoutBlock({ toolName: 'Bash', toolInput: { command: 'NODE_ENV=production npm run build' }, options: DEFAULT_OPTS });
    assert.ok(!r.blocked);
  });

  it('allows CI=true npm test', () => {
    const r = checkScoutBlock({ toolName: 'Bash', toolInput: { command: 'CI=true npm test' }, options: DEFAULT_OPTS });
    assert.ok(!r.blocked);
  });

  it('allows FORCE_COLOR=1 npx vitest', () => {
    const r = checkScoutBlock({ toolName: 'Bash', toolInput: { command: 'FORCE_COLOR=1 npx vitest' }, options: DEFAULT_OPTS });
    assert.ok(!r.blocked);
  });

  it('allows DEBUG=* npm run dev', () => {
    const r = checkScoutBlock({ toolName: 'Bash', toolInput: { command: 'DEBUG=* npm run dev' }, options: DEFAULT_OPTS });
    assert.ok(!r.blocked);
  });

  it('allows multiple ENV vars before build', () => {
    const r = checkScoutBlock({ toolName: 'Bash', toolInput: { command: 'NODE_ENV=production CI=true npm run build' }, options: DEFAULT_OPTS });
    assert.ok(!r.blocked);
  });

  it('allows sudo npm install', () => {
    const r = checkScoutBlock({ toolName: 'Bash', toolInput: { command: 'sudo npm install' }, options: DEFAULT_OPTS });
    assert.ok(!r.blocked);
  });
});


// ═══════════════════════════════════════════════════════════════════════════
// P1b: Heredoc protection (no newline splitting)
// ═══════════════════════════════════════════════════════════════════════════

describe('P1b - heredoc protection', () => {
  it('does not block heredoc content mentioning node_modules', () => {
    const cmd = 'cat <<EOF\nnode_modules is large\nEOF';
    const r = checkScoutBlock({ toolName: 'Bash', toolInput: { command: cmd }, options: DEFAULT_OPTS });
    assert.ok(!r.blocked);
  });

  it('does not block heredoc content mentioning build', () => {
    const cmd = 'cat <<EOF\nthe build output goes to dist\nEOF';
    const r = checkScoutBlock({ toolName: 'Bash', toolInput: { command: cmd }, options: DEFAULT_OPTS });
    assert.ok(!r.blocked);
  });
});


// ═══════════════════════════════════════════════════════════════════════════
// P1c: Extended tool command allowlist
// ═══════════════════════════════════════════════════════════════════════════

describe('P1c - extended tool allowlist', () => {
  it('allows python manage.py build', () => {
    const r = checkScoutBlock({ toolName: 'Bash', toolInput: { command: 'python manage.py build' }, options: DEFAULT_OPTS });
    assert.ok(!r.blocked);
  });

  it('allows python3 setup.py build', () => {
    const r = checkScoutBlock({ toolName: 'Bash', toolInput: { command: 'python3 setup.py build' }, options: DEFAULT_OPTS });
    assert.ok(!r.blocked);
  });

  it('allows deno task build', () => {
    const r = checkScoutBlock({ toolName: 'Bash', toolInput: { command: 'deno task build' }, options: DEFAULT_OPTS });
    assert.ok(!r.blocked);
  });

  it('allows bundle exec rake build', () => {
    const r = checkScoutBlock({ toolName: 'Bash', toolInput: { command: 'bundle exec rake build' }, options: DEFAULT_OPTS });
    assert.ok(!r.blocked);
  });

  it('allows php artisan serve', () => {
    const r = checkScoutBlock({ toolName: 'Bash', toolInput: { command: 'php artisan serve' }, options: DEFAULT_OPTS });
    assert.ok(!r.blocked);
  });

  it('allows mix deps.get (Elixir)', () => {
    const r = checkScoutBlock({ toolName: 'Bash', toolInput: { command: 'mix deps.get' }, options: DEFAULT_OPTS });
    assert.ok(!r.blocked);
  });

  it('allows pip install package', () => {
    const r = checkScoutBlock({ toolName: 'Bash', toolInput: { command: 'pip install flask' }, options: DEFAULT_OPTS });
    assert.ok(!r.blocked);
  });

  it('allows uv pip install', () => {
    const r = checkScoutBlock({ toolName: 'Bash', toolInput: { command: 'uv pip install flask' }, options: DEFAULT_OPTS });
    assert.ok(!r.blocked);
  });
});


// ═══════════════════════════════════════════════════════════════════════════
// P1: Shell executor unwrapping (bash -c, eval)
// ═══════════════════════════════════════════════════════════════════════════

describe('P1 - shell executor unwrapping', () => {
  it('blocks bash -c "cat node_modules/file"', () => {
    const r = checkScoutBlock({ toolName: 'Bash', toolInput: { command: 'bash -c "cat node_modules/file"' }, options: DEFAULT_OPTS });
    assert.ok(r.blocked);
  });

  it('blocks sh -c "ls dist/"', () => {
    const r = checkScoutBlock({ toolName: 'Bash', toolInput: { command: 'sh -c "ls dist/"' }, options: DEFAULT_OPTS });
    assert.ok(r.blocked);
  });

  it('blocks eval "cat node_modules/file"', () => {
    const r = checkScoutBlock({ toolName: 'Bash', toolInput: { command: 'eval "cat node_modules/file"' }, options: DEFAULT_OPTS });
    assert.ok(r.blocked);
  });

  it('allows bash -c "npm run build"', () => {
    const r = checkScoutBlock({ toolName: 'Bash', toolInput: { command: 'bash -c "npm run build"' }, options: DEFAULT_OPTS });
    assert.ok(!r.blocked);
  });
});


// ═══════════════════════════════════════════════════════════════════════════
// P2: Context-aware token classification (grep, echo, sed)
// ═══════════════════════════════════════════════════════════════════════════

describe('P2 - context-aware extraction', () => {
  it('allows grep -r "build" src/', () => {
    const r = checkScoutBlock({ toolName: 'Bash', toolInput: { command: 'grep -r "build" src/' }, options: DEFAULT_OPTS });
    assert.ok(!r.blocked);
  });

  it('allows cat package.json | grep build', () => {
    const r = checkScoutBlock({ toolName: 'Bash', toolInput: { command: 'cat package.json | grep build' }, options: DEFAULT_OPTS });
    assert.ok(!r.blocked);
  });

  it('allows echo build', () => {
    const r = checkScoutBlock({ toolName: 'Bash', toolInput: { command: 'echo build' }, options: DEFAULT_OPTS });
    assert.ok(!r.blocked);
  });

  it('allows echo "deploying to build server"', () => {
    const r = checkScoutBlock({ toolName: 'Bash', toolInput: { command: 'echo "deploying to build server"' }, options: DEFAULT_OPTS });
    assert.ok(!r.blocked);
  });

  it('allows sed s/build/dist/g', () => {
    const r = checkScoutBlock({ toolName: 'Bash', toolInput: { command: "sed 's/build/dist/g' config.js" }, options: DEFAULT_OPTS });
    assert.ok(!r.blocked);
  });

  it('still blocks cat dist/file.js | head', () => {
    const r = checkScoutBlock({ toolName: 'Bash', toolInput: { command: 'cat dist/file.js | head -20' }, options: DEFAULT_OPTS });
    assert.ok(r.blocked);
  });

  it('still blocks ls node_modules', () => {
    const r = checkScoutBlock({ toolName: 'Bash', toolInput: { command: 'ls node_modules' }, options: DEFAULT_OPTS });
    assert.ok(r.blocked);
  });

  it('still blocks cd build', () => {
    const r = checkScoutBlock({ toolName: 'Bash', toolInput: { command: 'cd build' }, options: DEFAULT_OPTS });
    assert.ok(r.blocked);
  });

  it('still blocks cp dist/file.js .', () => {
    const r = checkScoutBlock({ toolName: 'Bash', toolInput: { command: 'cp dist/file.js .' }, options: DEFAULT_OPTS });
    assert.ok(r.blocked);
  });

  it('still blocks rm -rf node_modules', () => {
    const r = checkScoutBlock({ toolName: 'Bash', toolInput: { command: 'rm -rf node_modules' }, options: DEFAULT_OPTS });
    assert.ok(r.blocked);
  });
});


// ═══════════════════════════════════════════════════════════════════════════
// P3: Shell metacharacter stripping in normalizeExtractedPath
// ═══════════════════════════════════════════════════════════════════════════

describe('P3 - metacharacter normalization', () => {
  it('blocks $() command substitution with node_modules', () => {
    const r = checkScoutBlock({ toolName: 'Bash', toolInput: { command: 'echo $(cat node_modules/file)' }, options: DEFAULT_OPTS });
    assert.ok(r.blocked);
  });
});
