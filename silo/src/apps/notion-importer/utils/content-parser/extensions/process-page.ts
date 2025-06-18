import { HTMLElement } from "node-html-parser";
import { v4 as uuidv4 } from "uuid";
import { IParserExtension } from "@plane/etl/parser";

export interface NotionPageParserConfig {
  // Required for retrieving assets from cache
  fileId: string; // The file ID needed for retrieving assets from cache
  workspaceSlug: string;
  pageMap: Map<string, string>; // Map of asset paths to asset IDs
}

export class NotionPageParserExtension implements IParserExtension {
  constructor(private readonly config: NotionPageParserConfig) { }

  shouldParse(node: HTMLElement): boolean {
    // Only process img tags
    const hasAnchorTag = node.tagName === "A" || node.rawTagName === "a";
    const isAnHTMLPage = node.getAttribute("href")?.endsWith(".html") ?? false;
    const isNotALink = !node.getAttribute("href")?.startsWith("http");
    return hasAnchorTag && isAnHTMLPage && isNotALink;
  }

  async mutate(node: HTMLElement): Promise<HTMLElement> {
    if (node.tagName === "A" || node.rawTagName === "a") {
      const href = node.getAttribute("href");
      if (!href) return node;

      // Normalize the path - Notion uses relative paths with URL encoding
      const normalizedPath = this.normalizeFilePath(href);
      if (!normalizedPath) return node;

      // Get the page ID using the normalized path
      const pageId = this.config.pageMap.get(normalizedPath);
      if (!pageId) {
        return node;
      }
      const component = this.createPageEmbedComponent(pageId);
      return component;
    }

    return node;
  }

  private normalizeFilePath(src: string): string | undefined {
    // Remove URL encoding and construct the full path
    // This should match how paths were stored in phase one
    const decodedSrc = decodeURIComponent(src);
    // Strip the page and get the last part of the path
    const lastPart = decodedSrc.split("/").pop();
    // Remove the extension from the path
    return lastPart?.replace(/\.[^.]+$/, "");
  }

  /*
   * <page-embed-component id="randomuuid" workspace_identifier="workspaceSlug"  entity_name: "sub_page" entity_identifier="thispage'sId" />
   */
  private createPageEmbedComponent(pageId: string): HTMLElement {
    const component = new HTMLElement("page-embed-component", {}, "");
    component.setAttribute("id", uuidv4());
    component.setAttribute("workspace_identifier", this.config.workspaceSlug);
    component.setAttribute("entity_name", "sub_page");
    component.setAttribute("entity_identifier", pageId);
    return component;
  }
}
