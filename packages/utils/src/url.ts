/**
 * Interface representing the components of a URL.
 * @interface IURLComponents
 * @property {string} protocol - The URL protocol (e.g., 'http', 'https')
 * @property {string} subdomain - The subdomain part of the URL (e.g., 'blog' in 'blog.example.com')
 * @property {string} rootDomain - The root domain name (e.g., 'example' in 'blog.example.com')
 * @property {string} tld - The top-level domain (e.g., 'com', 'org')
 * @property {string} path - The URL path including search params and hash
 * @property {URL}  full - The complete URL object
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
 * Creates a URL object from a string, automatically adding https:// if protocol is missing.
 *
 * @param {string} urlString - The URL string to parse
 * @returns {URL | undefined} URL object if valid, undefined if invalid
 *
 * @example
 * // With protocol
 * createURL('https://example.com') // returns URL object
 * createURL('not-a-url') // returns undefined
 *
 * @example
 * // Without protocol (automatically adds https://)
 * createURL('example.com') // returns URL object with https://
 * createURL('invalid.') // returns undefined
 */
export function createURL(urlString: string): URL | undefined {
  try {
    if (!urlString.includes("://")) {
      urlString = "https://" + urlString;
    }
    return new URL(urlString);
  } catch (error) {
    console.error(`Invalid URL: ${urlString}`, error);
    return undefined;
  }
}
