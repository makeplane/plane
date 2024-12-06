import DOMPurify from "isomorphic-dompurify";

/**
 * @description: This function will remove all the HTML tags from the string
 * @param {string} html
 * @return {string}
 * @example:
 * const html = "<p>Some text</p>";
 * const text = stripHTML(html);
 * console.log(text); // Some text
 */
export const sanitizeHTML = (htmlString: string) => {
  const sanitizedText = DOMPurify.sanitize(htmlString, { ALLOWED_TAGS: [] }); // sanitize the string to remove all HTML tags
  return sanitizedText.trim(); // trim the string to remove leading and trailing whitespaces
};
