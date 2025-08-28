import { HTMLElement } from "node-html-parser";
import { IParserExtension } from "@plane/etl/parser";
import { NotionPageParserExtension } from "../../../common/content-parser";

export class ConfluencePageParserExtension extends NotionPageParserExtension implements IParserExtension {
  shouldParse(node: HTMLElement): boolean {
    const hasAnchorTag = node.tagName === "A";
    const isConfluenceLink = node.getAttribute("href")?.includes("/pages/") ?? false;
    const isHTMLPage = node.getAttribute("href")?.endsWith(".html") ?? false;
    return hasAnchorTag && (isConfluenceLink || isHTMLPage);
  }

  protected normalizeFilePath(src: string): string | undefined {
    if (src.startsWith("http")) {
      return super.normalizeFilePath(src);
    } else {
      // In this case we are expecting a src like aaaa_id.html
      const id = src.split("_").pop()?.replace(".html", "");
      return id;
    }
  }
}
