import { HTMLElement } from "node-html-parser";
import { IParserExtension } from "@plane/etl/parser";

/*
 *
 * Notion provides us bookmarks with the following structure:
    <figure id="1f8e4060-3fb0-8034-b2c7-ff24981f2307">
      <a
        href="https://www.youtube.com/live/bYgP-tC5BFU?feature=shared"
        class="bookmark source"
        ><div class="bookmark-info">
         ...
        </div>
        <img
          src="https://i.ytimg.com/vi/bYgP-tC5BFU/maxresdefault.jpg"
          class="bookmark-image"
      /></a>
    </figure>

  The below extension will only keep the links and remove all the children of the figure node.
*/
export class ProcessLinksExtension implements IParserExtension {
  shouldParse(node: HTMLElement): boolean {
    return (node.tagName === "A" || node.rawTagName === "a") && (node.getAttribute("class")?.includes("bookmark source") ?? false);
  }

  async mutate(node: HTMLElement): Promise<HTMLElement> {
    // Preserve the href attribute
    const href = node.getAttribute("href");

    // Get the text content from the bookmark-info div if available
    let linkText = "";
    const bookmarkInfo = node.querySelector(".bookmark-info");
    if (bookmarkInfo) {
      const titleEl = bookmarkInfo.querySelector("div.bookmark-title");
      if (titleEl && titleEl.textContent.trim()) {
        linkText = titleEl.textContent.trim();
      }
    }

    // If no title was found, use the href as the link text
    if (!linkText) {
      linkText = href || "Link";
    }

    // Explicitly remove all children first
    while (node.firstChild) {
      node.removeChild(node.firstChild);
    }

    // Set the link text as the content
    node.innerHTML = linkText;

    // Make sure the href attribute is preserved (set it after removing all attributes)
    node.setAttribute("href", href || "#");

    return node;
  }
}
