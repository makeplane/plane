#!/usr/bin/env node
/**
 * Fill form fields
 * Usage: node fill.js --selector "#input" --value "text" [--url https://example.com]
 * Supports both CSS and XPath selectors:
 *   - CSS: node fill.js --selector "#email" --value "user@example.com"
 *   - XPath: node fill.js --selector "//input[@type='email']" --value "user@example.com"
 */
import { getBrowser, getPage, closeBrowser, disconnectBrowser, parseArgs, outputJSON, outputError } from './lib/browser.js';
import { parseSelector, waitForElement, typeIntoElement, enhanceError } from './lib/selector.js';

async function fill() {
  const args = parseArgs(process.argv.slice(2));

  if (!args.selector) {
    outputError(new Error('--selector is required'));
    return;
  }

  if (!args.value) {
    outputError(new Error('--value is required'));
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

    // Type into element
    await typeIntoElement(page, parsed, args.value, {
      clear: args.clear === 'true',
      delay: parseInt(args.delay || '0')
    });

    outputJSON({
      success: true,
      selector: args.selector,
      value: args.value,
      url: page.url()
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

fill();
