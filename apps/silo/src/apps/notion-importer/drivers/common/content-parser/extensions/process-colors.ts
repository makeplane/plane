import { HTMLElement } from "node-html-parser";
import { IParserExtension } from "@plane/etl/parser";

/*
 * We can keep here, as we are not using the color map in other places
 */
const NOTION_COLOR_MAP = new Map([
  ["brown", "peach"],
  ["gray", "gray"],
  ["red", "peach"],
  ["orange", "orange"],
  ["yellow", "green"],
  ["blue", "light-blue"],
  ["purple", "purple"],
  ["pink", "pink"],
  ["teal", "dark-blue"],
]);

export class NotionBlockColorParserExtension implements IParserExtension {
  shouldParse(node: HTMLElement): boolean {
    if (!node.classList) return false;
    const classValue = node.classList.value;
    /*
     * We are not suporting table header colors as of now, as the colors in plane
     * and the colors in notion are very different to be able to map them
     */
    const isNotTableHeader = node.tagName !== "TH" && node.tagName !== "TR" && node.tagName !== "TD";
    return isNotTableHeader && classValue.some((className) => className.startsWith("block-color-"));
  }

  async mutate(node: HTMLElement): Promise<HTMLElement> {
    const classValue = node.classList.value;

    // Find the color class
    const colorClassMatch = classValue.find((className) => className.startsWith("block-color-"));
    if (!colorClassMatch) return node;

    const color = colorClassMatch.split("-").pop();
    if (!color) return node;
    // Get the content
    const content = node.innerHTML;

    // Remove the block-color class
    node.classList.remove(colorClassMatch);

    // Set appropriate block class
    if (node.tagName === "P") {
      node.setAttribute("class", "editor-paragraph-block");
    } else if (node.tagName.match(/^H[1-6]$/)) {
      node.setAttribute("class", "editor-heading-block");
    }

    // Create appropriate span with color attribute
    let newHTML;
    if (color.endsWith("_background")) {
      // Extract base color by removing "_background" suffix
      const baseColor = color.replace("_background", "");

      // Try to map the color, but if no mapping exists, keep the original
      const mappedColor = NOTION_COLOR_MAP.get(baseColor) || baseColor;

      newHTML = `<span data-background-color="${mappedColor}">${content}</span>`;
    } else {
      // For text colors, get the mapped color
      const mappedColor = NOTION_COLOR_MAP.get(color);

      // Only create the span if we have a valid mapping
      if (mappedColor) {
        newHTML = `<span data-text-color="${mappedColor}">${content}</span>`;
      } else {
        // No mapping found for text color, return original node
        return node;
      }
    }

    // Set the new content
    node.set_content(newHTML);

    return node;
  }
}

export class NotionHighlightParserExtension implements IParserExtension {
  shouldParse(node: HTMLElement): boolean {
    // Check if this is a mark element with highlight class
    //
    const isNotTableHeader = node.tagName !== "TH" && node.tagName !== "TR" && node.tagName !== "TD";
    return (
      isNotTableHeader &&
      node.tagName === "MARK" &&
      node.classList &&
      node.classList.value.some((className) => className.startsWith("highlight-"))
    );
  }

  async mutate(node: HTMLElement): Promise<HTMLElement> {
    // Get the highlight class (e.g., highlight-blue)
    const classValue = node.classList.value;
    const highlightMatch = classValue.find((className) => className.startsWith("highlight-"));

    if (!highlightMatch) return node;

    // Extract color name
    let color = highlightMatch.split("-").pop();
    if (!color) return node;

    // Get the content
    const content = node.innerHTML;

    // Create a new span element
    const span = new HTMLElement("span", {}, "");

    // Add the data-background-color attribute
    if (color.endsWith("_background")) {
      color = color.replace("_background", "");
      color = NOTION_COLOR_MAP.get(color) || color;
      span.setAttribute("data-background-color", color);
    } else {
      color = NOTION_COLOR_MAP.get(color) || color;
      span.setAttribute("data-text-color", color);
    }

    // Set the content
    span.set_content(content);

    return span;
  }
}
