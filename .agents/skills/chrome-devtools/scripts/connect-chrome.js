#!/usr/bin/env node
/**
 * Connect to an existing Chrome browser launched with remote debugging
 *
 * Two-step workflow:
 *   1. User launches Chrome with: chrome --remote-debugging-port=9222
 *   2. Connect with this script: node connect-chrome.js --browser-url http://localhost:9222
 *
 * Or launch Chrome automatically:
 *   node connect-chrome.js --launch --port 9222
 *
 * This is useful for:
 *   - Debugging (can see browser window while scripts run)
 *   - Using existing Chrome session with all logged-in accounts
 *   - Avoiding Puppeteer's bundled Chromium
 */
import { spawn } from 'child_process';
import { getBrowser, getPage, disconnectBrowser, parseArgs, outputJSON, outputError } from './lib/browser.js';

/**
 * Get Chrome executable path based on OS
 * @returns {string} - Path to Chrome executable
 */
function getChromeExecutablePath() {
  switch (process.platform) {
    case 'darwin':
      return '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
    case 'win32':
      // Try common installation paths
      const paths = [
        `${process.env['PROGRAMFILES']}/Google/Chrome/Application/chrome.exe`,
        `${process.env['PROGRAMFILES(X86)']}/Google/Chrome/Application/chrome.exe`,
        `${process.env.LOCALAPPDATA}/Google/Chrome/Application/chrome.exe`
      ];
      // Return first path (user should have Chrome installed in standard location)
      return paths[0];
    default: // Linux
      return 'google-chrome';
  }
}

/**
 * Launch Chrome with remote debugging enabled
 * @param {number} port - Debug port (default 9222)
 * @returns {Promise<ChildProcess>}
 */
function launchChromeWithDebugging(port = 9222) {
  const chromePath = getChromeExecutablePath();
  const args = [
    `--remote-debugging-port=${port}`,
    '--no-first-run',
    '--no-default-browser-check'
  ];

  const chrome = spawn(chromePath, args, {
    detached: true,
    stdio: 'ignore'
  });

  chrome.unref();
  return chrome;
}

/**
 * Wait for Chrome debug endpoint to be ready
 * @param {string} browserUrl - Browser debug URL
 * @param {number} timeout - Max wait time in ms
 * @returns {Promise<boolean>}
 */
async function waitForDebugEndpoint(browserUrl, timeout = 10000) {
  const start = Date.now();
  const checkUrl = `${browserUrl}/json/version`;

  while (Date.now() - start < timeout) {
    try {
      const response = await fetch(checkUrl);
      if (response.ok) return true;
    } catch {
      // Not ready yet
    }
    await new Promise(r => setTimeout(r, 500));
  }
  return false;
}

async function connectChrome() {
  const args = parseArgs(process.argv.slice(2));
  const port = parseInt(args.port || '9222');
  const browserUrl = args['browser-url'] || `http://localhost:${port}`;

  try {
    // Launch Chrome if requested
    if (args.launch) {
      launchChromeWithDebugging(port);

      // Wait for debug endpoint
      const ready = await waitForDebugEndpoint(browserUrl);
      if (!ready) {
        outputError(new Error(`Chrome did not start within timeout. Check if port ${port} is available.`));
        return;
      }
    }

    // Connect to Chrome via browserUrl
    const browser = await getBrowser({ browserUrl });
    const page = await getPage(browser);

    // Navigate if URL provided
    if (args.url) {
      await page.goto(args.url, {
        waitUntil: args['wait-until'] || 'networkidle2',
        timeout: parseInt(args.timeout || '30000')
      });
    }

    const result = {
      success: true,
      browserUrl,
      connected: true,
      url: page.url(),
      title: await page.title(),
      hint: args.launch
        ? 'Chrome launched with debugging. Browser window is visible.'
        : 'Connected to existing Chrome instance.'
    };

    outputJSON(result);

    // Default: disconnect to keep browser running
    await disconnectBrowser();
    process.exit(0);
  } catch (error) {
    // Provide helpful error message
    if (error.message.includes('ECONNREFUSED')) {
      outputError(new Error(
        `Could not connect to Chrome at ${browserUrl}. ` +
        `Make sure Chrome is running with: ` +
        `chrome --remote-debugging-port=${port}`
      ));
    } else {
      outputError(error);
    }
  }
}

connectChrome();
