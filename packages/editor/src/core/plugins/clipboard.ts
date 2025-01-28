import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";

export const MarkdownClipboard = Extension.create({
  name: "markdownClipboardNew",
  addOptions() {
    return {
      transformPastedText: false,
      transformCopiedText: false,
    };
  },
  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey("markdownClipboardNew"),
        props: {
          clipboardTextSerializer: (slice) => {
            const markdownSerializedContent = this.editor.storage.markdown.serializer.serialize(slice.content);
            const htmlSerializedContent = parseHTMLToMarkdown(markdownSerializedContent);
            return htmlSerializedContent;
          },
        },
      }),
    ];
  },
});

function parseHTMLToMarkdown(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const output: string[] = [];
  const currentListSequence: { [key: number]: number } = {}; // Track counters for each level

  // Process nodes sequentially
  doc.body.childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent?.trim();
      if (text) output.push(text);
    } else if (node instanceof HTMLElement) {
      if (node.classList.contains("prosemirror-flat-list")) {
        const listItem = processListItem(node, currentListSequence);
        if (listItem) output.push(listItem);
      } else {
        const text = node.textContent?.trim();
        if (text) output.push(text);
      }
    }
  });

  return output.join("\n");
}

function processListItem(element: HTMLElement, sequence: { [key: number]: number }, level = 0): string {
  const kind = element.getAttribute("data-list-kind");
  const content = element.querySelector(".list-content");
  if (!content) return "";

  const lines: string[] = [];
  const indent = "  ".repeat(level);

  // Initialize sequence for this level if not exists
  if (!(level in sequence)) sequence[level] = 0;

  // Process each child in the content
  Array.from(content.children).forEach((child) => {
    if (child instanceof HTMLElement) {
      if (child.classList.contains("prosemirror-flat-list")) {
        // Nested list
        const nestedItem = processListItem(child, sequence, level + 1);
        if (nestedItem) lines.push(nestedItem);
      } else {
        // Regular content
        const text = child.textContent?.trim();
        if (text) {
          sequence[level]++; // Increment counter for current level
          const marker = getListMarker(kind, sequence[level], level);
          lines.push(`${indent}${marker}${text}`);
        }
      }
    }
  });

  return lines.join("\n");
}

function getListMarker(kind: string | null, count: number, level: number): string {
  switch (kind) {
    case "ordered":
      // For nested ordered lists, use different markers based on level
      switch (level % 3) {
        case 0:
          return `${count}. `;
        case 1:
          return `${String.fromCharCode(96 + count)}. `; // a, b, c...
        case 2:
          return `${toRoman(count)}. `; // i, ii, iii...
        default:
          return `${count}. `;
      }
    case "bullet":
      return "- ";
    case "task":
      return "- [ ] ";
    case "toggle":
      return "> ";
    default:
      return "- ";
  }
}

// Helper function to convert numbers to roman numerals for third level
function toRoman(num: number): string {
  const romanNumerals = [["i", "ii", "iii", "iv", "v", "vi", "vii", "viii", "ix", "x"]];
  return romanNumerals[0][num - 1] || `${num}`;
}
