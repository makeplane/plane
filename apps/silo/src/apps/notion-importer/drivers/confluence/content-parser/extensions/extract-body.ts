import { HTMLElement, TextNode } from "node-html-parser";
import { IParserExtension } from "@plane/etl/parser";
import { ExtractBodyExtension } from "../../../common/content-parser";

export class ConfluenceExtractBodyExtension extends ExtractBodyExtension {
  private hexToRgb(hex: string): [number, number, number] {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return [r, g, b];
  }

  private rgbToHsv(r: number, g: number, b: number): [number, number, number] {
    r /= 255;
    g /= 255;
    b /= 255;

    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const diff = max - min;

    let h = 0;
    let s = 0;
    const v = max;

    if (diff !== 0) {
      s = max === 0 ? 0 : diff / max;

      if (max === r) {
        h = ((g - b) / diff) % 6;
      } else if (max === g) {
        h = (b - r) / diff + 2;
      } else if (max === b) {
        h = (r - g) / diff + 4;
      }

      h *= 60;
      if (h < 0) h += 360;
    }

    return [h, s, v];
  }

  private classifyColorByHsv(h: number, s: number, v: number): string {
    // Special case for purple detection - purple can have low saturation but specific hue ranges
    if (h >= 240 && h < 300) {
      // For purple, we allow lower saturation (0.1 instead of 0.15)
      if (s >= 0.1) {
        return "purple";
      }
    }

    // Handle grays (low saturation) - but not for purple range
    if (s < 0.15) {
      if (v < 0.3) return "gray"; // Dark gray
      if (v > 0.8) return "gray"; // Light gray
      return "gray"; // Medium gray
    }

    // Additional gray detection for colors with very low saturation but might have slight tints
    if (s < 0.25 && v < 0.6) {
      return "gray"; // Dark colors with low saturation are likely gray
    }

    // Classify by hue ranges - adjusted for better color separation
    if (h >= 0 && h < 25) return "peach"; // Reds
    if (h >= 25 && h < 45) return "orange"; // Oranges
    if (h >= 45 && h < 75) return "orange"; // Yellow-oranges
    if (h >= 75 && h < 165) return "green"; // Greens (expanded range)
    if (h >= 165 && h < 195) return "light-blue"; // Cyans
    if (h >= 195 && h < 240) return "dark-blue"; // Blues (narrowed range)
    if (h >= 300 && h < 360) return "pink"; // Magentas

    return "gray"; // Fallback
  }

  private mapHexToPlaneColor(hexColor: string): string {
    const [r, g, b] = this.hexToRgb(hexColor);
    const [h, s, v] = this.rgbToHsv(r, g, b);

    const planeColor = this.classifyColorByHsv(h, s, v);

    return planeColor;
  }

  private extractColorMap(node: HTMLElement): Map<string, string> {
    const colorMap = new Map<string, string>();

    // Find all style tags in the document
    const styleTags = node.querySelectorAll("style");

    for (const styleTag of styleTags) {
      const styleContent = styleTag.textContent;
      if (!styleContent) continue;

      // Parse the CSS to extract color definitions
      // Updated regex to handle minified CSS: [data-colorid=xxx]{color:#xxxxxx}
      const colorRegex = /\[data-colorid=([^\]]+)\]\{color:(#[0-9a-fA-F]{6})\}/g;
      let match;

      while ((match = colorRegex.exec(styleContent)) !== null) {
        const colorId = match[1];
        const hexColor = match[2];

        // Map the hex color to Plane color name using HSV classification
        const planeColor = this.mapHexToPlaneColor(hexColor);
        colorMap.set(colorId, planeColor);
      }
    }

    return colorMap;
  }

  async mutate(node: HTMLElement): Promise<HTMLElement> {
    // Extract color map from the original HTML node BEFORE extracting the body
    const colorMap = this.extractColorMap(node);

    // Store the color map in context as a JSON string
    if (colorMap.size > 0) {
      this.config.context?.set("confluence-color-map", colorMap);
    }

    const extractedNode = await super.mutate(node);

    const baseUrl = extractedNode.querySelector("[data-base-url]");
    if (baseUrl) {
      this.config.context?.set("data-base-url", baseUrl.getAttribute("data-base-url") ?? "");
      return extractedNode;
    }
    return extractedNode;
  }
}

export class PTagCustomComponentExtension implements IParserExtension {
  shouldParse(node: HTMLElement): boolean {
    // Only handle P or SPAN nodes that have exactly one child
    if (node.tagName === "P" || node.tagName === "SPAN") {
      // Check for the child nodes, and remove empty text nodes
      const childNodes = node.childNodes.filter((child) => {
        if (child instanceof TextNode) {
          return child.textContent.trim() !== "";
        }
        return true;
      });

      if (childNodes.length === 1) {
        const child = node.childNodes[0];
        // Check if the child is an element (not text) and is a media element
        if (child instanceof HTMLElement) {
          return ["IMAGE-COMPONENT", "MENTION-COMPONENT", "ISSUE-EMBED-COMPONENT", "PAGE-EMBED-COMPONENT"].includes(
            child.tagName
          );
        }
      }
    }
    return false;
  }

  async mutate(node: HTMLElement): Promise<HTMLElement> {
    // Extract the wrapped child element
    const child = node.childNodes[0] as HTMLElement;

    // Return the child element to replace the parent
    return child;
  }
}
