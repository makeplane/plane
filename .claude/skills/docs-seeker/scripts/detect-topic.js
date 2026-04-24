#!/usr/bin/env node

/**
 * Topic Detection Script
 * Analyzes user queries to extract library name and topic keywords
 * Returns null for general queries, topic info for specific queries
 */

const { loadEnv } = require('./utils/env-loader');

// Load environment
const env = loadEnv();
const DEBUG = env.DEBUG === 'true';

/**
 * Topic-specific query patterns
 */
const TOPIC_PATTERNS = [
  // "How do I use X in Y?"
  /how (?:do i|to|can i) (?:use|implement|add|setup|configure) (?:the )?(.+?) (?:in|with|for) (.+)/i,

  // "Y X strategies/patterns" - e.g., "Next.js caching strategies"
  /(.+?) (.+?) (?:strategies|patterns|techniques|methods|approaches)/i,

  // "X Y documentation" or "Y X docs"
  /(.+?) (.+?) (?:documentation|docs|guide|tutorial)/i,

  // "Using X with Y"
  /using (.+?) (?:with|in|for) (.+)/i,

  // "Y X guide/implementation/setup"
  /(.+?) (.+?) (?:guide|implementation|setup|configuration)/i,

  // "Implement X in Y"
  /implement(?:ing)? (.+?) (?:in|with|for|using) (.+)/i,
];

/**
 * General library query patterns (non-topic specific)
 */
const GENERAL_PATTERNS = [
  /(?:documentation|docs) for (.+)/i,
  /(.+?) (?:getting started|quick ?start|introduction)/i,
  /(?:how to use|learn) (.+)/i,
  /(.+?) (?:api reference|overview|basics)/i,
];

/**
 * Normalize topic keyword
 * @param {string} topic - Raw topic string
 * @returns {string} Normalized topic keyword
 */
function normalizeTopic(topic) {
  return topic
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')  // Remove special chars
    .replace(/\s+/g, '-')          // Replace spaces with hyphens
    .split('-')[0]                 // Take first word for multi-word topics
    .slice(0, 20);                 // Limit length
}

/**
 * Normalize library name
 * @param {string} library - Raw library string
 * @returns {string} Normalized library name
 */
function normalizeLibrary(library) {
  return library
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s\-\/\.]/g, '')
    .replace(/\s+/g, '-');
}

/**
 * Detect if query is topic-specific or general
 * @param {string} query - User query
 * @returns {Object|null} Topic info or null for general query
 */
function detectTopic(query) {
  if (!query || typeof query !== 'string') {
    return null;
  }

  const trimmedQuery = query.trim();

  // Check general patterns first
  for (const pattern of GENERAL_PATTERNS) {
    const match = trimmedQuery.match(pattern);
    if (match) {
      if (DEBUG) console.error('[DEBUG] Matched general pattern, no topic');
      return null;
    }
  }

  // Check topic-specific patterns
  for (let i = 0; i < TOPIC_PATTERNS.length; i++) {
    const pattern = TOPIC_PATTERNS[i];
    const match = trimmedQuery.match(pattern);
    if (match) {
      const [, term1, term2] = match;

      // Determine which is library and which is topic based on pattern
      let topic, library;

      // Pattern 0: "How do I use X in Y?" -> X is topic, Y is library
      // Pattern 1: "Y X strategies" -> X is topic, Y is library
      // Pattern 2-5: X is topic, Y is library in most cases

      // For pattern 1 (strategies/patterns), term1 is library, term2 is topic
      if (i === 1) {
        topic = normalizeTopic(term2);
        library = normalizeLibrary(term1);
      } else {
        // For other patterns, term1 is topic, term2 is library
        topic = normalizeTopic(term1);
        library = normalizeLibrary(term2);
      }

      if (DEBUG) {
        console.error('[DEBUG] Matched topic pattern');
        console.error('[DEBUG] Topic:', topic);
        console.error('[DEBUG] Library:', library);
      }

      return {
        query: trimmedQuery,
        topic,
        library,
        isTopicSpecific: true,
      };
    }
  }

  if (DEBUG) console.error('[DEBUG] No pattern matched, treating as general');
  return null;
}

/**
 * CLI entry point
 */
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: node detect-topic.js "<user query>"');
    process.exit(1);
  }

  const query = args.join(' ');
  const result = detectTopic(query);

  if (result) {
    console.log(JSON.stringify(result, null, 2));
    process.exit(0);
  } else {
    console.log(JSON.stringify({ isTopicSpecific: false }, null, 2));
    process.exit(0);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  detectTopic,
  normalizeTopic,
  normalizeLibrary,
};
