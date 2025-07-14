import { HTMLElement } from "node-html-parser";
import { NotionFileParserConfig, NotionFileParserExtension } from "../../../common/content-parser";

export class ConfluenceFileParserExtension extends NotionFileParserExtension {
  constructor(config: NotionFileParserConfig) {
    super(config);
  }

  shouldParse(node: HTMLElement): boolean {
    const hasAnchorTag = node.tagName === "A";
    const isNotPageLink = !node.getAttribute("href")?.includes("/pages/");
    return hasAnchorTag && isNotPageLink;
  }

  async mutate(node: HTMLElement): Promise<HTMLElement> {
    await super.mutate(node);
    const wasNodeModified = node.getAttribute("href")?.startsWith(this.config.apiBaseUrl) ?? false;

    if (wasNodeModified) {
      /*
       * If the node was modified, we need to ensure that it has some text to
       * display, otherwise we will not be able to click on the link
       */
      const fileTitle = node.getAttribute("data-linked-resource-default-alias");
      if (fileTitle) {
        node.set_content(fileTitle);
      }

      return node;
    } else {
      /*
       * We need to get the url from the node and replace the href of the node,
       * such that when the user clicks on the link, he will be able to download
       * the file if not from plane then from confluence
       */

      if (this.config.context?.has("data-base-url")) {
        const baseUrl = this.config.context.get("data-base-url");
        const innerText = node.innerText;
        const containerId = this.getContainerId(node);
        if (!containerId) {
          return node;
        }
        const fileSrc = `${baseUrl}/download/attachments/${containerId}/${innerText}`;
        node.setAttribute("href", fileSrc);
      }

      return node;
    }
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
