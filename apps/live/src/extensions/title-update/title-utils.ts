import DOMPurify from "isomorphic-dompurify";

/**
 * Sanitizes HTML by removing all HTML tags, leaving only text content
 * @param htmlString - The HTML string to sanitize
 * @returns The sanitized text with all HTML tags removed
 */
const sanitizeHTML = (htmlString: string): string => {
  const sanitizedText = DOMPurify.sanitize(htmlString, { ALLOWED_TAGS: [] }); // sanitize the string to remove all HTML tags
  return sanitizedText.trim(); // trim the string to remove leading and trailing whitespaces
};

/**
 * Utility function to extract text from HTML content
 */
export const extractTextFromHTML = (html: string): string => {
  // Use sanitizeHTML to safely extract text and remove all HTML tags
  // This is more secure than regex as it handles edge cases and prevents injection
  // Note: sanitizeHTML trims whitespace, which is acceptable for title extraction
  return sanitizeHTML(html) || "";
};
