/**
 * Shared browser utilities for Chrome DevTools scripts
 * Supports persistent browser sessions via WebSocket endpoint file
 */
import puppeteer from 'puppeteer';
import debug from 'debug';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const log = debug('chrome-devtools:browser');

// Session file stores WebSocket endpoint for browser reuse across processes
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SESSION_FILE = path.join(__dirname, '..', '.browser-session.json');
const AUTH_SESSION_FILE = path.join(__dirname, '..', '.auth-session.json');

let browserInstance = null;
let pageInstance = null;

/**
 * Resolve headless mode based on explicit value or OS auto-detection.
 * - Explicit 'true'/'false' or boolean always wins
 * - CI environments (CI, GITHUB_ACTIONS, GITLAB_CI, JENKINS_URL) → headless
 * - Linux → headless (servers/WSL typically have no display)
 * - macOS/Windows → headed for better debugging
 * @param {string|boolean|undefined} value - CLI arg value or boolean
 * @returns {boolean} - true for headless, false for headed
 */
export function resolveHeadless(value) {
  if (value === false || value === 'false') return false;
  if (value === true || value === 'true') return true;

  // Auto-detect: CI → headless
  if (process.env.CI || process.env.GITHUB_ACTIONS || process.env.GITLAB_CI || process.env.JENKINS_URL) {
    log('Auto-detected CI environment → headless');
    return true;
  }

  // Linux → headless (includes WSL, remote servers)
  if (process.platform === 'linux') {
    log('Auto-detected Linux → headless');
    return true;
  }

  // macOS/Windows → headed for debugging
  log(`Auto-detected ${process.platform} → headed`);
  return false;
}

/**
 * Get default Chrome profile path based on OS
 * @returns {string} - Path to Chrome's default user data directory
 */
function getDefaultChromeProfilePath() {
  switch (process.platform) {
    case 'darwin':
      return `${process.env.HOME}/Library/Application Support/Google/Chrome`;
    case 'win32':
      return `${process.env.LOCALAPPDATA}/Google/Chrome/User Data`;
    default: // Linux and others
      return `${process.env.HOME}/.config/google-chrome`;
  }
}

/**
 * Read session info from file
 */
function readSession() {
  try {
    if (fs.existsSync(SESSION_FILE)) {
      const data = JSON.parse(fs.readFileSync(SESSION_FILE, 'utf8'));
      // Check if session is not too old (max 1 hour)
      if (Date.now() - data.timestamp < 3600000) {
        return data;
      }
    }
  } catch (e) {
    log('Failed to read session:', e.message);
  }
  return null;
}

/**
 * Write session info to file
 */
function writeSession(wsEndpoint) {
  try {
    fs.writeFileSync(SESSION_FILE, JSON.stringify({
      wsEndpoint,
      timestamp: Date.now()
    }));
  } catch (e) {
    log('Failed to write session:', e.message);
  }
}

/**
 * Clear session file
 */
function clearSession() {
  try {
    if (fs.existsSync(SESSION_FILE)) {
      fs.unlinkSync(SESSION_FILE);
    }
  } catch (e) {
    log('Failed to clear session:', e.message);
  }
}

/**
 * Save auth session (cookies, storage) for persistence
 * @param {Object} authData - Auth data to save
 */
export function saveAuthSession(authData) {
  try {
    const existing = readAuthSession() || {};
    const merged = { ...existing, ...authData, timestamp: Date.now() };
    fs.writeFileSync(AUTH_SESSION_FILE, JSON.stringify(merged, null, 2));
    log('Auth session saved');
  } catch (e) {
    log('Failed to save auth session:', e.message);
  }
}

/**
 * Read auth session from file
 * @returns {Object|null} - Auth session data or null
 */
export function readAuthSession() {
  try {
    if (fs.existsSync(AUTH_SESSION_FILE)) {
      const data = JSON.parse(fs.readFileSync(AUTH_SESSION_FILE, 'utf8'));
      // Auth sessions valid for 24 hours
      if (Date.now() - data.timestamp < 86400000) {
        return data;
      }
    }
  } catch (e) {
    log('Failed to read auth session:', e.message);
  }
  return null;
}

/**
 * Clear auth session file
 */
export function clearAuthSession() {
  try {
    if (fs.existsSync(AUTH_SESSION_FILE)) {
      fs.unlinkSync(AUTH_SESSION_FILE);
      log('Auth session cleared');
    }
  } catch (e) {
    log('Failed to clear auth session:', e.message);
  }
}

/**
 * Apply saved auth session to page
 * @param {Object} page - Puppeteer page instance
 * @param {string} url - Target URL for domain context
 */
export async function applyAuthSession(page, url) {
  const authData = readAuthSession();
  if (!authData) {
    log('No auth session found');
    return false;
  }

  try {
    // Apply cookies
    if (authData.cookies && authData.cookies.length > 0) {
      await page.setCookie(...authData.cookies);
      log(`Applied ${authData.cookies.length} cookies`);
    }

    // Apply localStorage (requires navigation first)
    if (authData.localStorage && Object.keys(authData.localStorage).length > 0) {
      await page.evaluate((data) => {
        Object.entries(data).forEach(([key, value]) => {
          localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
        });
      }, authData.localStorage);
      log('Applied localStorage data');
    }

    // Apply sessionStorage
    if (authData.sessionStorage && Object.keys(authData.sessionStorage).length > 0) {
      await page.evaluate((data) => {
        Object.entries(data).forEach(([key, value]) => {
          sessionStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value));
        });
      }, authData.sessionStorage);
      log('Applied sessionStorage data');
    }

    // Apply extra headers
    if (authData.headers) {
      await page.setExtraHTTPHeaders(authData.headers);
      log('Applied HTTP headers');
    }

    return true;
  } catch (e) {
    log('Failed to apply auth session:', e.message);
    return false;
  }
}

/**
 * Launch or connect to browser
 * If a session file exists with valid wsEndpoint, connects to existing browser
 * Otherwise launches new browser and saves wsEndpoint for future connections
 */
export async function getBrowser(options = {}) {
  // If we already have a connected browser in this process, reuse it
  if (browserInstance && browserInstance.isConnected()) {
    log('Reusing existing browser instance from process');
    return browserInstance;
  }

  // Try to connect to existing browser from session file
  const session = readSession();
  if (session && session.wsEndpoint) {
    try {
      log('Attempting to connect to existing browser session');
      browserInstance = await puppeteer.connect({
        browserWSEndpoint: session.wsEndpoint
      });
      log('Connected to existing browser');
      return browserInstance;
    } catch (e) {
      log('Failed to connect to existing browser:', e.message);
      clearSession();
    }
  }

  // Connect via provided wsEndpoint or browserUrl
  if (options.wsEndpoint || options.browserUrl) {
    log('Connecting to browser via provided endpoint');
    browserInstance = await puppeteer.connect({
      browserWSEndpoint: options.wsEndpoint,
      browserURL: options.browserUrl
    });
    return browserInstance;
  }

  // Resolve Chrome profile path
  let userDataDir = options.userDataDir || options.profile;
  if (options.useDefaultProfile) {
    userDataDir = getDefaultChromeProfilePath();
    log(`Using default Chrome profile: ${userDataDir}`);
  }

  // Destructure known properties — only pass Puppeteer-valid options to launch()
  const { headless, args: extraArgs, viewport, useDefaultProfile, profile, browserUrl, wsEndpoint: _ws, userDataDir: _udd, ...restOptions } = options;

  // Launch new browser
  const launchOptions = {
    headless: resolveHeadless(headless),
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      ...(extraArgs || [])
    ],
    defaultViewport: viewport || {
      width: 1920,
      height: 1080
    },
    ...(userDataDir && { userDataDir }),
    ...restOptions
  };

  log('Launching new browser');
  browserInstance = await puppeteer.launch(launchOptions);

  // Save wsEndpoint for future connections
  const wsEndpoint = browserInstance.wsEndpoint();
  writeSession(wsEndpoint);
  log('Browser launched, session saved');

  return browserInstance;
}

/**
 * Get current page or create new one
 */
export async function getPage(browser) {
  if (pageInstance && !pageInstance.isClosed()) {
    log('Reusing existing page');
    return pageInstance;
  }

  const pages = await browser.pages();
  if (pages.length > 0) {
    pageInstance = pages[0];
  } else {
    pageInstance = await browser.newPage();
  }

  return pageInstance;
}

/**
 * Close browser and clear session
 */
export async function closeBrowser() {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
    pageInstance = null;
    clearSession();
    log('Browser closed, session cleared');
  }
}

/**
 * Disconnect from browser without closing it
 * Use this to keep browser running for future script executions
 */
export async function disconnectBrowser() {
  if (browserInstance) {
    browserInstance.disconnect();
    browserInstance = null;
    pageInstance = null;
    log('Disconnected from browser (browser still running)');
  }
}

/**
 * Parse command line arguments
 */
export function parseArgs(argv, options = {}) {
  const args = {};

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];

    if (arg.startsWith('--')) {
      const key = arg.slice(2);
      const nextArg = argv[i + 1];

      if (nextArg && !nextArg.startsWith('--')) {
        args[key] = nextArg;
        i++;
      } else {
        args[key] = true;
      }
    }
  }

  return args;
}

/**
 * Output JSON result
 */
export function outputJSON(data) {
  console.log(JSON.stringify(data, null, 2));
}

/**
 * Output error
 */
export function outputError(error) {
  console.error(JSON.stringify({
    success: false,
    error: error.message,
    stack: error.stack
  }, null, 2));
  process.exit(1);
}
