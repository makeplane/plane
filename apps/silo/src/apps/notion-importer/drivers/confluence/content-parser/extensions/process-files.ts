import { HTMLElement } from "node-html-parser";
import { NotionFileParserConfig, NotionFileParserExtension } from "../../../common/content-parser";

export class ConfluenceFileParserExtension extends NotionFileParserExtension {
  constructor(config: NotionFileParserConfig) {
    super(config);
  }

  shouldParse(node: HTMLElement): boolean {
    const hasAnchorTag = node.tagName === "A";
    const isNotPageLink = !node.getAttribute("href")?.includes("/pages/");
    const isNotMention = !node.getAttribute("href")?.includes("/people/");
    const isNonHTMLfile = this.isNonHTMLFile(node.getAttribute("href") || "");
    return hasAnchorTag && isNotPageLink && isNotMention && isNonHTMLfile;
  }

  protected getFileSource(node: HTMLElement): string {
    if (this.config.context?.has("data-base-url")) {
      const baseUrl = this.config.context.get("data-base-url");
      const innerText = node.innerText;
      const containerId = this.getContainerId(node);
      if (!containerId) {
        return "";
      }
      return `${baseUrl}/download/attachments/${containerId}/${innerText}`;
    }

    return node.getAttribute("href") || "";
  }

  protected normalizeFilePath(src: string): string {
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

  private getContainerId(node: HTMLElement): string | undefined {
    const href = node.getAttribute("href");
    if (!href) {
      return undefined;
    }
    const parts = href.split("/");

    if (parts.length < 2) {
      return undefined;
    }

    return parts[parts.length - 2];
  }
}
