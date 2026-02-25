#!/usr/bin/env node
/**
 * test-full-flow-edge-cases.cjs - Edge case validation for full hook flow
 */

const BUILD_COMMAND_PATTERN = /^(npm|pnpm|yarn|bun)\s+([^\s]+\s+)*(run\s+)?(build|test|lint|dev|start|install|ci|add|remove|update|publish|pack|init|create|exec)/;
const TOOL_COMMAND_PATTERN = /^(npx|pnpx|bunx|tsc|esbuild|vite|webpack|rollup|turbo|nx|jest|vitest|mocha|eslint|prettier|go|cargo|make|mvn|gradle|dotnet)/;

function isBuildCommand(command) {
  if (!command || typeof command !== 'string') return false;
  const trimmed = command.trim();
  return BUILD_COMMAND_PATTERN.test(trimmed) || TOOL_COMMAND_PATTERN.test(trimmed);
}

console.log('=== FULL FLOW EDGE CASE VALIDATION ===\n');

const tests = [
  // Should be ALLOWED (bypass path extraction)
  { cmd: 'go build ./...', expect: true, desc: 'go build basic' },
  { cmd: 'cargo build', expect: true, desc: 'cargo build basic' },
  { cmd: 'make build', expect: true, desc: 'make build' },
  { cmd: 'make -j4', expect: true, desc: 'make with flags' },
  { cmd: 'mvn clean install', expect: true, desc: 'maven' },
  { cmd: 'gradle build', expect: true, desc: 'gradle' },
  { cmd: 'dotnet build', expect: true, desc: 'dotnet' },
  { cmd: 'npm run build', expect: true, desc: 'npm run build' },
  { cmd: 'go test ./...', expect: true, desc: 'go test' },

  // Should be BLOCKED (goes through path extraction)
  { cmd: 'docker build .', expect: false, desc: 'docker build (not in allowlist)' },
  { cmd: 'cd proj && go build', expect: false, desc: 'chained with cd first' },
  { cmd: 'GOOS=linux go build', expect: false, desc: 'env var prefix' },
  { cmd: 'sudo go build', expect: false, desc: 'sudo prefix' },
  { cmd: 'time go build', expect: false, desc: 'time prefix' },
  { cmd: 'ls build', expect: false, desc: 'ls build dir' },
  { cmd: 'cd build', expect: false, desc: 'cd build dir' },
];

let passed = 0;
let failed = 0;

for (const t of tests) {
  const result = isBuildCommand(t.cmd);
  const success = result === t.expect;

  if (success) {
    console.log(`\x1b[32m✓\x1b[0m ${t.desc}: "${t.cmd}" → ${result}`);
    passed++;
  } else {
    console.log(`\x1b[31m✗\x1b[0m ${t.desc}: "${t.cmd}" → ${result} (expected ${t.expect})`);
    failed++;
  }
}

console.log(`\nResults: ${passed} passed, ${failed} failed`);

// Additional edge case analysis
console.log('\n=== EDGE CASES REQUIRING ATTENTION ===\n');

const edgeCases = [
  { cmd: 'docker build .', issue: 'docker not in TOOL_COMMAND_PATTERN - should it be?' },
  { cmd: 'cd proj && go build', issue: 'Chained commands: first segment checked, not individual commands' },
  { cmd: 'GOOS=linux go build', issue: 'Env var prefix breaks regex start anchor' },
  { cmd: 'php artisan build', issue: 'php/artisan not in patterns' },
  { cmd: 'bundle exec build', issue: 'ruby bundler not in patterns' },
];

console.log('Known edge cases that may cause UX issues:\n');
for (const ec of edgeCases) {
  const allowed = isBuildCommand(ec.cmd);
  console.log(`  ${allowed ? '✓' : '⚠'} "${ec.cmd}"`);
  console.log(`     Issue: ${ec.issue}\n`);
}

process.exit(failed > 0 ? 1 : 0);
