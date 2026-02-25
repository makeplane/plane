#!/usr/bin/env node
/**
 * Navigate to a URL
 * Usage: node navigate.js --url https://example.com [--wait-until networkidle2] [--timeout 30000]
 *        node navigate.js --url https://example.com --use-default-profile true
 *        node navigate.js --url https://example.com --profile "/path/to/chrome/profile"
 *
 * Session behavior:
 *   --close false  : Keep browser running, disconnect from it (default for chaining)
 *   --close true   : Close browser completely and clear session
 *
 * Profile options (Chrome must be closed first):
 *   --use-default-profile true : Use Chrome's default profile with all cookies
 *   --profile <path>           : Use specific Chrome profile directory
 *   --browser-url <url>        : Connect to Chrome with remote debugging
 */
import {
  getBrowser,
  getPage,
  closeBrowser,
  disconnectBrowser,
  parseArgs,
  outputJSON,
  outputError,
} from "./lib/browser.js";

async function navigate() {
  const args = parseArgs(process.argv.slice(2));

  if (!args.url) {
    outputError(new Error("--url is required"));
    return;
  }

  try {
    const browser = await getBrowser({
      headless: args.headless !== "false",
      useDefaultProfile: args["use-default-profile"] === "true",
      profile: args.profile,
      browserUrl: args["browser-url"],
    });

    const page = await getPage(browser);

    const options = {
      waitUntil: args["wait-until"] || "networkidle2",
      timeout: parseInt(args.timeout || "30000"),
    };

    await page.goto(args.url, options);

    const result = {
      success: true,
      url: page.url(),
      title: await page.title(),
    };

    outputJSON(result);

    // Default: disconnect to keep browser running for session persistence
    // Use --close true to fully close browser
    if (args.close === "true") {
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
