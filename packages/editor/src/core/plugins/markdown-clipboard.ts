import { Editor } from "@tiptap/core";
import { Fragment, Node } from "@tiptap/pm/model";
import { Plugin, PluginKey } from "@tiptap/pm/state";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";
// flat-list serializer
import { ListDOMSerializer } from "../extensions/flat-list/core/utils/list-serializer";

// Helper function to check if content contains flat-list nodes
const containsFlatListNodes = (content: Fragment | Node): boolean => {
  let hasListNodes = false;

  const checkNode = (node: Node) => {
    if (node.type.name === CORE_EXTENSIONS.LIST) {
      hasListNodes = true;
      return;
    }
    if (node.content) {
      node.content.forEach(checkNode);
    }
  };

  if (content instanceof Fragment) {
    content.forEach(checkNode);
  } else {
    checkNode(content);
  }

  return hasListNodes;
};

// Convert HTML with flat-lists to markdown
const htmlToMarkdown = (html: string): string => {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  let listDepth = 0;

  const processNode = (node: ChildNode): string => {
    // Text node - return as is
    if (node.nodeType === window.Node.TEXT_NODE) {
      return node.textContent || "";
    }

    // Element node
    if (node.nodeType === window.Node.ELEMENT_NODE) {
      const element = node as HTMLElement;

      // Handle native HTML lists (ul/ol) - these come from ListDOMSerializer
      if (element.tagName === "UL" || element.tagName === "OL") {
        const isOrdered = element.tagName === "OL";
        let result = "";
        let itemIndex = 1;
        const indent = "  ".repeat(listDepth);

        listDepth++;

        Array.from(element.children).forEach((li) => {
          if (li.tagName === "LI") {
            // Check for checkboxes in task lists
            const checkbox = li.querySelector('input[type="checkbox"]');
            const isTaskItem = checkbox !== null;

            // Check for flat-list attributes
            const listKind = li.getAttribute("data-list-kind");
            const isChecked = li.hasAttribute("data-list-checked");
            const isCollapsed = li.hasAttribute("data-list-collapsed");
            const listOrder = li.getAttribute("data-list-order");

            if (isTaskItem || listKind === "task") {
              // Task list item - use checkbox state or data attribute
              const checked = checkbox ? (checkbox as HTMLInputElement).checked : isChecked;
              const textContent = li.textContent?.replace(/^\s*/, "").trim() || "";
              result += `${indent}- [${checked ? "x" : " "}] ${textContent}\n`;
            } else if (listKind === "toggle") {
              // Toggle list item - handle collapsed state
              const textContent = li.textContent?.replace(/^\s*/, "").trim() || "";
              const togglePrefix = isCollapsed ? "- " : "- ";
              result += `${indent}${togglePrefix}${textContent}\n`;
            } else {
              // Regular list item - process children to handle nested content
              const childContent = Array.from(li.childNodes)
                .map((child) => processNode(child))
                .join("")
                .trim();

              let prefix: string;
              if (isOrdered || listKind === "ordered") {
                const orderNum = listOrder ? parseInt(listOrder, 10) : itemIndex;
                prefix = `${orderNum}. `;
              } else {
                prefix = "- ";
              }

              result += `${indent}${prefix}${childContent}\n`;
              itemIndex++;
            }
          }
        });

        listDepth--;
        return result;
      }

      // Handle other block elements that should preserve line breaks
      if (["P", "DIV", "H1", "H2", "H3", "H4", "H5", "H6"].includes(element.tagName)) {
        const content = Array.from(element.childNodes)
          .map((child) => processNode(child))
          .join("")
          .trim();
        return content ? content + "\n" : "";
      }

      // Handle other elements by processing their children
      if (element.childNodes.length > 0) {
        return Array.from(element.childNodes)
          .map((child) => processNode(child))
          .join("");
      }
    }

    return "";
  };

  return processNode(doc.body).trim();
};

// Serialize content with flat-lists to markdown via HTML
const serializeFlatListsToMarkdown = (content: Fragment, editor: Editor): string => {
  // Use ListDOMSerializer to convert to HTML with native list elements
  const listSerializer = ListDOMSerializer.fromSchema(editor.schema);
  const htmlFragment = listSerializer.serializeFragment(content);

  // Create a temporary div to get the HTML string
  const tempDiv = document.createElement("div");
  tempDiv.appendChild(htmlFragment);
  const html = tempDiv.innerHTML;

  // Convert HTML to markdown
  return htmlToMarkdown(html);
};

export const MarkdownClipboardPlugin = (editor: Editor): Plugin =>
  new Plugin({
    key: new PluginKey("markdownClipboard"),
    props: {
      clipboardTextSerializer: (slice) => {
        const markdownSerializer = editor.storage.markdown.serializer;
        const isTableRow = slice.content.firstChild?.type?.name === CORE_EXTENSIONS.TABLE_ROW;
        const nodeSelect = slice.openStart === 0 && slice.openEnd === 0;

        // Check if content contains flat-list nodes
        const hasFlatLists = containsFlatListNodes(slice.content);

        if (nodeSelect) {
          // For complete node selections, check if we have flat-lists
          if (hasFlatLists) {
            return serializeFlatListsToMarkdown(slice.content, editor);
          }
          return markdownSerializer.serialize(slice.content);
        }

        const processTableContent = (tableNode: Node | Fragment) => {
          let result = "";
          tableNode.content?.forEach?.((tableRowNode: Node | Fragment) => {
            tableRowNode.content?.forEach?.((cell: Node) => {
              const cellContent = cell.content ? markdownSerializer.serialize(cell.content) : "";
              result += cellContent + "\n";
            });
          });
          return result;
        };

        if (isTableRow) {
          const rowsCount = slice.content?.childCount || 0;
          const cellsCount = slice.content?.firstChild?.content?.childCount || 0;
          if (rowsCount === 1 || cellsCount === 1) {
            return processTableContent(slice.content);
          } else {
            return markdownSerializer.serialize(slice.content);
          }
        }

        const traverseToParentOfLeaf = (node: Node | null, parent: Fragment | Node, depth: number): Node | Fragment => {
          let currentNode = node;
          let currentParent = parent;
          let currentDepth = depth;

          while (currentNode && currentDepth > 1 && currentNode.content?.firstChild) {
            if (currentNode.content?.childCount > 1) {
              if (currentNode.content.firstChild?.type?.name === CORE_EXTENSIONS.LIST_ITEM) {
                return currentParent;
              } else {
                return currentNode.content;
              }
            }

            currentParent = currentNode;
            currentNode = currentNode.content?.firstChild || null;
            currentDepth--;
          }

          return currentParent;
        };

        if (slice.content.childCount > 1) {
          // For multiple children, check if we have flat-lists
          if (hasFlatLists) {
            return serializeFlatListsToMarkdown(slice.content, editor);
          }
          return markdownSerializer.serialize(slice.content);
        } else {
          const targetNode = traverseToParentOfLeaf(slice.content.firstChild, slice.content, slice.openStart);

          let currentNode = targetNode;
          while (currentNode && currentNode.content && currentNode.childCount === 1 && currentNode.firstChild) {
            currentNode = currentNode.firstChild;
          }
          if (currentNode instanceof Node && currentNode.isText) {
            return currentNode.text;
          }

          // Check if target node contains flat-lists
          if (containsFlatListNodes(targetNode)) {
            return serializeFlatListsToMarkdown(
              targetNode instanceof Fragment ? targetNode : Fragment.from([targetNode]),
              editor
            );
          }

          return markdownSerializer.serialize(targetNode);
        }
      },
    },
  });
