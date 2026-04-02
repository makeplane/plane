#!/usr/bin/env node
/**
 * Select and interact with elements by ref from ARIA snapshot
 * Usage: node select-ref.js --ref e5 --action click
 *        node select-ref.js --ref e10 --action fill --value "text"
 *        node select-ref.js --ref e3 --action screenshot --output element.png
 *
 * Actions:
 *   click       - Click the element
 *   fill        - Fill input with --value
 *   screenshot  - Take screenshot of element
 *   text        - Get text content
 *   focus       - Focus the element
 *   hover       - Hover over element
 *
 * Refs are obtained from aria-snapshot.js output (e.g., [ref=e5])
 *
 * Session behavior:
 *   By default, browser stays running for session persistence
 *   Use --close true to fully close browser
 */
import { getBrowser, getPage, closeBrowser, disconnectBrowser, parseArgs, outputJSON, outputError } from './lib/browser.js';
import fs from 'fs/promises';
import path from 'path';

async function selectRef() {
  const args = parseArgs(process.argv.slice(2));

  if (!args.ref) {
    outputError(new Error('--ref is required (e.g., --ref e5)'));
    return;
  }

  if (!args.action) {
    outputError(new Error('--action is required (click, fill, screenshot, text, focus, hover)'));
    return;
  }

  try {
    const browser = await getBrowser({
      headless: args.headless
    });

    const page = await getPage(browser);

    // Get element by ref from window.__chromeDevToolsRefs
    const element = await page.evaluateHandle((ref) => {
      const refs = window.__chromeDevToolsRefs;
      if (!refs) {
        throw new Error('No refs available. Run aria-snapshot.js first to generate refs.');
      }
      const el = refs.get(ref);
      if (!el) {
        throw new Error(`Ref "${ref}" not found. Available refs: ${Array.from(refs.keys()).join(', ')}`);
      }
      return el;
    }, args.ref);

    const elementHandle = element.asElement();
    if (!elementHandle) {
      throw new Error(`Could not get element handle for ref "${args.ref}"`);
    }

    let result = {
      success: true,
      ref: args.ref,
      action: args.action
    };

    // Perform action
    switch (args.action) {
      case 'click':
        await elementHandle.click();
        result.message = 'Element clicked';
        break;

      case 'fill':
        if (!args.value && args.value !== '') {
          throw new Error('--value is required for fill action');
        }
        await elementHandle.click({ clickCount: 3 }); // Select all
        await elementHandle.type(args.value);
        result.message = 'Element filled';
        result.value = args.value;
        break;

      case 'screenshot':
        if (!args.output) {
          throw new Error('--output is required for screenshot action');
        }
        const outputDir = path.dirname(args.output);
        await fs.mkdir(outputDir, { recursive: true });
        await elementHandle.screenshot({ path: args.output });
        result.output = path.resolve(args.output);
        result.message = 'Screenshot saved';
        break;

      case 'text':
        const text = await page.evaluate(el => el.textContent?.trim(), elementHandle);
        result.text = text;
        break;

      case 'focus':
        await elementHandle.focus();
        result.message = 'Element focused';
        break;

      case 'hover':
        await elementHandle.hover();
        result.message = 'Hovering over element';
        break;

      default:
        throw new Error(`Unknown action: ${args.action}. Valid actions: click, fill, screenshot, text, focus, hover`);
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
  }
}

selectRef();
