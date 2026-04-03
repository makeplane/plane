#!/usr/bin/env node

/**
 * Tests for fetch-docs.js
 */

const { buildContext7Url, getUrlVariations } = require('../fetch-docs');

// Test counter
let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✓ ${message}`);
    passed++;
  } else {
    console.error(`✗ ${message}`);
    failed++;
  }
}

function assertEqual(actual, expected, message) {
  if (actual === expected) {
    console.log(`✓ ${message}`);
    passed++;
  } else {
    console.error(`✗ ${message}`);
    console.error(`  Expected: ${expected}`);
    console.error(`  Actual: ${actual}`);
    failed++;
  }
}

console.log('Running fetch-docs.js tests...\n');

// Test buildContext7Url
console.log('## Testing buildContext7Url()');

assertEqual(
  buildContext7Url('vercel/next.js'),
  'https://context7.com/vercel/next.js/llms.txt',
  'Build URL for GitHub repo'
);

assertEqual(
  buildContext7Url('vercel/next.js', 'cache'),
  'https://context7.com/vercel/next.js/llms.txt?topic=cache',
  'Build URL with topic parameter'
);

assertEqual(
  buildContext7Url('shadcn-ui/ui', 'date'),
  'https://context7.com/shadcn-ui/ui/llms.txt?topic=date',
  'Build URL for shadcn with topic'
);

// Test getUrlVariations
console.log('\n## Testing getUrlVariations()');

async function testUrlVariations() {
  const urls1 = await getUrlVariations('next.js', 'cache');
  assert(urls1.length >= 2, 'Returns multiple URL variations with topic');
  assert(urls1[0].includes('?topic=cache'), 'First URL has topic parameter');
  assert(!urls1[1].includes('?topic='), 'Second URL has no topic parameter');

  const urls2 = await getUrlVariations('shadcn/ui');
  assert(urls2.length >= 1, 'Returns URL variations without topic');
  assert(!urls2[0].includes('?topic='), 'URL has no topic parameter');

  const urls3 = await getUrlVariations('astro', 'routing');
  assert(urls3.length >= 2, 'Returns variations for known library');
  assertEqual(urls3[0], 'https://context7.com/withastro/astro/llms.txt?topic=routing', 'Maps Astro correctly');
}

testUrlVariations().then(() => {
  // Summary
  console.log('\n## Test Summary');
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total: ${passed + failed}`);

  process.exit(failed > 0 ? 1 : 0);
});
