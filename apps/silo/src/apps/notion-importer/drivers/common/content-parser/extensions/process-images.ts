import { HTMLElement } from "node-html-parser";
import { IParserExtension } from "@plane/etl/parser";
import { TAssetInfo } from "@/apps/notion-importer/types";
import { logger } from "@/logger";

export interface NotionImageParserConfig {
  fileId: string; // The file ID needed for retrieving assets from cache
  assetMap: Map<string, string>; // Map of asset paths to asset IDs
}

export class NotionImageParserExtension implements IParserExtension {
  constructor(protected config: NotionImageParserConfig) {}

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
      const assetInfo = JSON.parse(this.config.assetMap.get(normalizedPath) || "{}") as TAssetInfo;
      if (!assetInfo.id) {
        logger.warn(`Asset ID not found for path: ${normalizedPath}`);
        return node;
      }

      // Create the image component
      const component = new HTMLElement("image-component", {}, "");
      component.setAttribute("src", assetInfo.id);

      return component;
    }

    return node;
  }

  protected normalizeImagePath(src: string): string {
    // Remove URL encoding and construct the full path
    // This should match how paths were stored in phase one
    const decodedSrc = decodeURIComponent(src);
    // Remove all the query params and everything after it
    const withoutQueryParams = decodedSrc.split("?")[0];

    const components = withoutQueryParams.split("/");
    if (components.length > 2) {
      // Split the path by / and take the last two components
      const lastTwoComponents = withoutQueryParams.split("/").slice(-2);
      return lastTwoComponents.join("/");
    }

    return withoutQueryParams;
  }
}
