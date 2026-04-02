#!/usr/bin/env node
/**
 * Execute JavaScript in page context
 * Usage: node evaluate.js --script "document.title" [--url https://example.com]
 */
import { getBrowser, getPage, closeBrowser, disconnectBrowser, parseArgs, outputJSON, outputError } from './lib/browser.js';

async function evaluate() {
  const args = parseArgs(process.argv.slice(2));

  if (!args.script) {
    outputError(new Error('--script is required'));
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

    const result = await page.evaluate(async (script) => {
      // Wrap in async IIFE so user scripts can use await
      // eslint-disable-next-line no-eval
      return await eval(`(async () => { return ${script}; })()`);
    }, args.script);

    outputJSON({
      success: true,
      result: result,
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
    outputError(error);
    process.exit(1);
  }
}

evaluate();
