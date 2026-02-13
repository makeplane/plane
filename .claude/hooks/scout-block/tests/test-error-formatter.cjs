#!/usr/bin/env node
/**
 * test-error-formatter.cjs - Unit tests for error-formatter module
 */

const {
  formatBlockedError,
  formatSimpleError,
  formatMachineError,
  formatWarning,
  formatConfigPath,
  supportsColor,
  colorize,
  COLORS
} = require('../error-formatter.cjs');

let passed = 0;
let failed = 0;

function test(name, condition) {
  if (condition) {
    console.log(`\x1b[32m✓\x1b[0m ${name}`);
    passed++;
  } else {
    console.log(`\x1b[31m✗\x1b[0m ${name}`);
    failed++;
  }
}

console.log('Testing error-formatter module...\n');

// formatConfigPath tests
console.log('--- formatConfigPath Tests ---');
test('formatConfigPath with claudeDir', formatConfigPath('/home/user/.claude').includes('.ckignore'));
test('formatConfigPath without claudeDir', formatConfigPath(null) === '.claude/.ckignore');
test('formatConfigPath empty string', formatConfigPath('') === '.claude/.ckignore');

// formatBlockedError tests
console.log('\n--- formatBlockedError Tests ---');
const blockError = formatBlockedError({
  path: 'packages/web/node_modules/react',
  pattern: 'node_modules',
  tool: 'Bash',
  claudeDir: '/home/user/project/.claude'
});
test('formatBlockedError contains BLOCKED', blockError.includes('BLOCKED'));
test('formatBlockedError contains path', blockError.includes('packages/web/node_modules/react'));
test('formatBlockedError contains pattern', blockError.includes('node_modules'));
test('formatBlockedError contains tool', blockError.includes('Bash'));
test('formatBlockedError contains fix hint', blockError.includes('!node_modules'));

// Test long path truncation
const longPath = 'a/'.repeat(50) + 'node_modules/package/index.js';
const longPathError = formatBlockedError({
  path: longPath,
  pattern: 'node_modules',
  tool: 'Read',
  claudeDir: '.claude'
});
test('formatBlockedError truncates long path', longPathError.includes('...'));

// formatSimpleError tests
console.log('\n--- formatSimpleError Tests ---');
const simpleError = formatSimpleError('node_modules', 'packages/web/node_modules');
test('formatSimpleError contains ERROR', simpleError.includes('ERROR'));
test('formatSimpleError contains pattern', simpleError.includes('node_modules'));
test('formatSimpleError contains path', simpleError.includes('packages/web/node_modules'));

// formatMachineError tests
console.log('\n--- formatMachineError Tests ---');
const machineError = formatMachineError({
  path: 'dist/bundle.js',
  pattern: 'dist',
  tool: 'Read',
  claudeDir: '.claude'
});
const parsed = JSON.parse(machineError);
test('formatMachineError is valid JSON', typeof parsed === 'object');
test('formatMachineError has error field', parsed.error === 'BLOCKED');
test('formatMachineError has path field', parsed.path === 'dist/bundle.js');
test('formatMachineError has pattern field', parsed.pattern === 'dist');
test('formatMachineError has tool field', parsed.tool === 'Read');
test('formatMachineError has fix field', parsed.fix.includes('!dist'));

// formatWarning tests
console.log('\n--- formatWarning Tests ---');
const warning = formatWarning('Test warning message');
test('formatWarning contains WARN', warning.includes('WARN'));
test('formatWarning contains message', warning.includes('Test warning message'));

// colorize tests (with forced NO_COLOR)
console.log('\n--- colorize Tests ---');
const originalNoColor = process.env.NO_COLOR;
process.env.NO_COLOR = '1';
test('colorize respects NO_COLOR', colorize('test', 'red') === 'test');
delete process.env.NO_COLOR;

// Test COLORS constant exists
test('COLORS constant has expected keys',
  'red' in COLORS && 'yellow' in COLORS && 'blue' in COLORS && 'reset' in COLORS
);

// Restore original NO_COLOR
if (originalNoColor !== undefined) {
  process.env.NO_COLOR = originalNoColor;
}

console.log(`\nResults: ${passed} passed, ${failed} failed`);
process.exit(failed > 0 ? 1 : 0);
