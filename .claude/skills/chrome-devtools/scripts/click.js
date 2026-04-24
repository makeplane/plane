#!/usr/bin/env node
/**
 * Click an element
 * Usage: node click.js --selector ".button" [--url https://example.com] [--wait-for ".result"]
 * Supports both CSS and XPath selectors:
 *   - CSS: node click.js --selector "button.submit"
 *   - XPath: node click.js --selector "//button[contains(text(),'Submit')]"
 */
import { getBrowser, getPage, closeBrowser, disconnectBrowser, parseArgs, outputJSON, outputError } from './lib/browser.js';
import { parseSelector, waitForElement, clickElement, enhanceError } from './lib/selector.js';

async function click() {
  const args = parseArgs(process.argv.slice(2));

  if (!args.selector) {
    outputError(new Error('--selector is required'));
    return;
  }

  try {
    const browser = await getBrowser({
      headless: args.headless
    });

    const page = await getPage(browser);

    // Navigate if URL provided
    if (args.url) {
      await page.goto(args.url, {
        waitUntil: args['wait-until'] || 'networkidle2'
      });
    }

    // Parse and validate selector
    const parsed = parseSelector(args.selector);

    // Wait for element based on selector type
    await waitForElement(page, parsed, {
      visible: true,
      timeout: parseInt(args.timeout || '5000')
    });

    // Set up navigation promise BEFORE clicking (in case click triggers immediate navigation)
    const navigationPromise = page.waitForNavigation({
      waitUntil: 'load',
      timeout: 5000
    }).catch(() => null); // Catch timeout - navigation may not occur

    // Click element
    await clickElement(page, parsed);

    // Wait for optional selector after click
    if (args['wait-for']) {
      await page.waitForSelector(args['wait-for'], {
        timeout: parseInt(args.timeout || '5000')
      });
    } else {
      // Wait for navigation to complete (or timeout if no navigation)
      await navigationPromise;
    }

    outputJSON({
      success: true,
      url: page.url(),
      title: await page.title()
    });

    // Default: disconnect to keep browser running for session persistence
    // Use --close true to fully close browser
    if (args.close === 'true') {
      await closeBrowser();
    } else {
      await disconnectBrowser();
    }
    process.exit(0);
  } catch (error) {
    // Enhance error message with troubleshooting tips
    const enhanced = enhanceError(error, args.selector);
    outputError(enhanced);
    process.exit(1);
  }
}

click();
