import { HTMLElement } from "node-html-parser";
import { IParserExtension } from "@plane/etl/parser";

const CONFLUENCE_STATUS_COLOR_MAP = new Map([
  ["complete", "light-blue"],
  ["success", "green"],
  ["current", "orange"],
  ["error", "peach"],
  ["progress", "purple"],
  ["none", "gray"],
]);

// Map RGB background colors to Plane color names
const CONFLUENCE_BACKGROUND_COLOR_MAP = new Map([
  ["rgb(220,223,228)", "gray"], // Light gray
  ["rgb(198,237,251)", "light-blue"], // Light blue
  ["rgb(211,241,167)", "green"], // Light green
  ["rgb(254,222,200)", "peach"], // Light peach
  ["rgb(253,208,236)", "pink"], // Light pink
  ["rgb(223,216,253)", "purple"], // Light purple
]);

export class ConfluenceStatusMacroParserExtension implements IParserExtension {
  shouldParse(node: HTMLElement): boolean {
    return (node.tagName === "SPAN" && node.getAttribute("class")?.includes("status-macro")) || false;
  }

  async mutate(node: HTMLElement): Promise<HTMLElement> {
    const classValue = node.getAttribute("class")?.split(" ");
    const status =
      classValue?.find(
        (className) => className !== "aui-lozenge-visual-refresh" && className.startsWith("aui-lozenge-")
      ) ?? "none";
    const color = status.split("-").pop();
    if (!color) return node;

    const newHTML = `<span data-background-color="${this.getColorForStatus(color)}">${node.innerHTML}</span>`;
    node.set_content(newHTML);

    return node;
  }

  getColorForStatus(status: string) {
    return CONFLUENCE_STATUS_COLOR_MAP.get(status) ?? "gray";
  }
}

export class ConfluenceColorIdParserExtension implements IParserExtension {
  private colorMap: Map<string, string> = new Map();

  constructor(private context?: Map<string, any>) {}

  shouldParse(node: HTMLElement): boolean {
    // Check if the node has a data-colorid attribute
    return node.hasAttribute("data-colorid");
  }

  async mutate(node: HTMLElement): Promise<HTMLElement> {
    // Load color map from context if not already loaded
    if (this.colorMap.size === 0 && this.context) {
      const colorMap = this.context.get("confluence-color-map");
      if (colorMap) {
        try {
          this.colorMap = new Map(colorMap);
        } catch (error) {
          console.warn("Failed to parse confluence color map from context:", error);
        }
      }
    }

    const colorId = node.getAttribute("data-colorid");
    if (!colorId) return node;

    // Get the Plane color name directly from the map
    const planeColor = this.colorMap.get(colorId);
    if (!planeColor) return node;

    // Get the content
    const content = node.innerHTML;

    // Remove the data-colorid attribute
    node.removeAttribute("data-colorid");

    // Create a span with the Plane color attribute
    const newHTML = `<span data-text-color="${planeColor}">${content}</span>`;
    node.set_content(newHTML);

    return node;
  }
}

export class ConfluenceBackgroundColorParserExtension implements IParserExtension {
  shouldParse(node: HTMLElement): boolean {
    const style = node.getAttribute("style");
    return style?.includes("background-color") || false;
  }

  async mutate(node: HTMLElement): Promise<HTMLElement> {
    const style = node.getAttribute("style");
    if (!style) return node;

    // Extract background-color from style attribute
    const bgColorMatch = style.match(/background-color:\s*(rgb\([^)]+\))/);
    if (!bgColorMatch) return node;

    const rgbColor = bgColorMatch[1];
    const planeColor = CONFLUENCE_BACKGROUND_COLOR_MAP.get(rgbColor);

    if (!planeColor) return node;

    // Create a new span element with the Plane background color attribute
    const newSpan = new HTMLElement("span", {}, "");
    newSpan.setAttribute("data-background-color", planeColor);
    newSpan.innerHTML = node.innerHTML;

    return newSpan;
  }
}
