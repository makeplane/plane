#!/usr/bin/env node
/**
 * Inject authentication cookies/tokens into browser session
 * Usage: node inject-auth.js --url https://example.com --cookies '[{"name":"token","value":"xxx","domain":".example.com"}]'
 *        node inject-auth.js --url https://example.com --token "Bearer xxx" [--header Authorization]
 *        node inject-auth.js --url https://example.com --local-storage '{"key":"value"}'
 *        node inject-auth.js --url https://example.com --session-storage '{"key":"value"}'
 *
 * This script injects authentication data into browser session for testing protected routes.
 * The session persists across script executions until --close true is used.
 *
 * Workflow for testing protected routes:
 *   1. User manually logs into the site in their browser
 *   2. User extracts cookies/tokens from browser DevTools
 *   3. Run this script to inject auth into puppeteer session
 *   4. Run other scripts (screenshot, navigate, etc.) which will use authenticated session
 *
 * Session behavior:
 *   --close false  : Keep browser running (default for chaining)
 *   --close true   : Close browser completely and clear session
 */
import { getBrowser, getPage, closeBrowser, disconnectBrowser, parseArgs, outputJSON, outputError, saveAuthSession, clearAuthSession } from './lib/browser.js';

/**
 * Parse cookies from JSON string or file
 * @param {string} cookiesInput - JSON string or file path
 * @returns {Array} - Array of cookie objects
 */
function parseCookies(cookiesInput) {
  try {
    // Try parsing as JSON string
    return JSON.parse(cookiesInput);
  } catch {
    throw new Error(`Invalid cookies format. Expected JSON array: [{"name":"cookie_name","value":"cookie_value","domain":".example.com"}]`);
  }
}

/**
 * Parse storage data from JSON string
 * @param {string} storageInput - JSON string
 * @returns {Object} - Storage key-value pairs
 */
function parseStorage(storageInput) {
  try {
    return JSON.parse(storageInput);
  } catch {
    throw new Error(`Invalid storage format. Expected JSON object: {"key":"value"}`);
  }
}

async function injectAuth() {
  const args = parseArgs(process.argv.slice(2));

  if (!args.url) {
    outputError(new Error('--url is required (base URL for the protected site)'));
    return;
  }

  // Validate at least one auth method provided
  if (!args.cookies && !args.token && !args['local-storage'] && !args['session-storage']) {
    outputError(new Error('At least one auth method required: --cookies, --token, --local-storage, or --session-storage'));
    return;
  }

  try {
    const browser = await getBrowser({
      headless: args.headless
    });

    const page = await getPage(browser);

    // Navigate to the URL first to set the domain context
    await page.goto(args.url, {
      waitUntil: args['wait-until'] || 'networkidle2',
      timeout: parseInt(args.timeout || '30000')
    });

    const result = {
      success: true,
      url: args.url,
      injected: []
    };

    // Inject cookies
    if (args.cookies) {
      const cookies = parseCookies(args.cookies);

      // Validate and normalize cookies
      const normalizedCookies = cookies.map(cookie => {
        if (!cookie.name || !cookie.value) {
          throw new Error(`Cookie must have 'name' and 'value' properties`);
        }

        // Extract domain from URL if not provided
        if (!cookie.domain) {
          const urlObj = new URL(args.url);
          cookie.domain = urlObj.hostname;
        }

        return {
          name: cookie.name,
          value: cookie.value,
          domain: cookie.domain,
          path: cookie.path || '/',
          httpOnly: cookie.httpOnly !== undefined ? cookie.httpOnly : false,
          secure: cookie.secure !== undefined ? cookie.secure : args.url.startsWith('https'),
          sameSite: cookie.sameSite || 'Lax',
          ...(cookie.expires && { expires: cookie.expires })
        };
      });

      await page.setCookie(...normalizedCookies);
      result.injected.push({
        type: 'cookies',
        count: normalizedCookies.length,
        names: normalizedCookies.map(c => c.name)
      });
    }

    // Inject Bearer token via localStorage (common pattern)
    if (args.token) {
      const tokenKey = args['token-key'] || 'access_token';
      const token = args.token.startsWith('Bearer ') ? args.token.slice(7) : args.token;

      await page.evaluate((key, value) => {
        localStorage.setItem(key, value);
      }, tokenKey, token);

      result.injected.push({
        type: 'token',
        key: tokenKey,
        storage: 'localStorage'
      });

      // Also set Authorization header for future requests if header option provided
      if (args.header) {
        await page.setExtraHTTPHeaders({
          [args.header]: args.token.startsWith('Bearer ') ? args.token : `Bearer ${args.token}`
        });
        result.injected.push({
          type: 'header',
          name: args.header
        });
      }
    }

    // Inject localStorage items
    if (args['local-storage']) {
      const storageData = parseStorage(args['local-storage']);

      await page.evaluate((data) => {
        Object.entries(data).forEach(([key, value]) => {
          localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
        });
      }, storageData);

      result.injected.push({
        type: 'localStorage',
        keys: Object.keys(storageData)
      });
    }

    // Inject sessionStorage items
    if (args['session-storage']) {
      const storageData = parseStorage(args['session-storage']);

      await page.evaluate((data) => {
        Object.entries(data).forEach(([key, value]) => {
          sessionStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
        });
      }, storageData);

      result.injected.push({
        type: 'sessionStorage',
        keys: Object.keys(storageData)
      });
    }

    // Reload page to apply auth (optional, use --reload true)
    if (args.reload === 'true') {
      await page.reload({ waitUntil: 'networkidle2' });
      result.reloaded = true;
    }

    // Save auth session to file for persistence across script executions
    const authSessionData = {};

    if (args.cookies) {
      authSessionData.cookies = parseCookies(args.cookies);
    }
    if (args['local-storage']) {
      authSessionData.localStorage = parseStorage(args['local-storage']);
    }
    if (args['session-storage']) {
      authSessionData.sessionStorage = parseStorage(args['session-storage']);
    }
    if (args.token && args.header) {
      authSessionData.headers = {
        [args.header]: args.token.startsWith('Bearer ') ? args.token : `Bearer ${args.token}`
      };
    }

    // Clear existing auth if --clear flag used
    if (args.clear === 'true') {
      clearAuthSession();
      result.cleared = true;
    } else if (Object.keys(authSessionData).length > 0) {
      saveAuthSession(authSessionData);
      result.persisted = true;
    }

    // Verify auth by checking page title and URL after injection
    result.finalUrl = page.url();
    result.title = await page.title();

    outputJSON(result);

    // Default: disconnect to keep browser running for session persistence
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

injectAuth();
