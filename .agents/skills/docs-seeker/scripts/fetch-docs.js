#!/usr/bin/env node

/**
 * Documentation Fetcher Script
 * Fetches documentation from context7.com with topic support and fallback chain
 */

const https = require('https');
const { loadEnv } = require('./utils/env-loader');
const { detectTopic } = require('./detect-topic');

// Load environment
const env = loadEnv();
const DEBUG = env.DEBUG === 'true';
const API_KEY = env.CONTEXT7_API_KEY;

/**
 * Make HTTPS GET request
 * @param {string} url - URL to fetch
 * @returns {Promise<string>} Response body
 */
function httpsGet(url) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: API_KEY ? { 'Authorization': `Bearer ${API_KEY}` } : {},
    };

    https.get(url, options, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve(data);
        } else if (res.statusCode === 404) {
          resolve(null);
        } else {
          reject(new Error(`HTTP ${res.statusCode}: ${data}`));
        }
      });
    }).on('error', reject);
  });
}

/**
 * Construct context7.com URL
 * @param {string} library - Library name (e.g., "next.js", "shadcn/ui")
 * @param {string} topic - Optional topic keyword
 * @returns {string} context7.com URL
 */
function buildContext7Url(library, topic = null) {
  // Determine if GitHub repo or website
  let basePath;

  if (library.includes('/')) {
    // GitHub repo format: org/repo
    const [org, repo] = library.split('/');
    basePath = `${org}/${repo}`;
  } else {
    // Try common patterns
    const normalized = library.toLowerCase().replace(/[^a-z0-9-]/g, '');
    basePath = `websites/${normalized}`;
  }

  const baseUrl = `https://context7.com/${basePath}/llms.txt`;

  if (topic) {
    return `${baseUrl}?topic=${encodeURIComponent(topic)}`;
  }

  return baseUrl;
}

/**
 * Try multiple URL variations for a library
 * @param {string} library - Library name
 * @param {string} topic - Optional topic
 * @returns {Promise<Array>} Array of URLs to try
 */
async function getUrlVariations(library, topic = null) {
  const urls = [];

  // Known repo mappings
  const knownRepos = {
    'next.js': 'vercel/next.js',
    'nextjs': 'vercel/next.js',
    'remix': 'remix-run/remix',
    'astro': 'withastro/astro',
    'shadcn': 'shadcn-ui/ui',
    'shadcn/ui': 'shadcn-ui/ui',
    'better-auth': 'better-auth/better-auth',
  };

  const normalized = library.toLowerCase();
  const repo = knownRepos[normalized] || library;

  // Primary: Try with topic if available
  if (topic) {
    urls.push(buildContext7Url(repo, topic));
  }

  // Fallback: Try without topic
  urls.push(buildContext7Url(repo));

  return urls;
}

/**
 * Fetch documentation from context7.com
 * @param {string} query - User query
 * @returns {Promise<Object>} Documentation result
 */
async function fetchDocs(query) {
  const topicInfo = detectTopic(query);

  if (DEBUG) {
    console.error('[DEBUG] Topic detection result:', topicInfo);
  }

  let urls = [];

  if (topicInfo && topicInfo.isTopicSpecific) {
    // Topic-specific search
    urls = await getUrlVariations(topicInfo.library, topicInfo.topic);

    if (DEBUG) {
      console.error('[DEBUG] Topic-specific URLs:', urls);
    }
  } else {
    // Extract library from general query
    const libraryMatch = query.match(/(?:documentation|docs|guide) (?:for )?(.+)/i);
    if (libraryMatch) {
      const library = libraryMatch[1].trim();
      urls = await getUrlVariations(library);

      if (DEBUG) {
        console.error('[DEBUG] General library URLs:', urls);
      }
    }
  }

  // Try each URL
  for (const url of urls) {
    if (DEBUG) {
      console.error(`[DEBUG] Trying URL: ${url}`);
    }

    try {
      const content = await httpsGet(url);

      if (content) {
        return {
          success: true,
          source: 'context7.com',
          url,
          content,
          topicSpecific: url.includes('?topic='),
        };
      }
    } catch (error) {
      if (DEBUG) {
        console.error(`[DEBUG] Failed to fetch ${url}:`, error.message);
      }
    }
  }

  // No URL worked
  return {
    success: false,
    source: 'context7.com',
    error: 'Documentation not found on context7.com',
    urls,
    suggestion: 'Try repository analysis or web search',
  };
}

/**
 * CLI entry point
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error('Usage: node fetch-docs.js "<user query>"');
    process.exit(1);
  }

  const query = args.join(' ');

  try {
    const result = await fetchDocs(query);
    console.log(JSON.stringify(result, null, 2));
    process.exit(result.success ? 0 : 1);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = {
  fetchDocs,
  buildContext7Url,
  getUrlVariations,
  httpsGet,
};
