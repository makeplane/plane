import { HTMLElement } from "node-html-parser";
import { IParserExtension } from "@plane/etl/parser";

export class ConfluenceIconParserExtension implements IParserExtension {
  shouldParse(node: HTMLElement): boolean {
    return node.tagName === "IMG";
  }

  async mutate(node: HTMLElement): Promise<HTMLElement> {
    const src = node.getAttribute("src");
    if (!src) return node;

    if (src.includes("emoticons")) {
      const pTag = new HTMLElement("p", {}, "");
      pTag.innerHTML = node.getAttribute("data-emoji-fallback") || "";
      return pTag;
    }

    if (src.includes("icons") || src.includes("thumbnails")) {
      // Remove the html element completely
      node.remove();
      return new HTMLElement("span", {}, "");
    }

    return node;
  }
}
