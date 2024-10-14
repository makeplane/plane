/**
 * @description
 * This function test whether a URL is valid or not.
 *
 * It accepts URLs with or without the protocol.
 * @param {string} url
 * @returns {boolean}
 * @example
 * checkURLValidity("https://example.com") => true
 * checkURLValidity("example.com") => true
 * checkURLValidity("example") => false
 */
export const checkURLValidity = (url: string): boolean => {
  if (!url) return false;

  // regex to support complex query parameters and fragments
  const urlPattern =
    /^(https?:\/\/)?((([a-z\d-]+\.)*[a-z\d-]+\.[a-z]{2,6})|(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}))(:\d+)?(\/[\w.-]*)*(\?[^#\s]*)?(#[\w-]*)?$/i;

  return urlPattern.test(url);
};
