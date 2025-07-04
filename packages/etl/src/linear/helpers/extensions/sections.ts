import { HTMLElement } from "node-html-parser";
import { IParserExtension } from "@/parser";

/*
  This extension converts Linear Docs Sections into Plane Callouts
*/
export class LinearSectionParserExtension implements IParserExtension {
  constructor() { }

  shouldParse(node: HTMLElement): boolean {
    // Only process paragraph tags that start with "+++"
    if (node.tagName === "P") {
      const text = node.textContent.trim();
      return text.startsWith("+++");
    }
    return false;
  }

  async mutate(node: HTMLElement): Promise<HTMLElement> {
    const startText = node.textContent

    // If this is an end marker, just return it unchanged
    if (startText === "+++") {
      return node;
    }

    // This is a start marker - extract the title (everything after "+++ ")
    const title = startText.substring(4).trim();

    // Collect all content nodes until we find the end marker
    const contentNodes = [];
    let currentNode = node.nextElementSibling;
    let endMarkerNode = null;

    while (currentNode) {
      const currentText = currentNode.textContent.trim();

      // Check if this is the end marker
      if (currentNode.tagName === "P" && currentText === "+++") {
        endMarkerNode = currentNode;
        break;
      }

      contentNodes.push(currentNode);
      currentNode = currentNode.nextElementSibling;
    }

    // If no end marker found, return the original node
    if (!endMarkerNode) {
      return node;
    }

    // Create the callout component
    const callout = new HTMLElement("div", {}, "");

    // Set default callout attributes
    callout.setAttribute("data-icon-color", "#6d7b8a");
    callout.setAttribute("data-icon-name", "AlignRight");
    callout.setAttribute("data-emoji-unicode", "128161"); // Lightbulb emoji
    callout.setAttribute("data-emoji-url", "https://cdn.jsdelivr.net/npm/emoji-datasource-apple/img/apple/64/1f4a1.png");
    callout.setAttribute("data-logo-in-use", "icon");
    callout.setAttribute("data-background", "");
    callout.setAttribute("data-block-type", "callout-component");

    // Add title as heading if available
    if (title) {
      const heading = new HTMLElement("h1", { class: "editor-heading-block" }, "");
      heading.set_content(title);
      callout.appendChild(heading);
    }

    // Add all content nodes to the callout
    for (const contentNode of contentNodes) {
      callout.appendChild(contentNode.clone());
    }

    try {
      // Get the parent node
      const parent = node.parentNode;
      if (!parent) {
        return callout;
      }

      // Get the index of the start marker
      const startIndex = Array.from(parent.childNodes).indexOf(node);

      // Replace the start marker with the callout
      parent.childNodes[startIndex] = callout;

      // Remove all content nodes and end marker
      for (const nodeToRemove of [...contentNodes, endMarkerNode]) {
        try {
          parent.removeChild(nodeToRemove);
        } catch (error) {
          console.error(`Error removing node: ${error}`);
        }
      }
    } catch {
      return callout;
    }

    return callout;
  }
}
