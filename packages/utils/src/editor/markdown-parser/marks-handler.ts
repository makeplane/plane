import type { Handle } from "hast-util-to-mdast";
import type { PhrasingContent, Text as MDASTText } from "mdast";
// local imports
import { createTextNode } from "./common";

const processMarkElement = (state: Parameters<Handle>[0], node: Parameters<Handle>[1], wrapper: string): MDASTText => {
  if (node.children && node.children.length > 0) {
    // Process all children and collect their text content
    const processedChildren: PhrasingContent[] = [];

    for (const child of node.children) {
      if (child.type === "text") {
        // Direct text child - keep as is
        processedChildren.push(child as MDASTText);
      } else if (child.type === "element") {
        // Element child - recursively process it
        const processed = state.one(child, node);
        if (processed) {
          if (Array.isArray(processed)) {
            processedChildren.push(...(processed as PhrasingContent[]));
          } else {
            processedChildren.push(processed as PhrasingContent);
          }
        }
      }
    }

    // Concatenate all text content and wrap with the specified wrapper
    const combinedText = processedChildren.map((child) => (child.type === "text" ? child.value : "")).join("");

    return createTextNode(`${wrapper}${combinedText}${wrapper}`);
  }

  // Empty element - return empty text
  return createTextNode("");
};

export const parseMarks: Record<string, Handle> = {
  u: (state, node) => processMarkElement(state, node, ""),
  i: (state, node) => processMarkElement(state, node, "_"),
  em: (state, node) => processMarkElement(state, node, "_"),
};
