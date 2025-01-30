import { Extension } from "@tiptap/core";
import { Fragment, DOMSerializer, Node, Schema } from "@tiptap/pm/model";
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
            console.log("slice", slice.content);
            const isCompleteNodeSelection = slice.openStart === 0 && slice.openEnd === 0;

            const text = slice.content.textBetween(0, slice.content.size, " ");
            console.log("text", text);
            if (isCompleteNodeSelection) {
              // For complete node selections, use the markdown serializer
              return this.editor.storage.markdown.serializer.serialize(slice.content);
            } else {
              // For partial selections, just serialize the text content
              let textContent = "";
              slice.content.forEach((node) => {
                console.log("node", node);
                if (node.isText) {
                  textContent += node.text;
                } else if (node.content) {
                  node.content.forEach((childNode) => {
                    console.log("aaya", childNode.content.content[0]?.text);
                    if (childNode.type.name === "paragraph") textContent += childNode.content.content[0]?.text;
                  });
                }
              });
              console.log("textContent", textContent);
              return textContent;
            }
            const markdownSerializedContent = this.editor.storage.markdown.serializer.serialize(slice.content);
            const a = transformSliceContent(slice);
            // __AUTO_GENERATED_PRINT_VAR_START__
            // console.log("addProseMirrorPlugins#(anon) a:", a); // __AUTO_GENERATED_PRINT_VAR_END__
            console.log(markdownSerializedContent);
            // const htmlSerializedContent = parseHTMLToMarkdown(markdownSerializedContent);
            // console.log(htmlSerializedContent);
            return markdownSerializedContent;
          },
        },
      }),
    ];
  },
});

function parseHTMLToMarkdown(html: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  // Track list sequences at each nesting level
  const sequences: { [level: number]: number } = {};
  let currentLevel = 0;

  // Process the document by walking through nodes
  function processNode(node: Node): string {
    // Text node - return as is
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || "";
    }

    // Element node
    if (node.nodeType === Node.ELEMENT_NODE) {
      const element = node as HTMLElement;

      // Handle prosemirror-flat-list
      if (element.classList.contains("prosemirror-flat-list")) {
        const listKind = element.getAttribute("data-list-kind");
        if (!listKind) return element.outerHTML;

        // Calculate nesting level
        let level = 0;
        let parent = element.parentElement;
        while (parent) {
          if (parent.classList.contains("list-content")) level++;
          parent = parent.parentElement;
        }

        // Reset sequence if level decreases
        if (level < currentLevel) {
          sequences[level] = 0;
        }
        currentLevel = level;

        // Increment sequence for this level
        sequences[level] = (sequences[level] || 0) + 1;

        // Get the content
        const contentDiv = element.querySelector(".list-content");
        if (!contentDiv) return element.outerHTML;

        const firstChild = contentDiv.firstElementChild;
        if (!firstChild) return element.outerHTML;

        const text = firstChild.textContent?.trim() || "";
        if (!text) return element.outerHTML;

        // Create proper indentation
        const indent = "  ".repeat(level);

        // Format based on list kind
        switch (listKind) {
          case "ordered":
            return `${indent}${sequences[level]}. ${text}`;
          case "bullet":
            return `${indent}- ${text}`;
          case "task":
            const isChecked = element.hasAttribute("data-list-checked");
            return `${indent}- [${isChecked ? "x" : " "}] ${text}`;
          default:
            return element.outerHTML;
        }
      }

      // For non-list elements, process children and return original HTML
      if (element.childNodes.length > 0) {
        const childResults = Array.from(element.childNodes)
          .map((child) => processNode(child))
          .join("");

        // If this is the original element, return as is with processed children
        if (element === element.ownerDocument.documentElement) {
          return childResults;
        }

        // Reconstruct the element with processed children
        const clone = element.cloneNode(false) as HTMLElement;
        clone.innerHTML = childResults;
        return clone.outerHTML;
      }

      // Empty element, return as is
      return element.outerHTML;
    }

    // Any other node type, return as is
    return "";
  }

  return processNode(doc.documentElement);
}

// Function to convert a ProseMirror Fragment to an HTML string
function fragmentToHTML(fragment: Fragment, schema: Schema) {
  const tempDiv = document.createElement("div");
  const serializer = DOMSerializer.fromSchema(schema);
  const domNode = serializer.serializeFragment(fragment);
  tempDiv.appendChild(domNode);
  return tempDiv.innerHTML;
}

function transformSliceContent(slice) {
  function processNode(node: Node) {
    // console.log("node:", node);
    if (node.type?.name.toLowerCase().includes("list")) {
      // Get the HTML representation of the list node itself
      const listHTML = fragmentToHTML(Fragment.empty, node.type.schema);

      // Process children to markdown
      const childrenMarkdown = [];
      node.content.forEach((child) => {
        if (child.content) {
          // console.log("child:", child.content);
          // Convert each child's content to markdown
          // const markdown = this.editor.storage.markdown.serializer.serialize(child.content);
          // childrenMarkdown.push(markdown);
        }
      });

      // Create a hybrid representation: HTML list tags with markdown content
      const openTag = listHTML.split("</ul>")[0]; // or '</ol>' for ordered lists
      const closeTag = "</ul>"; // or '</ol>' for ordered lists

      return `${openTag}${childrenMarkdown.join("\n")}${closeTag}`;
    }

    // For non-list nodes, process normally
    // if (node.content) {
    //   const newContent = [];
    //   node.content.forEach((child) => {
    //     newContent.push(processNode(child));
    //   });
    //   return node?.copy(Fragment.from(newContent));
    // }

    return node;
  }

  return processNode(slice.content);
}
