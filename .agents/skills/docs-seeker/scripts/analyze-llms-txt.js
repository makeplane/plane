#!/usr/bin/env node

/**
 * llms.txt Analyzer Script
 * Parses llms.txt content and categorizes URLs for optimal agent distribution
 */

const { loadEnv } = require('./utils/env-loader');

// Load environment
const env = loadEnv();
const DEBUG = env.DEBUG === 'true';

/**
 * URL priority categories
 */
const PRIORITY_KEYWORDS = {
  critical: [
    'getting-started', 'quick-start', 'quickstart', 'introduction', 'intro', 'overview',
    'installation', 'install', 'setup', 'basics', 'core-concepts', 'fundamentals',
  ],
  supplementary: [
    'advanced', 'internals', 'migration', 'migrate', 'troubleshooting', 'troubleshoot',
    'faq', 'frequently-asked', 'changelog', 'contributing', 'contribute',
  ],
  important: [
    'guide', 'tutorial', 'example', 'api-reference', 'api', 'reference',
    'configuration', 'config', 'routing', 'route', 'data-fetching', 'authentication', 'auth',
  ],
};

/**
 * Categorize URL by priority
 * @param {string} url - Documentation URL
 * @returns {string} Priority level (critical/important/supplementary)
 */
function categorizeUrl(url) {
  const urlLower = url.toLowerCase();

  // Check in priority order: critical first, then supplementary, then important
  // This ensures specific keywords (advanced, internals) are caught before generic ones
  const priorities = ['critical', 'supplementary', 'important'];

  for (const priority of priorities) {
    const keywords = PRIORITY_KEYWORDS[priority];
    for (const keyword of keywords) {
      if (urlLower.includes(keyword)) {
        return priority;
      }
    }
  }

  return 'important'; // Default
}

/**
 * Parse llms.txt content to extract URLs
 * @param {string} content - llms.txt content
 * @returns {Array<string>} Array of URLs
 */
function parseUrls(content) {
  if (!content || typeof content !== 'string') {
    return [];
  }

  const urls = [];
  const lines = content.split('\n');

  for (const line of lines) {
    const trimmed = line.trim();

    // Skip comments and empty lines
    if (!trimmed || trimmed.startsWith('#')) continue;

    // Extract URLs (look for http/https)
    const urlMatch = trimmed.match(/https?:\/\/[^\s<>"]+/i);
    if (urlMatch) {
      urls.push(urlMatch[0]);
    }
  }

  return urls;
}

/**
 * Group URLs by priority
 * @param {Array<string>} urls - Array of URLs
 * @returns {Object} URLs grouped by priority
 */
function groupByPriority(urls) {
  const groups = {
    critical: [],
    important: [],
    supplementary: [],
  };

  for (const url of urls) {
    const priority = categorizeUrl(url);
    groups[priority].push(url);
  }

  return groups;
}

/**
 * Suggest optimal agent distribution
 * @param {number} urlCount - Total number of URLs
 * @returns {Object} Agent distribution suggestion
 */
function suggestAgentDistribution(urlCount) {
  if (urlCount <= 3) {
    return {
      agentCount: 1,
      strategy: 'single',
      urlsPerAgent: urlCount,
      description: 'Single agent can handle all URLs',
    };
  } else if (urlCount <= 10) {
    const agents = Math.min(Math.ceil(urlCount / 2), 5);
    return {
      agentCount: agents,
      strategy: 'parallel',
      urlsPerAgent: Math.ceil(urlCount / agents),
      description: `Deploy ${agents} agents in parallel`,
    };
  } else if (urlCount <= 20) {
    return {
      agentCount: 7,
      strategy: 'parallel',
      urlsPerAgent: Math.ceil(urlCount / 7),
      description: 'Deploy 7 agents with balanced workload',
    };
  } else {
    return {
      agentCount: 7,
      strategy: 'phased',
      urlsPerAgent: Math.ceil(urlCount / 7),
      phases: 2,
      description: 'Use two-phase approach: critical first, then important',
    };
  }
}

/**
 * Analyze llms.txt content
 * @param {string} content - llms.txt content
 * @returns {Object} Analysis result
 */
function analyzeLlmsTxt(content) {
  const urls = parseUrls(content);
  const grouped = groupByPriority(urls);
  const distribution = suggestAgentDistribution(urls.length);

  return {
    totalUrls: urls.length,
    urls,
    grouped,
    distribution,
    summary: {
      critical: grouped.critical.length,
      important: grouped.important.length,
      supplementary: grouped.supplementary.length,
    },
  };
}

/**
 * CLI entry point
 */
function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: node analyze-llms-txt.js <content-file-or-stdin>');
    console.error('Or pipe content: cat llms.txt | node analyze-llms-txt.js');
    process.exit(1);
  }

  const fs = require('fs');
  let content;

  if (args[0] === '-') {
    // Read from stdin
    content = fs.readFileSync(0, 'utf8');
  } else {
    // Read from file
    const filePath = args[0];
    if (!fs.existsSync(filePath)) {
      console.error(`Error: File not found: ${filePath}`);
      process.exit(1);
    }
    content = fs.readFileSync(filePath, 'utf8');
  }

  const result = analyzeLlmsTxt(content);
  console.log(JSON.stringify(result, null, 2));
  process.exit(0);
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  analyzeLlmsTxt,
  parseUrls,
  groupByPriority,
  categorizeUrl,
  suggestAgentDistribution,
};
