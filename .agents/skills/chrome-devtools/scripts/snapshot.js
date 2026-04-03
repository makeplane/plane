#!/usr/bin/env node
/**
 * Get DOM snapshot with selectors
 * Usage: node snapshot.js [--url https://example.com] [--output snapshot.json]
 */
import { getBrowser, getPage, closeBrowser, disconnectBrowser, parseArgs, outputJSON, outputError } from './lib/browser.js';
import fs from 'fs/promises';

async function snapshot() {
  const args = parseArgs(process.argv.slice(2));

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

    // Get interactive elements with metadata
    const elements = await page.evaluate(() => {
      const interactiveSelectors = [
        'a[href]',
        'button',
        'input',
        'textarea',
        'select',
        '[onclick]',
        '[role="button"]',
        '[role="link"]',
        '[contenteditable]'
      ];

      const elements = [];
      const selector = interactiveSelectors.join(', ');
      const nodes = document.querySelectorAll(selector);

      nodes.forEach((el, index) => {
        const rect = el.getBoundingClientRect();

        // Generate unique selector
        let uniqueSelector = '';
        if (el.id) {
          uniqueSelector = `#${el.id}`;
        } else if (el.className) {
          const classes = Array.from(el.classList).join('.');
          uniqueSelector = `${el.tagName.toLowerCase()}.${classes}`;
        } else {
          uniqueSelector = el.tagName.toLowerCase();
        }

        elements.push({
          index: index,
          tagName: el.tagName.toLowerCase(),
          type: el.type || null,
          id: el.id || null,
          className: el.className || null,
          name: el.name || null,
          value: el.value || null,
          text: el.textContent?.trim().substring(0, 100) || null,
          href: el.href || null,
          selector: uniqueSelector,
          xpath: getXPath(el),
          visible: rect.width > 0 && rect.height > 0,
          position: {
            x: rect.x,
            y: rect.y,
            width: rect.width,
            height: rect.height
          }
        });
      });

      function getXPath(element) {
        if (element.id) {
          return `//*[@id="${element.id}"]`;
        }
        if (element === document.body) {
          return '/html/body';
        }
        let ix = 0;
        const siblings = element.parentNode?.childNodes || [];
        for (let i = 0; i < siblings.length; i++) {
          const sibling = siblings[i];
          if (sibling === element) {
            return getXPath(element.parentNode) + '/' + element.tagName.toLowerCase() + '[' + (ix + 1) + ']';
          }
          if (sibling.nodeType === 1 && sibling.tagName === element.tagName) {
            ix++;
          }
        }
        return '';
      }

      return elements;
    });

    const result = {
      success: true,
      url: page.url(),
      title: await page.title(),
      elementCount: elements.length,
      elements: elements
    };

    if (args.output) {
      await fs.writeFile(args.output, JSON.stringify(result, null, 2));
      outputJSON({
        success: true,
        output: args.output,
        elementCount: elements.length
      });
    } else {
      outputJSON(result);
    }

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

snapshot();
