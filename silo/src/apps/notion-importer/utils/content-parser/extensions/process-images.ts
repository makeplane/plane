import { HTMLElement } from "node-html-parser";
import { IParserExtension } from "@plane/etl/parser";
import { logger } from "@/logger";

export interface NotionImageParserConfig {
  fileId: string; // The file ID needed for retrieving assets from cache
  assetMap: Map<string, string>; // Map of asset paths to asset IDs
}

export class NotionImageParserExtension implements IParserExtension {
  constructor(private readonly config: NotionImageParserConfig) { }

  shouldParse(node: HTMLElement): boolean {
    // Only process img tags
    const hasImageTag = node.tagName === "IMG" || node.rawTagName === "img";
    const isNotALink = !node.getAttribute("src")?.startsWith("http");
    const isNotAnHTMLPage = !node.getAttribute("src")?.endsWith(".html");
    return hasImageTag && isNotALink && isNotAnHTMLPage;
  }

  async mutate(node: HTMLElement): Promise<HTMLElement> {
    if (node.tagName === "IMG" || node.rawTagName === "img") {
      const src = node.getAttribute("src");
      if (!src) return node;

      // Normalize the path - Notion uses relative paths with URL encoding
      const normalizedPath = this.normalizeImagePath(src);

      // Get the asset ID using the normalized path
      const assetId = this.config.assetMap.get(normalizedPath);
      if (!assetId) {
        logger.warn(`Asset ID not found for path: ${normalizedPath}`);
        return node;
      }

      // Create the image component
      const component = new HTMLElement("image-component", {}, "");
      component.setAttribute("src", assetId);

      return component;
    }

    return node;
  }

  private normalizeImagePath(src: string): string {
    // Remove URL encoding and construct the full path
    // This should match how paths were stored in phase one
    const decodedSrc = decodeURIComponent(src);

    const components = decodedSrc.split("/");
    if (components.length > 2) {
      // Split the path by / and take the last two components
      const lastTwoComponents = decodedSrc.split("/").slice(-2);
      return lastTwoComponents.join("/");
    }

    return decodedSrc;
  }
}
