#!/usr/bin/env node
/**
 * Analyze and summarize test results from multiple formats
 * Usage: node analyze-test-results.js [options]
 *
 * Options:
 *   --playwright <path>  Path to Playwright JSON results
 *   --vitest <path>      Path to Vitest JSON results
 *   --junit <path>       Path to JUnit XML results
 *   --output <format>    Output format: text, json, markdown (default: text)
 *   --fail-threshold <n> Exit with code 1 if pass rate below n% (default: 0)
 */

const fs = require('fs');
const path = require('path');

// Parse arguments
const args = process.argv.slice(2);
function getArg(name) {
  const index = args.indexOf(`--${name}`);
  return index !== -1 ? args[index + 1] : null;
}

const playwrightPath = getArg('playwright');
const vitestPath = getArg('vitest');
const junitPath = getArg('junit');
const outputFormat = getArg('output') || 'text';
const failThreshold = parseInt(getArg('fail-threshold') || '0', 10);

// Result aggregator
const summary = {
  total: 0,
  passed: 0,
  failed: 0,
  skipped: 0,
  flaky: 0,
  duration: 0,
  suites: [],
  failures: [],
};

// Parse Playwright JSON results
function parsePlaywright(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`Playwright results not found: ${filePath}`);
    return;
  }

  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

  for (const suite of data.suites || []) {
    parseSuite(suite, 'playwright');
  }

  summary.duration += data.stats?.duration || 0;
}

function parseSuite(suite, source) {
  const suiteSummary = {
    name: suite.title || suite.file || 'Unknown',
    source,
    passed: 0,
    failed: 0,
    skipped: 0,
  };

  for (const spec of suite.specs || []) {
    for (const test of spec.tests || []) {
      summary.total++;
      suiteSummary[test.status === 'expected' ? 'passed' : test.status]++;

      if (test.status === 'expected') {
        summary.passed++;
      } else if (test.status === 'unexpected') {
        summary.failed++;
        summary.failures.push({
          name: `${suite.title} > ${spec.title}`,
          source,
          error: test.results?.[0]?.error?.message || 'Unknown error',
        });
      } else if (test.status === 'skipped') {
        summary.skipped++;
      } else if (test.status === 'flaky') {
        summary.flaky++;
        summary.passed++; // Flaky tests that eventually passed
      }
    }
  }

  // Recurse into nested suites
  for (const child of suite.suites || []) {
    parseSuite(child, source);
  }

  if (suiteSummary.passed + suiteSummary.failed + suiteSummary.skipped > 0) {
    summary.suites.push(suiteSummary);
  }
}

// Parse Vitest JSON results
function parseVitest(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`Vitest results not found: ${filePath}`);
    return;
  }

  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

  for (const file of data.testResults || []) {
    const suiteSummary = {
      name: path.basename(file.name),
      source: 'vitest',
      passed: 0,
      failed: 0,
      skipped: 0,
    };

    for (const test of file.assertionResults || []) {
      summary.total++;

      if (test.status === 'passed') {
        summary.passed++;
        suiteSummary.passed++;
      } else if (test.status === 'failed') {
        summary.failed++;
        suiteSummary.failed++;
        summary.failures.push({
          name: test.fullName || test.title,
          source: 'vitest',
          error: test.failureMessages?.[0] || 'Unknown error',
        });
      } else if (test.status === 'skipped' || test.status === 'pending') {
        summary.skipped++;
        suiteSummary.skipped++;
      }
    }

    summary.suites.push(suiteSummary);
  }

  summary.duration += data.startTime
    ? Date.now() - data.startTime
    : 0;
}

// Parse JUnit XML results
function parseJunit(filePath) {
  if (!fs.existsSync(filePath)) {
    console.error(`JUnit results not found: ${filePath}`);
    return;
  }

  const xml = fs.readFileSync(filePath, 'utf-8');

  // Simple XML parsing (avoid external dependencies)
  const testsuites = xml.match(/<testsuite[^>]*>/g) || [];

  for (const testsuite of testsuites) {
    const name = testsuite.match(/name="([^"]+)"/)?.[1] || 'Unknown';
    const tests = parseInt(testsuite.match(/tests="(\d+)"/)?.[1] || '0', 10);
    const failures = parseInt(testsuite.match(/failures="(\d+)"/)?.[1] || '0', 10);
    const skipped = parseInt(testsuite.match(/skipped="(\d+)"/)?.[1] || '0', 10);
    const time = parseFloat(testsuite.match(/time="([\d.]+)"/)?.[1] || '0');

    summary.total += tests;
    summary.passed += tests - failures - skipped;
    summary.failed += failures;
    summary.skipped += skipped;
    summary.duration += time * 1000;

    summary.suites.push({
      name,
      source: 'junit',
      passed: tests - failures - skipped,
      failed: failures,
      skipped,
    });
  }

  // Extract failure details
  const failureMatches = xml.matchAll(/<testcase[^>]*name="([^"]+)"[^>]*>[\s\S]*?<failure[^>]*>([\s\S]*?)<\/failure>/g);
  for (const match of failureMatches) {
    summary.failures.push({
      name: match[1],
      source: 'junit',
      error: match[2].trim().slice(0, 200),
    });
  }
}

// Output formatters
function outputText() {
  const passRate = summary.total > 0
    ? ((summary.passed / summary.total) * 100).toFixed(1)
    : 0;

  console.log('\n📊 Test Results Summary');
  console.log('='.repeat(50));
  console.log(`Total:   ${summary.total}`);
  console.log(`Passed:  ${summary.passed} ✅`);
  console.log(`Failed:  ${summary.failed} ❌`);
  console.log(`Skipped: ${summary.skipped} ⏭️`);
  if (summary.flaky > 0) {
    console.log(`Flaky:   ${summary.flaky} ⚠️`);
  }
  console.log(`Pass Rate: ${passRate}%`);
  console.log(`Duration: ${(summary.duration / 1000).toFixed(2)}s`);

  if (summary.failures.length > 0) {
    console.log('\n❌ Failures:');
    for (const failure of summary.failures.slice(0, 10)) {
      console.log(`  - [${failure.source}] ${failure.name}`);
      console.log(`    ${failure.error.slice(0, 100)}...`);
    }
    if (summary.failures.length > 10) {
      console.log(`  ... and ${summary.failures.length - 10} more`);
    }
  }

  console.log('');
}

function outputJson() {
  console.log(JSON.stringify(summary, null, 2));
}

function outputMarkdown() {
  const passRate = summary.total > 0
    ? ((summary.passed / summary.total) * 100).toFixed(1)
    : 0;

  console.log('## Test Results Summary\n');
  console.log('| Metric | Value |');
  console.log('|--------|-------|');
  console.log(`| Total | ${summary.total} |`);
  console.log(`| Passed | ${summary.passed} ✅ |`);
  console.log(`| Failed | ${summary.failed} ❌ |`);
  console.log(`| Skipped | ${summary.skipped} |`);
  console.log(`| Pass Rate | ${passRate}% |`);
  console.log(`| Duration | ${(summary.duration / 1000).toFixed(2)}s |`);

  if (summary.failures.length > 0) {
    console.log('\n### Failures\n');
    for (const failure of summary.failures.slice(0, 10)) {
      console.log(`- **[${failure.source}]** ${failure.name}`);
    }
  }
}

// Main execution
if (playwrightPath) parsePlaywright(playwrightPath);
if (vitestPath) parseVitest(vitestPath);
if (junitPath) parseJunit(junitPath);

if (summary.total === 0) {
  console.log('No test results found. Specify at least one input:');
  console.log('  --playwright <path>  Playwright JSON results');
  console.log('  --vitest <path>      Vitest JSON results');
  console.log('  --junit <path>       JUnit XML results');
  process.exit(1);
}

// Output results
switch (outputFormat) {
  case 'json':
    outputJson();
    break;
  case 'markdown':
    outputMarkdown();
    break;
  default:
    outputText();
}

// Check threshold
const passRate = (summary.passed / summary.total) * 100;
if (failThreshold > 0 && passRate < failThreshold) {
  console.error(`\n❌ Pass rate ${passRate.toFixed(1)}% below threshold ${failThreshold}%`);
  process.exit(1);
}
