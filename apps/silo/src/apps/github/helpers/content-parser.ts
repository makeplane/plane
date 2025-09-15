import { marked } from "marked";
import TurndownService from "turndown";
import { env } from "@/env";

interface ImageComponent {
  assetId: string;
  url: string;
}

export class ContentParser {
  private static readonly IMAGE_COMPONENT_REGEX = /<image-component[^>]*assetId=["']([^"']+)["'][^>]*>/g;
  private static readonly turndownService = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
  });

  /**
   * Converts Plane's HTML (with custom components) to GitHub Markdown
   */
  static toMarkdown(html: string): string {
    // First convert image components to standard HTML img tags
    const standardHtml = this.replaceImageComponentsWithImgTags(html);
    // Use TurndownService to convert HTML to Markdown
    return this.turndownService.turndown(standardHtml);
  }

  /**
   * Converts GitHub's Markdown/HTML to Plane's HTML format
   */
  static async toPlaneHtml(content: string, isMarkdown: boolean = true): Promise<string> {
    // If content is markdown, first convert it to HTML
    const html = isMarkdown ? await marked(content) : content;

    // Replace standard img tags with image-component
    return this.replaceImgTagsWithImageComponents(html);
  }

  private static replaceImageComponentsWithImgTags(html: string): string {
    return html.replace(this.IMAGE_COMPONENT_REGEX, (match, assetId) => {
      const imageUrl = this.getAssetUrl(assetId);
      return `<img src="${imageUrl}" alt="Asset ${assetId}" />`;
    });
  }

  private static replaceImgTagsWithImageComponents(html: string): string {
    // Create a new turndown instance for custom rules
    const turndown = new TurndownService();

    // Add custom rule for image tags
    turndown.addRule("imageComponent", {
      filter: "img",
      replacement: function (content, node) {
        // Need to cast node to HTMLElement since Turndown uses DOM nodes
        const element = node as HTMLElement;
        const src = element.getAttribute("src");
        if (!src) return "";

        // Here you would implement the logic to get or create an asset ID
        // For now, using a placeholder
        const assetId = "placeholder-asset-id";
        return `<image-component assetId="${assetId}" />`;
      },
    });

    return turndown.turndown(html);
  }

  private static getAssetUrl(assetId: string): string {
    return `/api/assets/${assetId}`;
  }

  /**
   * Helper method to extract all image components from HTML
   */
  static extractImageComponents(html: string): ImageComponent[] {
    const components: ImageComponent[] = [];
    let match;

    while ((match = this.IMAGE_COMPONENT_REGEX.exec(html)) !== null) {
      components.push({
        assetId: match[1],
        url: this.getAssetUrl(match[1]),
      });
    }

    return components;
  }
}
