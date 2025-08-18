/**
 * Interface representing the parsed components of a URL.
 * @interface IParsedURL
 * @property {string} protocol - The URL protocol (e.g., 'http', 'https')
 * @property {string} subdomain - The subdomain part of the URL (e.g., 'blog' in 'blog.example.com')
 * @property {string} rootDomain - The root domain name (e.g., 'example' in 'blog.example.com')
 * @property {string} tld - The top-level domain (e.g., 'com', 'org')
 * @property {string} path - The URL path including search params and hash
 * @property {Object} full - Complete domain information
 * @property {string} full.domain - The root domain with TLD (e.g., 'example.com')
 * @property {string} full.hostname - The complete hostname (e.g., 'blog.example.com')
 */
export interface IParsedURL {
  protocol: string;
  subdomain: string;
  rootDomain: string;
  tld: string;
  path: string;
  full: {
    domain: string;
    hostname: string;
  };
}

/**
 * Parses a URL string into its constituent components.
 *
 * @param {string} urlString - The URL to parse
 * @returns {IParsedURL | undefined} Parsed URL components or undefined if invalid
 * @throws {Error} If the URL is malformed
 *
 * @example
 * parseURL('https://blog.example.com/posts')
 * // { protocol: 'https', subdomain: 'blog', rootDomain: 'example',
 * //   tld: 'com', path: 'posts', full: { domain: 'example.com', hostname: 'blog.example.com' } }
 */

export function parseURL(urlString: string): IParsedURL | undefined {
  try {
    if (!urlString.includes("://")) {
      return undefined;
    }

    const url = new URL(urlString);
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
      full: {
        domain: rootDomain && tld ? `${rootDomain}.${tld}` : url.hostname,
        hostname: url.hostname,
      },
    };
  } catch {
    return undefined;
  }
}

/**
 * Validates if a given string is a valid URL.
 * If the URL doesn't include a protocol, 'https://' is automatically prepended before validation.
 *
 * @param {string} urlString - The URL string to validate
 * @returns {boolean} Returns true if the URL is valid, false otherwise
 *
 * @example
 * // With protocol
 * isUrlValid('https://example.com') // returns true
 * isUrlValid('not-a-url') // returns false
 *
 * @example
 * // Without protocol (automatically adds https://)
 * isUrlValid('example.com') // returns true
 * isUrlValid('invalid.') // returns false
 */

export function isUrlValid(urlString: string): boolean {
  try {
    if (!urlString.includes("://")) {
      urlString = "https://" + urlString;
    }
    new URL(urlString);
    return true;
  } catch (error) {
    return false;
  }
}
