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
 * Checks if a string is a valid URL.
 *
 * @param {string} urlString - The string to validate as URL
 * @returns {boolean} True if string is a valid URL, false otherwise
 *
 * @example
 * // Valid URLs
 * isUrlValid('https://example.com')     // returns true
 * isUrlValid('http://example.com')      // returns true
 * isUrlValid('https://sub.example.com') // returns true
 *
 * // Invalid URLs
 * isUrlValid('not-a-url')              // returns false
 * isUrlValid('example.com')            // returns false (no protocol)
 * isUrlValid('https://invalid.')       // returns false
 */
export function isUrlValid(urlString: string): boolean {
  try {
    new URL(urlString);
    return true;
  } catch {
    return false;
  }
}
