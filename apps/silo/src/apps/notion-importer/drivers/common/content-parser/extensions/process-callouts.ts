import { HTMLElement } from "node-html-parser";
import { IParserExtension } from "@plane/etl/parser";
import { TCalloutConfig } from "@/apps/notion-importer/types";
import { NOTION_COLOR_MAP } from "@/apps/notion-importer/utils/html-helpers";

type TCalloutData = {
  icon: string;
  contentHTML: string;
};

export class CalloutParserExtension implements IParserExtension {
  private readonly defaultIcon = "Info";
  private readonly defaultColor = "#6d7b8a";
  /**
   * Parses Notion callouts with structure:
   * <figure class="callout">
   *   <div><span class="icon">🚧</span></div>
   *   <div><p>Callout content here</p></div>
   * </figure>
   */
  shouldParse(node: HTMLElement): boolean {
    const isFigureTag = node.tagName === "FIGURE" || node.rawTagName === "figure";
    const hasCalloutClass = node.getAttribute("class")?.includes("callout") || false;
    return isFigureTag && hasCalloutClass;
  }

  async mutate(node: HTMLElement): Promise<HTMLElement> {
    // Extract icon and content from the Notion callout
    const calloutData = this.extractCalloutData(node);
    // Create the Plane callout with extracted data
    const planeCallout = this.createPlaneCallout(calloutData.contentHTML, {
      icon: this.defaultIcon,
      color: this.defaultColor,
      background: this.extractBackgroundColor(node),
    });
    return planeCallout;
  }

  /**
   * Essentially our callout encapsulated in the figure tag, holds
   * both the icon and the content, the below function extracts that.
   */
  private extractCalloutData(node: HTMLElement): TCalloutData {
    // Extract icon from the first div > span.icon
    const icon = node.querySelector(".icon")?.textContent?.trim() || "";
    // Extract content from the second div (the one with width: 100%)
    // Find all direct child divs of the figure
    const childDivs = node.querySelectorAll(":scope > div");
    let contentHTML = "";
    if (childDivs.length >= 2) {
      // The second div contains the content
      const contentDiv = childDivs[1];
      contentHTML = contentDiv.innerHTML || "";
    }
    return {
      icon: icon || this.defaultIcon,
      contentHTML: contentHTML.trim(),
    };
  }

  /**
   * Extract background color from Notion callout class
   */
  private extractBackgroundColor(node: HTMLElement): string | undefined {
    const className = node.getAttribute("class") || "";
    const colorMatch = className.match(/block-color-(\w+)_background/);
    return colorMatch ? NOTION_COLOR_MAP.get(colorMatch[1]) : undefined;
  }

  /**
   * Create a Plane callout with the given content and configuration
   */
  protected createPlaneCallout(contentHTML: string, config: TCalloutConfig): HTMLElement {
    const callout = new HTMLElement("div", {}, "");
    callout.setAttribute("data-icon-color", config.color);
    callout.setAttribute("data-icon-name", config.icon);
    callout.setAttribute("data-logo-in-use", "icon");
    callout.setAttribute("data-block-type", "callout-component");

    if (config.background) {
      callout.setAttribute("data-background", config.background);
    }

    callout.innerHTML = contentHTML;
    return callout;
  }
}
