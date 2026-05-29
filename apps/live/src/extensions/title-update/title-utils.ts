import { sanitizeHTML } from "@plane/utils";

/**
 * Utility function to extract text from HTML content
 */
export const extractTextFromHTML = (html: string): string => {
  // Use sanitizeHTML to safely extract text and remove all HTML tags
  // This is more secure than regex as it handles edge cases and prevents injection
  // Note: sanitizeHTML trims whitespace, which is acceptable for title extraction
  return sanitizeHTML(html) || "";
};
