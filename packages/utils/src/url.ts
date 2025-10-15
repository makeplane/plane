import tlds from "./tlds";

const PROTOCOL_REGEX = /^[a-zA-Z]+:\/\//;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const LOCALHOST_ADDRESSES = ["localhost", "127.0.0.1", "0.0.0.0"];
const HTTP_PROTOCOL = "http://";
const MAILTO_PROTOCOL = "mailto:";
const DEFAULT_PROTOCOL = HTTP_PROTOCOL;
// IPv4 regex - matches 0.0.0.0 to 255.255.255.255
const IPV4_REGEX = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/;
// IPv6 regex - comprehensive pattern for all IPv6 formats
const IPV6_REGEX =
  /^(?:(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}|(?:[0-9a-fA-F]{1,4}:){1,7}:|(?:[0-9a-fA-F]{1,4}:){1,6}:[0-9a-fA-F]{1,4}|(?:[0-9a-fA-F]{1,4}:){1,5}(?::[0-9a-fA-F]{1,4}){1,2}|(?:[0-9a-fA-F]{1,4}:){1,4}(?::[0-9a-fA-F]{1,4}){1,3}|(?:[0-9a-fA-F]{1,4}:){1,3}(?::[0-9a-fA-F]{1,4}){1,4}|(?:[0-9a-fA-F]{1,4}:){1,2}(?::[0-9a-fA-F]{1,4}){1,5}|[0-9a-fA-F]{1,4}:(?::[0-9a-fA-F]{1,4}){1,6}|:(?::[0-9a-fA-F]{1,4}){1,7}|::|fe80:(?::[0-9a-fA-F]{0,4}){0,4}%[0-9a-zA-Z]{1,}|::(?:ffff(?::0{1,4}){0,1}:){0,1}(?:(?:25[0-5]|(?:2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(?:25[0-5]|(?:2[0-4]|1{0,1}[0-9]){0,1}[0-9])|(?:[0-9a-fA-F]{1,4}:){1,4}:(?:(?:25[0-5]|(?:2[0-4]|1{0,1}[0-9]){0,1}[0-9])\.){3,3}(?:25[0-5]|(?:2[0-4]|1{0,1}[0-9]){0,1}[0-9]))$/;

/**
 * Checks if a string is a valid IPv4 address
 * @param ip - String to validate as IPv4
 * @returns True if valid IPv4 address
 */
export function isValidIPv4(ip: string): boolean {
  if (!ip || typeof ip !== "string") return false;
  return IPV4_REGEX.test(ip);
}

/**
 * Checks if a string is a valid IPv6 address
 * @param ip - String to validate as IPv6
 * @returns True if valid IPv6 address
 */
export function isValidIPv6(ip: string): boolean {
  if (!ip || typeof ip !== "string") return false;

  // Remove brackets if present (for URL format like [::1])
  const cleanIP = ip.replace(/^\[|\]$/g, "");

  return IPV6_REGEX.test(cleanIP);
}

/**
 * Checks if a string is a valid IP address (IPv4 or IPv6)
 * @param ip - String to validate as IP address
 * @returns Object with validation results
 */
export function validateIPAddress(ip: string): {
  isValid: boolean;
  type: "ipv4" | "ipv6" | "invalid";
  formatted?: string;
} {
  if (!ip || typeof ip !== "string") {
    return { isValid: false, type: "invalid" };
  }

  if (isValidIPv4(ip)) {
    return { isValid: true, type: "ipv4", formatted: ip };
  }

  if (isValidIPv6(ip)) {
    const formatted = ip.replace(/^\[|\]$/g, ""); // Remove brackets
    return { isValid: true, type: "ipv6", formatted };
  }

  return { isValid: false, type: "invalid" };
}

/**
 * Checks if a URL string points to a localhost address.
 * @param url - The URL string to check
 * @returns True if the URL points to localhost, false otherwise
 */
export function isLocalhost(url: string): boolean {
  const hostname = extractHostname(url);
  return LOCALHOST_ADDRESSES.includes(hostname);
}

/**
 * Extracts hostname from a URL string by removing protocol, path, query, hash, and port.
 * @param url - The URL string to extract hostname from
 * @returns The cleaned hostname
 */
export function extractHostname(url: string): string {
  let hostname = url;

  // Remove protocol if present
  if (hostname.includes("://")) {
    hostname = hostname.split("://")[1];
  }

  // Remove auth credentials if present
  const atIndex = hostname.indexOf("@");
  if (atIndex !== -1) {
    hostname = hostname.substring(atIndex + 1);
  }

  // Remove path, query, hash, and port in one pass
  hostname = hostname.split("/")[0].split("?")[0].split("#")[0].split(":")[0];

  return hostname;
}

/**
 * Returns a readable representation of a URL by stripping the protocol
 * and any trailing slash. For valid URLs, only the host is returned.
 * Invalid URLs are sanitized by removing the protocol and trailing slash.
 *
 * @param url - The URL string to format
 * @returns The formatted domain for display
 */
export function formatURLForDisplay(url: string): string {
  if (!url) return "";

  try {
    return new URL(url).host;
  } catch (_error) {
    return extractHostname(url);
  }
}

/**
 * Extracts and validates the TLD (Top Level Domain) from a URL string.
 *
 * @param {string} urlString - The string to extract TLD from
 * @returns {string} The valid TLD if found, empty string otherwise
 *
 * @description
 * The function performs the following steps:
 * 1. Basic validation (rejects empty strings, strings starting/ending with dots)
 * 2. URL component cleaning:
 *    - Removes protocol (if present)
 *    - Removes auth credentials (if present)
 *    - Removes path component (everything after '/')
 *    - Removes query parameters (everything after '?')
 *    - Removes hash fragments (everything after '#')
 *    - Removes port numbers (everything after ':')
 * 3. Validates the TLD against a list of known TLDs
 */

export function extractTLD(urlString: string): string {
  if (!urlString || urlString.startsWith(".") || urlString.endsWith(".")) {
    return "";
  }

  const hostname = extractHostname(urlString);
  const hostnameParts = hostname.split(".");

  if (hostnameParts.length >= 2) {
    const potentialTLD = hostnameParts[hostnameParts.length - 1].toLowerCase();
    return tlds.includes(potentialTLD) ? potentialTLD : "";
  }
  return "";
}

/**
 * Interface representing the cleaned components of a URL.
 * @interface IURLComponents
 * @property {string} protocol - The URL protocol (e.g., 'http', 'https'), if protocol is not present, Always contains the actual protocol used.
 * @property {string} subdomain - The subdomain part of the URL (e.g., 'blog' in 'blog.example.com')
 * @property {string} rootDomain - The root domain name (e.g., 'example' in 'blog.example.com')
 * @property {string} tld - The top-level domain (e.g., 'com', 'org')
 * @property {string} pathname - The URL path excluding search params and hash, empty if pathname is '/'
 * @property {URL} full - The original URL object with all native URL properties
 */
export interface IURLComponents {
  protocol: string;
  subdomain: string;
  rootDomain: string;
  tld: string;
  pathname: string;
  full: URL;
}

/**
 * Process a URL object to extract its components
 */
export function processURL(url: URL): IURLComponents {
  const protocol = url.protocol.slice(0, -1);
  const hostnameParts = url.hostname.split(".");

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
    protocol,
    subdomain,
    rootDomain,
    tld,
    pathname: url.pathname === "/" ? "" : url.pathname,
    full: url,
  };
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
 * //   pathname: 'posts',
 * //   full: URL {}           // The parsed URL object
 * // }
 */
export function extractURLComponents(url: URL | string): IURLComponents | undefined {
  // If URL object is passed directly
  if (typeof url !== "string") {
    return processURL(url);
  }

  // Handle empty strings
  if (!url || url.trim() === "") return undefined;

  // Input length validation for security
  if (url.length > 2048) return undefined;

  const urlLower = url.toLowerCase();

  try {
    // 1. Handle web URLs with protocols (including mailto, http, https, ftp, etc.)
    if (PROTOCOL_REGEX.test(urlLower) || urlLower.startsWith(MAILTO_PROTOCOL)) {
      return processURL(new URL(url));
    }

    // 2. Check if it's an email address
    if (EMAIL_REGEX.test(urlLower)) {
      return processURL(new URL(`${MAILTO_PROTOCOL}${url}`));
    }

    // 3. URL without protocol but valid domain or IP address or TLD
    if (isLocalhost(urlLower) || isValidIPv4(urlLower) || isValidIPv6(urlLower) || extractTLD(urlLower)) {
      return processURL(new URL(`${DEFAULT_PROTOCOL}${urlLower}`));
    }

    return undefined;
  } catch (error) {
    return undefined;
  }
}

/**
 * Validates that a next_path parameter is safe for redirection.
 * Only allows relative paths starting with "/" to prevent open redirect vulnerabilities.
 *
 * @param url - The next_path URL to validate
 * @returns True if the URL is a safe relative path, false otherwise
 *
 * @example
 * isValidNextPath("/dashboard") // true
 * isValidNextPath("/workspace/123") // true
 * isValidNextPath("https://malicious.com") // false
 * isValidNextPath("//malicious.com") // false (protocol-relative)
 * isValidNextPath("javascript:alert(1)") // false
 * isValidNextPath("") // false
 * isValidNextPath("dashboard") // false (must start with /)
 * isValidNextPath("\\malicious") // false (backslash)
 * isValidNextPath("  /dashboard  ") // true (trimmed)
 */
export function isValidNextPath(url: string): boolean {
  if (!url || typeof url !== "string") return false;

  // Trim leading/trailing whitespace
  const trimmedUrl = url.trim();

  if (!trimmedUrl) return false;

  // Only allow relative paths starting with /
  if (!trimmedUrl.startsWith("/")) return false;

  // Block protocol-relative URLs (//example.com) - open redirect vulnerability
  if (trimmedUrl.startsWith("//")) return false;

  // Block backslashes which can be used for path traversal or Windows-style paths
  if (trimmedUrl.includes("\\")) return false;

  try {
    // Use URL constructor with a dummy base to normalize and validate the path
    const normalizedUrl = new URL(trimmedUrl, "http://localhost");

    // Ensure the path is still relative (no host change from our dummy base)
    if (normalizedUrl.hostname !== "localhost" || normalizedUrl.protocol !== "http:") {
      return false;
    }

    // Use the normalized pathname for additional security checks
    const pathname = normalizedUrl.pathname;

    // Additional security checks for malicious patterns in the normalized path
    const maliciousPatterns = [
      /javascript:/i,
      /data:/i,
      /vbscript:/i,
      /<script/i,
      /on\w+=/i, // Event handlers like onclick=, onload=
    ];

    return !maliciousPatterns.some((pattern) => pattern.test(pathname));
  } catch (error) {
    // If URL constructor fails, it's an invalid path
    return false;
  }
}
