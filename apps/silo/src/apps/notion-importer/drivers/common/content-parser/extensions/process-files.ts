import { HTMLElement } from "node-html-parser";
import { IParserExtension } from "@plane/etl/parser";
import { logger } from "@/logger";

export interface NotionFileParserConfig {
  // Required for retrieving assets from cache
  fileId: string; // The file ID needed for retrieving assets from cache
  assetMap: Map<string, string>; // Map of asset paths to asset IDs

  // Required for creating a link from an asset ID
  workspaceSlug: string;
  apiBaseUrl: string;
  context?: Map<string, string>;
}

export class NotionFileParserExtension implements IParserExtension {
  constructor(readonly config: NotionFileParserConfig) { }

  shouldParse(node: HTMLElement): boolean {
    // Only process anchor tags that are likely local file links
    const hasAnchorTag = node.tagName === "A" || node.rawTagName === "a";
    const isNotAnHTTPLink = !node.getAttribute("href")?.startsWith("http");
    const isNotAnHTMLPage = !node.getAttribute("href")?.endsWith(".html");
    return hasAnchorTag && isNotAnHTTPLink && isNotAnHTMLPage;
  }

  async mutate(node: HTMLElement): Promise<HTMLElement> {
    if (node.tagName === "A" || node.rawTagName === "a") {
      const href = node.getAttribute("href");
      if (!href) return node;

      // Normalize the path - Notion uses relative paths with URL encoding
      const normalizedPath = this.normalizeFilePath(href);

      // Get the asset ID using the normalized path
      const assetId = this.config.assetMap.get(normalizedPath);
      if (!assetId) {
        logger.warn(`Asset ID not found for path: ${normalizedPath}`);
        return node;
      }

      // Replace the href with the asset url
      const assetUrl = this.createLinkFromAssetId(this.config.apiBaseUrl, assetId);
      node.setAttribute("href", assetUrl);

      return node;
    }

    return node;
  }

  protected normalizeFilePath(src: string): string {
    // Remove URL encoding and construct the full path
    // This should match how paths were stored in phase one
    const decodedSrc = decodeURIComponent(src);
    return decodedSrc;
  }

  createLinkFromAssetId(baseUrl: string, assetId: string): string {
    return `${baseUrl}/api/assets/v2/workspaces/${this.config.workspaceSlug}/${assetId}`;
  }
}
