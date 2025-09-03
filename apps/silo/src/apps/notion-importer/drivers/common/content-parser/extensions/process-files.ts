import { HTMLElement } from "node-html-parser";
import { v4 as uuidv4 } from "uuid";
import { IParserExtension } from "@plane/etl/parser";
import { TAssetInfo } from "@/apps/notion-importer/types";

export interface NotionFileParserConfig {
  // Required for retrieving assets from cache
  fileId: string; // The file ID needed for retrieving assets from cache
  assetMap: Map<string, string>; // Map of asset paths to asset IDs

  // Required for creating a link from an asset ID
  workspaceSlug: string;
  apiBaseUrl: string;
  uuidGenerator?: () => string;
  context?: Map<string, string>;
}

export class NotionFileParserExtension implements IParserExtension {
  constructor(readonly config: NotionFileParserConfig) { }

  shouldParse(node: HTMLElement): boolean {
    /*
   * A tag can also exist in case of images, hence if we get to this case, we have to ignore it.
    <a
      href=""
      ><img
        style="width: 681.96875px"
        src=""
    /></a>
    */
    // Only process anchor tags that are likely local file links
    const hasAnchorTag = node.tagName === "A" || node.rawTagName === "a";
    const hasSingleImageChild = node.querySelector("img");

    if (hasAnchorTag && hasSingleImageChild) {
      return false;
    }

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
      const assetInfo = JSON.parse(this.config.assetMap.get(normalizedPath) || "{}") as TAssetInfo;
      if (assetInfo.id) {
        return this.createAttachmentComponent(assetInfo.id, {
          name: assetInfo.name,
          type: assetInfo.type,
          size: assetInfo.size,
        });
      } else {
        const fileSource = this.getFileSource(node);
        return this.createAttachmentComponent(fileSource, {
          name: fileSource,
          type: "application/octet-stream",
          size: 0,
        });
      }
    }

    return node;
  }

  protected getFileSource(node: HTMLElement): string {
    const href = node.getAttribute("href");
    return href || "";
  }

  protected createAttachmentComponent(
    src: string,
    file: {
      name: string;
      type: string;
      size: number;
    }
  ): HTMLElement {
    const attachmentComponent = new HTMLElement("attachment-component", {});
    const id = this.config.uuidGenerator?.() || uuidv4();
    const cleanedFileName = file.name.split("/").pop();
    attachmentComponent.setAttribute("id", id);
    attachmentComponent.setAttribute("src", src);
    attachmentComponent.setAttribute("data-name", cleanedFileName || file.name);
    attachmentComponent.setAttribute("data-file-type", file.type);
    attachmentComponent.setAttribute("data-file-size", file.size.toString());
    return attachmentComponent;
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
