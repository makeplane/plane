#!/usr/bin/env node
/**
 * Import cookies from JSON file exported by browser extensions
 * Supports: EditThisCookie, Cookie-Editor, Netscape (txt) formats
 *
 * Usage:
 *   node import-cookies.js --file ./cookies.json --url https://example.com
 *   node import-cookies.js --file ./cookies.txt --format netscape --url https://example.com
 *
 * Workflow:
 *   1. Install "Cookie-Editor" or "EditThisCookie" Chrome extension
 *   2. Navigate to target site and log in manually
 *   3. Export cookies as JSON via extension
 *   4. Run this script to import into puppeteer session
 *   5. Use other scripts (screenshot, navigate) with authenticated session
 */
import fs from 'fs';
import { getBrowser, getPage, closeBrowser, disconnectBrowser, parseArgs, outputJSON, outputError, saveAuthSession } from './lib/browser.js';

/**
 * Parse cookies from EditThisCookie/Cookie-Editor JSON format
 * @param {Array} cookies - Array of cookie objects
 * @returns {Array} - Normalized cookie array for Puppeteer
 */
function parseJsonCookies(cookies) {
  return cookies.map(cookie => {
    // Handle different property names from various extensions
    const normalized = {
      name: cookie.name,
      value: cookie.value,
      domain: cookie.domain,
      path: cookie.path || '/',
      httpOnly: cookie.httpOnly ?? false,
      secure: cookie.secure ?? false,
      sameSite: cookie.sameSite || 'Lax'
    };

    // Handle expiration (different extensions use different names)
    if (cookie.expirationDate) {
      normalized.expires = cookie.expirationDate;
    } else if (cookie.expires) {
      normalized.expires = typeof cookie.expires === 'number'
        ? cookie.expires
        : new Date(cookie.expires).getTime() / 1000;
    }

    return normalized;
  });
}

/**
 * Parse Netscape cookie file format (used by curl, wget, etc.)
 * Format: domain\tflags\tpath\tsecure\texpiration\tname\tvalue
 * @param {string} content - Netscape format cookie file content
 * @returns {Array} - Normalized cookie array for Puppeteer
 */
function parseNetscapeCookies(content) {
  const cookies = [];
  const lines = content.split('\n');

  for (const line of lines) {
    // Skip comments and empty lines
    if (line.startsWith('#') || line.trim() === '') continue;

    const parts = line.split('\t');
    if (parts.length < 7) continue;

    const [domain, , path, secure, expires, name, value] = parts;

    cookies.push({
      name: name.trim(),
      value: value.trim(),
      domain: domain.trim(),
      path: path.trim() || '/',
      secure: secure.toUpperCase() === 'TRUE',
      httpOnly: false, // Netscape format doesn't include httpOnly
      expires: parseInt(expires, 10) || undefined,
      sameSite: 'Lax'
    });
  }

  return cookies;
}

/**
 * Detect cookie file format from content
 * @param {string} content - File content
 * @returns {string} - 'json' or 'netscape'
 */
function detectFormat(content) {
  const trimmed = content.trim();
  if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
    return 'json';
  }
  return 'netscape';
}

async function importCookies() {
  const args = parseArgs(process.argv.slice(2));

  if (!args.file) {
    outputError(new Error('--file is required (path to cookies file)'));
    return;
  }

  if (!args.url) {
    outputError(new Error('--url is required (target URL to apply cookies)'));
    return;
  }

  // Read cookie file
  let fileContent;
  try {
    fileContent = fs.readFileSync(args.file, 'utf8');
  } catch (e) {
    outputError(new Error(`Failed to read cookie file: ${e.message}`));
    return;
  }

  // Parse cookies based on format
  const format = args.format || detectFormat(fileContent);
  let cookies;

  try {
    if (format === 'json') {
      const parsed = JSON.parse(fileContent);
      // Handle both array and object with cookies property
      const cookieArray = Array.isArray(parsed) ? parsed : (parsed.cookies || []);
      cookies = parseJsonCookies(cookieArray);
    } else {
      cookies = parseNetscapeCookies(fileContent);
    }
  } catch (e) {
    outputError(new Error(`Failed to parse cookies (${format}): ${e.message}`));
    return;
  }

  if (cookies.length === 0) {
    outputError(new Error('No valid cookies found in file'));
    return;
  }

  try {
    const browser = await getBrowser({
      headless: args.headless
    });

    const page = await getPage(browser);

    // Navigate to URL first to establish domain context
    await page.goto(args.url, {
      waitUntil: args['wait-until'] || 'networkidle2',
      timeout: parseInt(args.timeout || '30000')
    });

    // Filter cookies by domain if --strict-domain is set
    let cookiesToApply = cookies;
    if (args['strict-domain']) {
      const urlDomain = new URL(args.url).hostname;
      cookiesToApply = cookies.filter(c => {
        const cookieDomain = c.domain.startsWith('.') ? c.domain.slice(1) : c.domain;
        return urlDomain.endsWith(cookieDomain);
      });
    }

    // Apply cookies
    await page.setCookie(...cookiesToApply);

    // Save to auth session for persistence
    saveAuthSession({ cookies: cookiesToApply });

    // Reload to apply cookies if --reload is set
    if (args.reload === 'true') {
      await page.reload({ waitUntil: 'networkidle2' });
    }

    const result = {
      success: true,
      file: args.file,
      format,
      url: args.url,
      imported: {
        total: cookiesToApply.length,
        names: cookiesToApply.map(c => c.name)
      },
      persisted: true,
      finalUrl: page.url(),
      title: await page.title()
    };

    outputJSON(result);

    // Default: disconnect to keep browser running
    if (args.close === 'true') {
      await closeBrowser();
    } else {
      await disconnectBrowser();
    }
    process.exit(0);
  } catch (error) {
    outputError(error);
  }
}

importCookies();
