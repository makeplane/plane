#!/usr/bin/env node

/**
 * Test runner - runs all tests
 */

const { spawn } = require('child_process');
const path = require('path');

const tests = [
  'test-detect-topic.js',
  'test-fetch-docs.js',
  'test-analyze-llms.js',
];

let totalPassed = 0;
let totalFailed = 0;

function runTest(testFile) {
  return new Promise((resolve, reject) => {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`Running: ${testFile}`);
    console.log('='.repeat(60));

    const testPath = path.join(__dirname, testFile);
    const proc = spawn('node', [testPath], {
      stdio: 'inherit',
    });

    proc.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Test failed: ${testFile}`));
      }
    });

    proc.on('error', reject);
  });
}

async function runAllTests() {
  console.log('Running all docs-seeker tests...');

  let failedTests = [];

  for (const test of tests) {
    try {
      await runTest(test);
    } catch (error) {
      failedTests.push(test);
    }
  }

  console.log(`\n${'='.repeat(60)}`);
  console.log('All Tests Summary');
  console.log('='.repeat(60));
  console.log(`Total test files: ${tests.length}`);
  console.log(`Passed: ${tests.length - failedTests.length}`);
  console.log(`Failed: ${failedTests.length}`);

  if (failedTests.length > 0) {
    console.log('\nFailed tests:');
    failedTests.forEach((test) => console.log(`  - ${test}`));
    process.exit(1);
  } else {
    console.log('\n✓ All tests passed!');
    process.exit(0);
  }
}

runAllTests();
