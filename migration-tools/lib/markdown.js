import { marked } from "marked";

// Convert markdown to HTML for Questimus description_html fields.
// The server sanitizes the HTML (validate_html_content) on write.
export function mdToHtml(md) {
  return marked.parse(md ?? "", { gfm: true });
}
