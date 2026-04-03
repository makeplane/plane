#!/usr/bin/env node
/**
 * Navigate to a URL
 * Usage: node navigate.js --url https://example.com [--wait-until networkidle2] [--timeout 30000]
 *        node navigate.js --url https://example.com --use-default-profile true
 *        node navigate.js --url https://example.com --profile "/path/to/chrome/profile"
 *        node navigate.js --url https://example.com/login --wait-for-login "/dashboard"
 *
 * Session behavior:
 *   --close false  : Keep browser running, disconnect from it (default for chaining)
 *   --close true   : Close browser completely and clear session
 *
 * Profile options (Chrome must be closed first):
 *   --use-default-profile true : Use Chrome's default profile with all cookies
 *   --profile <path>           : Use specific Chrome profile directory
 *   --browser-url <url>        : Connect to Chrome with remote debugging
 *
 * Interactive login (OAuth/SSO):
 *   --wait-for-login <pattern> : Open headed browser, wait for URL to match regex pattern
 *   --login-timeout <ms>       : Max wait time for login (default: 300000 = 5 min)
 */
import { getBrowser, getPage, closeBrowser, disconnectBrowser, saveAuthSession, parseArgs, outputJSON, outputError } from './lib/browser.js';

async function navigate() {
  const args = parseArgs(process.argv.slice(2));

  if (!args.url) {
    outputError(new Error('--url is required'));
    return;
  }

  try {
    // Force headed mode when waiting for interactive login
    const headless = args['wait-for-login'] ? false : args.headless;

    const browser = await getBrowser({
      headless,
      useDefaultProfile: args['use-default-profile'] === 'true',
      profile: args.profile,
      browserUrl: args['browser-url']
    });

    const page = await getPage(browser);

    const options = {
      waitUntil: args['wait-until'] || 'networkidle2',
      timeout: parseInt(args.timeout || '30000')
    };

    await page.goto(args.url, options);

    const result = {
      success: true,
      url: page.url(),
      title: await page.title()
    };

    // Interactive login: wait for user to complete OAuth/SSO flow
    if (args['wait-for-login']) {
      const pattern = args['wait-for-login'];
      const loginTimeout = parseInt(args['login-timeout'] || '300000');

      // Validate timeout value
      if (!Number.isFinite(loginTimeout) || loginTimeout <= 0) {
        outputError(new Error('--login-timeout must be a positive integer (ms)'));
        return;
      }

      // Validate regex pattern before use
      let regex;
      try {
        regex = new RegExp(pattern);
      } catch (e) {
        outputError(new Error(`Invalid regex pattern for --wait-for-login: ${e.message}`));
        return;
      }

      // Log to stderr so JSON output stays clean
      process.stderr.write(`[i] Browser opened for manual login. Complete the login flow.\n`);
      process.stderr.write(`[i] Waiting for URL to match: ${pattern} (timeout: ${loginTimeout / 1000}s)\n`);

      // Poll URL from Node side — survives page navigations during OAuth redirects
      const deadline = Date.now() + loginTimeout;
      let loginDetected = false;

      while (Date.now() < deadline) {
        try {
          const currentUrl = page.url();
          if (regex.test(currentUrl)) {
            loginDetected = true;
            break;
          }
        } catch {
          // Page may be mid-navigation, retry
        }
        await new Promise(r => setTimeout(r, 500));
      }

      if (loginDetected) {
        // Save session cookies after successful login
        const cookies = await page.cookies();
        if (cookies.length > 0) {
          saveAuthSession({ cookies });
          result.cookiesSaved = cookies.length;
        } else {
          process.stderr.write('[!] No cookies captured. Previous session preserved.\n');
          result.cookiesSaved = 0;
        }

        result.loginCompleted = true;
        result.url = page.url();
        result.title = await page.title();

        process.stderr.write(`[OK] Login detected. ${result.cookiesSaved} cookies saved for session reuse.\n`);
      } else {
        result.loginCompleted = false;
        result.loginError = `Login timeout after ${loginTimeout / 1000}s. URL did not match: ${pattern}`;
        process.stderr.write(`[X] Login timeout. URL never matched: ${pattern}\n`);
      }
    }

    outputJSON(result);

    // Default: disconnect to keep browser running for session persistence
    // Use --close true to fully close browser
    if (args.close === 'true') {
      await closeBrowser();
    } else {
      await disconnectBrowser();
    }
    process.exit(0);
  } catch (error) {
    outputError(error);
    process.exit(1);
  }
}

navigate();
