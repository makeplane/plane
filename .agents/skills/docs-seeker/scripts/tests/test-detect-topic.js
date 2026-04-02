#!/usr/bin/env node

/**
 * Tests for detect-topic.js
 */

const { detectTopic, normalizeTopic, normalizeLibrary } = require('../detect-topic');

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

console.log('Running detect-topic.js tests...\n');

// Test normalizeTopic
console.log('## Testing normalizeTopic()');
assertEqual(normalizeTopic('date picker'), 'date', 'Normalize multi-word topic');
assertEqual(normalizeTopic('OAuth'), 'oauth', 'Normalize OAuth');
assertEqual(normalizeTopic('Server-Side'), 'server', 'Normalize Server-Side');
assertEqual(normalizeTopic('caching'), 'caching', 'Normalize caching');

// Test normalizeLibrary
console.log('\n## Testing normalizeLibrary()');
assertEqual(normalizeLibrary('Next.js'), 'next.js', 'Normalize Next.js');
assertEqual(normalizeLibrary('shadcn/ui'), 'shadcn/ui', 'Normalize shadcn/ui');
assertEqual(normalizeLibrary('Better Auth'), 'better-auth', 'Normalize Better Auth');

// Test topic-specific queries
console.log('\n## Testing topic-specific queries');

const topicQuery1 = detectTopic('How do I use date picker in shadcn/ui?');
assert(topicQuery1 !== null, 'Detect topic-specific query 1');
assert(topicQuery1.isTopicSpecific === true, 'Query 1 is topic-specific');
assertEqual(topicQuery1.topic, 'date', 'Query 1 topic is "date"');
assertEqual(topicQuery1.library, 'shadcn/ui', 'Query 1 library is "shadcn/ui"');

const topicQuery2 = detectTopic('Next.js caching strategies');
assert(topicQuery2 !== null, 'Detect topic-specific query 2');
assert(topicQuery2 && topicQuery2.isTopicSpecific === true, 'Query 2 is topic-specific');
if (topicQuery2) {
  assertEqual(topicQuery2.topic, 'caching', 'Query 2 topic is "caching"');
  assertEqual(topicQuery2.library, 'next.js', 'Query 2 library is "next.js"');
}

const topicQuery3 = detectTopic('Better Auth OAuth setup');
assert(topicQuery3 !== null, 'Detect topic-specific query 3');
assert(topicQuery3.isTopicSpecific === true, 'Query 3 is topic-specific');

const topicQuery4 = detectTopic('Using authentication with Better Auth');
assert(topicQuery4 !== null, 'Detect topic-specific query 4');
assert(topicQuery4.isTopicSpecific === true, 'Query 4 is topic-specific');

const topicQuery5 = detectTopic('Implement routing in Next.js');
assert(topicQuery5 !== null, 'Detect topic-specific query 5');
assert(topicQuery5.isTopicSpecific === true, 'Query 5 is topic-specific');

// Test general queries
console.log('\n## Testing general queries');

const generalQuery1 = detectTopic('Documentation for Next.js');
assert(generalQuery1 === null, 'Detect general query 1 (returns null)');

const generalQuery2 = detectTopic('Astro getting started');
assert(generalQuery2 === null, 'Detect general query 2 (returns null)');

const generalQuery3 = detectTopic('How to use Better Auth');
assert(generalQuery3 === null, 'Detect general query 3 (returns null)');

const generalQuery4 = detectTopic('Next.js API reference');
assert(generalQuery4 === null, 'Detect general query 4 (returns null)');

// Test edge cases
console.log('\n## Testing edge cases');

const edgeCase1 = detectTopic('');
assert(edgeCase1 === null, 'Empty string returns null');

const edgeCase2 = detectTopic(null);
assert(edgeCase2 === null, 'Null returns null');

const edgeCase3 = detectTopic('Random text without pattern');
assert(edgeCase3 === null, 'Non-matching query returns null');

// Summary
console.log('\n## Test Summary');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log(`Total: ${passed + failed}`);

process.exit(failed > 0 ? 1 : 0);
