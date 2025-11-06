/**
 * Ensures that a URL has a trailing slash while preserving query parameters and fragments
 * @param url - The URL to process
 * @returns The URL with a trailing slash added to the pathname (if not already present)
 */
export function ensureTrailingSlash(url: string): string {
  try {
    // Handle relative URLs by creating a URL object with a dummy base
    const urlObj = new URL(url, "http://dummy.com");

    // Don't modify root path
    if (urlObj.pathname === "/") {
      return url;
    }

    // Add trailing slash if it doesn't exist
    if (!urlObj.pathname.endsWith("/")) {
      urlObj.pathname += "/";
    }

    // For relative URLs, return just the path + search + hash
    if (url.startsWith("/")) {
      return urlObj.pathname + urlObj.search + urlObj.hash;
    }

    // For absolute URLs, return the full URL
    return urlObj.toString();
  } catch (error) {
    // If URL parsing fails, return the original URL
    console.warn("Failed to parse URL for trailing slash enforcement:", url, error);
    return url;
  }
}
