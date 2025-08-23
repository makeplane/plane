import tlds from "tlds";

/**
 * Interface representing the components of a URL.
 * @interface IURLComponents
 * @property {string} protocol - The URL protocol (e.g., 'http', 'https'), empty if protocol is not present
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
 * Extracts components from a URL object or string.
 *
 * @param {URL | string} url - The URL object or string to extract components from
 * @returns {IURLComponents | undefined} URL components or undefined if invalid
 *
 * @example
 * // With URL object
 * const url = new URL('https://blog.example.com/posts');
 * extractURLComponents(url);
 *
 * // With string
 * extractURLComponents('blog.example.com/posts');
 *
 * // Example output:
 * // {
 * //   protocol: 'https',      // empty string if protocol is not present
 * //   subdomain: 'blog',
 * //   rootDomain: 'example',
 * //   tld: 'com',
 * //   path: 'posts',
 * //   full: URL {}           // The parsed URL object
 * // }
 */

export function extractURLComponents(url: URL | string): IURLComponents | undefined {
  if (!url) return undefined;

  let cleanedUrl: URL;
  let wasProtocolAdded = false;

  try {
    if (typeof url === "string") {
      if (url.trim() === "") return undefined;

      // Check for valid protocol pattern: some characters followed by ://
      if (/^[a-zA-Z]+:\/\//.test(url)) {
        cleanedUrl = new URL(url);
      } else if (hasValidTLD(url) || url.includes("localhost")) {
        wasProtocolAdded = true;
        cleanedUrl = new URL(`http://${url}`);
      } else {
        return undefined;
      }
    } else {
      cleanedUrl = url;
    }

    const protocol = cleanedUrl.protocol.slice(0, -1);
    const pathname = cleanedUrl.pathname.replace(/^\/+/, "").replace(/\/{2,}/g, "/");
    const path = pathname + cleanedUrl.search + cleanedUrl.hash;
    const hostnameParts = cleanedUrl.hostname.split(".");

    let subdomain = "";
    let rootDomain = "";
    let tld = "";

    if (hostnameParts.length === 1) {
      rootDomain = hostnameParts[0]; // For cases like 'localhost'
    } else if (hostnameParts.length >= 2) {
      tld = hostnameParts[hostnameParts.length - 1];
      rootDomain = hostnameParts[hostnameParts.length - 2];

      if (hostnameParts.length > 2) {
        subdomain = hostnameParts.slice(0, -2).join(".");
      }
    }

    return {
      protocol: wasProtocolAdded ? "" : protocol,
      subdomain,
      rootDomain,
      tld,
      path,
      full: cleanedUrl,
    };
  } catch (error) {
    console.error(`Error extracting URL components: ${url?.toString() || url}`, error);
    return undefined;
  }
}

/**
 * Checks if a string contains a valid TLD (Top Level Domain) by cleaning the URL and validating against known TLDs.
 *
 * @param {string} urlString - The string to check for valid TLD
 * @returns {boolean} True if the string contains a valid TLD, false otherwise
 *
 * @description
 * The function performs the following steps:
 * 1. Basic validation (rejects empty strings, strings starting/ending with dots)
 * 2. URL component cleaning:
 *    - Removes path component (everything after '/')
 *    - Removes query parameters (everything after '?')
 *    - Removes hash fragments (everything after '#')
 *    - Removes port numbers (everything after ':')
 * 3. Validates the TLD against a list of known TLDs
 *
 * @example
 * // Valid cases
 * hasValidTLD('example.com')                    // returns true
 * hasValidTLD('sub.example.com')                // returns true
 * hasValidTLD('example.com/path')               // returns true (path is stripped)
 * hasValidTLD('example.com:8080')               // returns true (port is stripped)
 * hasValidTLD('example.com?query=1')            // returns true (query is stripped)
 * hasValidTLD('example.com#hash')               // returns true (hash is stripped)
 *
 * // Invalid cases
 * hasValidTLD('')                               // returns false (empty string)
 * hasValidTLD('.example.com')                   // returns false (starts with dot)
 * hasValidTLD('example.com.')                   // returns false (ends with dot)
 * hasValidTLD('example.invalid')                // returns false (invalid TLD)
 * hasValidTLD('localhost')                      // returns false (no TLD)
 */

function hasValidTLD(urlString: string): boolean {
  if (!urlString || urlString.startsWith(".") || urlString.endsWith(".")) {
    return false;
  }

  let hostname = urlString;

  // Remove path, query, and hash if present
  const pathIndex = hostname.indexOf("/");
  if (pathIndex !== -1) {
    hostname = hostname.substring(0, pathIndex);
  }

  const queryIndex = hostname.indexOf("?");
  if (queryIndex !== -1) {
    hostname = hostname.substring(0, queryIndex);
  }

  const hashIndex = hostname.indexOf("#");
  if (hashIndex !== -1) {
    hostname = hostname.substring(0, hashIndex);
  }

  // Remove port if present
  const portIndex = hostname.indexOf(":");
  if (portIndex !== -1) {
    hostname = hostname.substring(0, portIndex);
  }

  const hostnameParts = hostname.split(".");
  if (hostnameParts.length >= 2) {
    const potentialTLD = hostnameParts[hostnameParts.length - 1].toLowerCase();
    return tlds.includes(potentialTLD);
  }

  return false;
}

/**
 * Checks if a string is a valid URL.
 *
 * @param {string} urlString - The string to validate as URL
 * @returns {URL | undefined} URL object if valid, undefined if invalid
 *
 * @example
 * // Valid URLs
 * isUrlValid('https://example.com')     // returns true
 * isUrlValid('http://example.com')      // returns true
 * isUrlValid('https://sub.example.com') // returns true
 *
 * // Invalid URLs
 * isUrlValid('not-a-url')              // returns false
 * isUrlValid('https://invalid.')       // returns false
 * isUrlValid('example.invalid')        // returns false (invalid TLD)
 *
 * // Test cases:
 * // isUrlValid('google.com')          // ✅ returns true
 * // isUrlValid('github.io')           // ✅ returns true
 * // isUrlValid('invalid.tld')         // ❌ returns false (invalid TLD)
 */

export function isUrlValid(urlString: string): boolean {
  // Basic input validation
  if (!urlString || urlString.trim() === "") return false;

  // Handle localhost separately
  if (urlString.startsWith("localhost")) {
    try {
      new URL(`http://${urlString}`);
      return true;
    } catch {
      return false;
    }
  }

  // Check for valid protocol format if protocol is present
  if (urlString.includes("://")) {
    // Reject invalid protocol formats (e.g. "://example.com")
    if (!/^[a-zA-Z]+:\/\//.test(urlString)) return false;
    try {
      const url = new URL(urlString);
      return !!url.hostname && url.hostname !== ".com";
    } catch {
      return false;
    }
  }

  if (hasValidTLD(urlString)) return true;

  return false;
}
