import tlds from "tlds";

/**
 * Interface representing the components of a URL.
 * @interface IURLComponents
 * @property {string} protocol - The URL protocol (e.g., 'http', 'https')
 * @property {string} subdomain - The subdomain part of the URL (e.g., 'blog' in 'blog.example.com')
 * @property {string} rootDomain - The root domain name (e.g., 'example' in 'blog.example.com')
 * @property {string} tld - The top-level domain (e.g., 'com', 'org')
 * @property {string} path - The URL path including search params and hash
 * @property {URL} full - The original URL object with all native URL properties
 */
export interface IURLComponents {
  protocol: string;
  subdomain: string;
  rootDomain: string;
  tld: string;
  path: string;
  full: URL;
}

/**
 * Extracts components from a URL object.
 *
 * @param {URL} url - The URL object to extract components from
 * @returns {IURLComponents | undefined} URL components or undefined if invalid
 *
 * @example
 * const url = new URL('https://blog.example.com/posts');
 * extractURLComponents(url);
 * // {
 * //   protocol: 'https',
 * //   subdomain: 'blog',
 * //   rootDomain: 'example',
 * //   tld: 'com',
 * //   path: 'posts',
 * //   full: URL {} // The original URL object
 * // }
 */

export function extractURLComponents(url: URL): IURLComponents | undefined {
  try {
    const protocol = url.protocol.slice(0, -1);
    const pathname = url.pathname.replace(/^\/+/, "").replace(/\/{2,}/g, "/");
    const path = pathname + url.search + url.hash;
    const hostnameParts = url.hostname.split(".");

    let subdomain = "";
    let rootDomain = "";
    let tld = "";

    if (hostnameParts.length >= 2) {
      tld = hostnameParts[hostnameParts.length - 1];
      rootDomain = hostnameParts[hostnameParts.length - 2];

      if (hostnameParts.length > 2) {
        subdomain = hostnameParts.slice(0, -2).join(".");
      }
    }

    return {
      protocol,
      subdomain,
      rootDomain,
      tld,
      path,
      full: url,
    };
  } catch (error) {
    console.error(`Error extracting URL components: ${url.href}`, error);
    return undefined;
  }
}

/**
 * Checks if a string contains a valid TLD (Top Level Domain).
 *
 * @param {string} input - The string to check for valid TLD
 * @returns {boolean} True if the string contains a valid TLD, false otherwise
 */
function hasValidTLD(input: string): boolean {
  // Extract potential domain part (after the last dot)
  const parts = input.split(".");
  if (parts.length < 2) return false;

  const potentialTLD = parts[parts.length - 1].toLowerCase();
  return tlds.includes(potentialTLD);
}

/**
 * Checks if a string is a valid URL.
 * Automatically appends 'http://' if the string contains a valid TLD but no protocol.
 *
 * @param {string} urlString - The string to validate as URL
 * @returns {URL | undefined} URL object if valid, undefined if invalid
 *
 * @example
 * // Valid URLs
 * getValidURL('https://example.com')     // returns URL object
 * getValidURL('http://example.com')      // returns URL object
 * getValidURL('https://sub.example.com') // returns URL object
 * getValidURL('example.com')             // returns URL object (auto-appends http://)
 * getValidURL('sub.example.org')         // returns URL object (auto-appends http://)
 *
 * // Invalid URLs
 * getValidURL('not-a-url')              // returns undefined
 * getValidURL('https://invalid.')       // returns undefined
 * getValidURL('example.invalid')        // returns undefined (invalid TLD)
 *
 * // Test cases:
 * // getValidURL('google.com')          // ✅ returns URL with http://google.com
 * // getValidURL('github.io')           // ✅ returns URL with http://github.io
 * // getValidURL('invalid.tld')         // ❌ returns undefined (invalid TLD)
 */
export function getValidURL(urlString?: string): URL | undefined {
  if (!urlString) return undefined;

  // Try to create URL as-is first
  const url = createURL(urlString);
  if (url) return url;

  // If that fails, try with http:// prefix if it has a valid TLD
  if (hasValidTLD(urlString)) {
    return createURL(`http://${urlString}`);
  }

  return undefined;
}

/**
 * Helper function to safely create a URL object.
 *
 * @param {string} urlString - The string to create URL from
 * @returns {URL | undefined} URL object if valid, undefined if invalid
 */
function createURL(urlString: string): URL | undefined {
  try {
    return new URL(urlString);
  } catch {
    return undefined;
  }
}
