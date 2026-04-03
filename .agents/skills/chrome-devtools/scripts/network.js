#!/usr/bin/env node
/**
 * Monitor network requests
 * Usage: node network.js --url https://example.com [--types xhr,fetch] [--output requests.json]
 */
import { getBrowser, getPage, closeBrowser, disconnectBrowser, parseArgs, outputJSON, outputError } from './lib/browser.js';
import fs from 'fs/promises';

async function monitorNetwork() {
  const args = parseArgs(process.argv.slice(2));

  if (!args.url) {
    outputError(new Error('--url is required'));
    return;
  }

  try {
    const browser = await getBrowser({
      headless: args.headless
    });

    const page = await getPage(browser);

    const requests = [];
    const filterTypes = args.types ? args.types.split(',').map(t => t.toLowerCase()) : null;

    // Monitor requests
    page.on('request', (request) => {
      const resourceType = request.resourceType().toLowerCase();

      if (!filterTypes || filterTypes.includes(resourceType)) {
        requests.push({
          id: request._requestId || requests.length,
          url: request.url(),
          method: request.method(),
          resourceType: resourceType,
          headers: request.headers(),
          postData: request.postData(),
          timestamp: Date.now()
        });
      }
    });

    // Monitor responses
    const responses = new Map();
    page.on('response', async (response) => {
      const request = response.request();
      const resourceType = request.resourceType().toLowerCase();

      if (!filterTypes || filterTypes.includes(resourceType)) {
        try {
          responses.set(request._requestId || request.url(), {
            status: response.status(),
            statusText: response.statusText(),
            headers: response.headers(),
            fromCache: response.fromCache(),
            timing: response.timing()
          });
        } catch (e) {
          // Ignore errors for some response types
        }
      }
    });

    // Navigate
    await page.goto(args.url, {
      waitUntil: args['wait-until'] || 'networkidle2'
    });

    // Merge requests with responses
    const combined = requests.map(req => ({
      ...req,
      response: responses.get(req.id) || responses.get(req.url) || null
    }));

    const result = {
      success: true,
      url: page.url(),
      requestCount: combined.length,
      requests: combined
    };

    if (args.output) {
      await fs.writeFile(args.output, JSON.stringify(result, null, 2));
      outputJSON({
        success: true,
        output: args.output,
        requestCount: combined.length
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
    process.exit(1);
  }
}

monitorNetwork();
