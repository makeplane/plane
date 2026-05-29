// - Parses TipTap/ProseMirror HTML fragments
// - Removes <u> tags (Markdown has no underline)
// - Adds a space after checkbox inputs for correct GFM task list rendering
// - Converts to Markdown using rehype→remark, GFM, and remark-stringify

import type { Element as HASTElement, ElementContent, Parent as HASTParent } from "hast";
import rehypeParse from "rehype-parse";
import rehypeRemark from "rehype-remark";
import remarkGfm from "remark-gfm";
import remarkStringify from "remark-stringify";
import { unified } from "unified";
// local imports
import { parseCustomComponents } from "./custom-components-handler";
import { parseMarks } from "./marks-handler";
import type { TCustomComponentsMetaData } from "./types";

// Rehype plugin to handle TipTap task lists and convert them to GFM-compatible format
// TipTap structure: <li data-type="taskItem"><label><input><span></span></label><div><p>text</p></div></li>
// We need: <li><input> text (with space after checkbox for proper GFM rendering)
function addSpacesToCheckboxes() {
  return (tree: HASTParent) => {
    const helper = (node: HASTParent): void => {
      if (!Array.isArray(node.children) || node.children.length === 0) return;

      for (let i = 0; i < node.children.length; i++) {
        const child = node.children[i];

        // Check if this is a task list item
        if (
          child &&
          child.type === "element" &&
          child.tagName === "li" &&
          child.properties &&
          child.properties["data-type"] === "taskItem"
        ) {
          const liElement = child;

          // Find the label and div elements
          const label = liElement.children?.find((c) => c.type === "element" && c.tagName === "label") as
            | HASTElement
            | undefined;

          const contentDiv = liElement.children?.find((c) => c.type === "element" && c.tagName === "div") as
            | HASTElement
            | undefined;

          if (label && contentDiv) {
            // Find the checkbox input
            const checkbox = label.children?.find(
              (c) => c.type === "element" && c.tagName === "input" && c.properties?.type === "checkbox"
            ) as HASTElement | undefined;

            if (checkbox) {
              // Extract text content from the div, unwrapping any paragraph tags
              const textContent: ElementContent[] = [];
              if (contentDiv.children) {
                for (const child of contentDiv.children) {
                  if (child.type === "element" && child.tagName === "p") {
                    // Unwrap paragraph - add its children directly
                    const pElement = child;
                    if (pElement.children) {
                      textContent.push(...pElement.children);
                    }
                  } else {
                    // Keep other elements as-is
                    textContent.push(child);
                  }
                }
              }

              // Flatten the structure: move checkbox and content to be direct children of li
              liElement.children = [
                checkbox,
                { type: "text", value: " " }, // Add space after checkbox
                ...textContent,
              ];
            }
          }
        } else if (child && child.type === "element") {
          helper(child);
        }
      }
    };

    helper(tree);
  };
}

type TArgs = {
  description_html: string;
  metaData: TCustomComponentsMetaData;
  name?: string;
};

/**
 * Sanitizes a string by escaping HTML entities to prevent XSS attacks
 * @param str - The string to sanitize
 * @returns The sanitized string with escaped HTML entities
 */
function sanitizeHTML(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

export function convertHTMLToMarkdown(args: TArgs): string {
  const { description_html, metaData, name } = args;

  let updatedDescriptionHtml = description_html;
  if (name) {
    const sanitizedName = sanitizeHTML(name);
    updatedDescriptionHtml = `<h1>${sanitizedName}</h1>\n\n${description_html}`;
  }

  const result = unified()
    .use(rehypeParse, { fragment: true })
    .use(addSpacesToCheckboxes)
    .use(rehypeRemark, {
      handlers: {
        ...parseCustomComponents({
          metaData,
        }),
        ...parseMarks,
      },
    })
    .use(remarkGfm)
    .use(remarkStringify, {
      handlers: {
        text: (node: { value: string }): string => node.value,
      },
    })
    .processSync(updatedDescriptionHtml);

  const markdown = String(result.value ?? result);

  return markdown;
}
