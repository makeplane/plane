/**
 * Shared selector parsing and validation library
 * Supports CSS and XPath selectors with security validation
 */

/**
 * Parse and validate selector
 * @param {string} selector - CSS or XPath selector
 * @returns {{type: 'css'|'xpath', selector: string}}
 * @throws {Error} If XPath contains injection patterns
 */
export function parseSelector(selector) {
  if (!selector || typeof selector !== 'string') {
    throw new Error('Selector must be a non-empty string');
  }

  // Detect XPath selectors
  if (selector.startsWith('/') || selector.startsWith('(//')) {
    // XPath injection prevention
    validateXPath(selector);
    return { type: 'xpath', selector };
  }

  // CSS selector
  return { type: 'css', selector };
}

/**
 * Validate XPath selector for security
 * @param {string} xpath - XPath expression to validate
 * @throws {Error} If XPath contains dangerous patterns
 */
function validateXPath(xpath) {
  const dangerous = [
    'javascript:',
    '<script',
    'onerror=',
    'onload=',
    'onclick=',
    'onmouseover=',
    'eval(',
    'Function(',
    'constructor(',
  ];

  const lower = xpath.toLowerCase();
  for (const pattern of dangerous) {
    if (lower.includes(pattern.toLowerCase())) {
      throw new Error(`Potential XPath injection detected: ${pattern}`);
    }
  }

  // Additional validation: check for extremely long selectors (potential DoS)
  if (xpath.length > 1000) {
    throw new Error('XPath selector too long (max 1000 characters)');
  }
}

/**
 * Wait for element based on selector type
 * @param {Object} page - Puppeteer page instance
 * @param {{type: string, selector: string}} parsed - Parsed selector
 * @param {Object} options - Wait options (visible, timeout)
 * @returns {Promise<void>}
 */
export async function waitForElement(page, parsed, options = {}) {
  const defaultOptions = {
    visible: true,
    timeout: 5000,
    ...options
  };

  if (parsed.type === 'xpath') {
    // Use locator API for XPath (Puppeteer v24+)
    const locator = page.locator(`::-p-xpath(${parsed.selector})`);
    // setVisibility and setTimeout are the locator options
    await locator
      .setVisibility(defaultOptions.visible ? 'visible' : null)
      .setTimeout(defaultOptions.timeout)
      .wait();
  } else {
    await page.waitForSelector(parsed.selector, defaultOptions);
  }
}

/**
 * Click element based on selector type
 * @param {Object} page - Puppeteer page instance
 * @param {{type: string, selector: string}} parsed - Parsed selector
 * @returns {Promise<void>}
 */
export async function clickElement(page, parsed) {
  if (parsed.type === 'xpath') {
    // Use locator API for XPath (Puppeteer v24+)
    const locator = page.locator(`::-p-xpath(${parsed.selector})`);
    await locator.click();
  } else {
    await page.click(parsed.selector);
  }
}

/**
 * Type into element based on selector type
 * @param {Object} page - Puppeteer page instance
 * @param {{type: string, selector: string}} parsed - Parsed selector
 * @param {string} value - Text to type
 * @param {Object} options - Type options (delay, clear)
 * @returns {Promise<void>}
 */
export async function typeIntoElement(page, parsed, value, options = {}) {
  if (parsed.type === 'xpath') {
    // Use locator API for XPath (Puppeteer v24+)
    const locator = page.locator(`::-p-xpath(${parsed.selector})`);

    // Clear if requested
    if (options.clear) {
      await locator.fill('');
    }

    await locator.fill(value);
  } else {
    // CSS selector
    if (options.clear) {
      await page.$eval(parsed.selector, el => el.value = '');
    }

    await page.type(parsed.selector, value, { delay: options.delay || 0 });
  }
}

/**
 * Get element handle based on selector type
 * @param {Object} page - Puppeteer page instance
 * @param {{type: string, selector: string}} parsed - Parsed selector
 * @returns {Promise<ElementHandle|null>}
 */
export async function getElement(page, parsed) {
  if (parsed.type === 'xpath') {
    // For XPath, use page.evaluate with XPath evaluation
    // This returns the first matching element
    const element = await page.evaluateHandle((xpath) => {
      const result = document.evaluate(
        xpath,
        document,
        null,
        XPathResult.FIRST_ORDERED_NODE_TYPE,
        null
      );
      return result.singleNodeValue;
    }, parsed.selector);

    // Convert JSHandle to ElementHandle
    const elementHandle = element.asElement();
    return elementHandle;
  } else {
    return await page.$(parsed.selector);
  }
}

/**
 * Get enhanced error message for selector failures
 * @param {Error} error - Original error
 * @param {string} selector - Selector that failed
 * @returns {Error} Enhanced error with troubleshooting tips
 */
export function enhanceError(error, selector) {
  if (error.message.includes('waiting for selector') ||
      error.message.includes('waiting for XPath') ||
      error.message.includes('No node found')) {
    error.message += '\n\nTroubleshooting:\n' +
      '1. Use snapshot.js to find correct selector: node snapshot.js --url <url>\n' +
      '2. Try XPath selector: //button[text()="Click"] or //button[contains(text(),"Click")]\n' +
      '3. Check element is visible on page (not display:none or hidden)\n' +
      '4. Increase --timeout value: --timeout 10000\n' +
      '5. Change wait strategy: --wait-until load or --wait-until domcontentloaded';
  }
  return error;
}
