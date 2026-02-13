#!/usr/bin/env node

/**
 * Test runner for dashboard tests
 * Executes all test suites and generates report
 */

const fs = require('fs');
const path = require('path');

// Load test framework first
require('./test-framework.cjs');

const testsDir = __dirname;
const testFiles = [
  'dashboard-renderer.test.cjs',
  'http-server.test.cjs',
  'dashboard-assets.test.cjs'
];

console.log('\n' + '='.repeat(70));
console.log('Dashboard Implementation Test Suite');
console.log('='.repeat(70));

// Load all test files
let loadErrors = [];
for (const testFile of testFiles) {
  const testPath = path.join(testsDir, testFile);

  if (!fs.existsSync(testPath)) {
    loadErrors.push(`Test file not found: ${testFile}`);
    continue;
  }

  try {
    require(testPath);
  } catch (error) {
    loadErrors.push(`${testFile}: ${error.message}`);
  }
}

if (loadErrors.length > 0) {
  console.error('\nErrors loading test files:');
  loadErrors.forEach(err => {
    console.error(`  - ${err}`);
  });
  process.exit(1);
}

// Run all tests
global.runAllTests();
