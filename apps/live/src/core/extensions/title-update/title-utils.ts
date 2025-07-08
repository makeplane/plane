/**
 * Utility function to extract text from HTML content
 */
export const extractTextFromHTML = (html: string): string => {
  // Use a regex to extract text between tags
  const textMatch = html.replace(/<[^>]*>/g, "");
  return textMatch || "";
}; 