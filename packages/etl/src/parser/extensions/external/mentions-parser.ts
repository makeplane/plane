import { HTMLElement } from "node-html-parser";
import { v4 as uuidv4 } from 'uuid';
import { IParserExtension } from "../../types";

const MENTION_REGEX = /@([\w.-]+)/g

export type ExternalMentionParserConfig = {
  userMap: Map<string, string>;
  // Add new options for fallback handling
  fallbackOptions?: {
    // If the user is not found in the userMap, we can replace the mention with a link
    replaceWithLink?: (mention: string) => [label: string, url: string]
  };
}

export class ExternalUserMentionParserExtension implements IParserExtension {
  constructor(private readonly config: ExternalMentionParserConfig) { }

  shouldParse(node: HTMLElement): boolean {
    // Check if paragraph contains @ symbol anywhere in the text
    return node.tagName === "P" && MENTION_REGEX.test(node.textContent)
  }

  async mutate(node: HTMLElement): Promise<HTMLElement> {
    const text = node.textContent;
    if (!text) {
      return Promise.resolve(node);
    }

    // Find all mentions in the text
    const mentions = text.match(MENTION_REGEX);
    if (!mentions || mentions.length === 0) {
      return node;
    }

    // Handle paragraphs with multiple mentions or mixed text and mentions
    if (mentions.length > 1 || text !== mentions[0]) {
      return this.handleMixedContent(node, mentions);
    }

    // If we have just a single mention that's the entire content, use original logic
    const displayName = mentions[0].replace("@", "");
    const userId = this.config.userMap.get(displayName);

    if (userId) {
      // User found in map - create a mention component
      const mention = this.createMentionComponent(userId);
      return mention;
    } else if (this.config.fallbackOptions) {
      // User not found - create an external link as fallback
      return this.handleFallback(node);
    } else {
      // No fallback option - return original node
      return node;
    }
  }

  private handleMixedContent(node: HTMLElement, mentions: string[]): HTMLElement {
    let html = node.textContent;

    // Process each mention and replace it in the HTML
    for (const mention of mentions) {
      const username = mention.replace("@", "");
      const userId = this.config.userMap.get(username);

      if (userId) {
        // Create mention component
        const mentionComponent = this.createMentionComponent(userId);
        const mentionHtml = mentionComponent.toString();
        html = html.replace(mention, mentionHtml);
      } else if (this.config.fallbackOptions?.replaceWithLink) {
        // Create fallback link
        const [label, url] = this.config.fallbackOptions.replaceWithLink(username);
        const linkHtml = `<a href="${url}">${label}</a>`;
        html = html.replace(mention, linkHtml);
      }
    }

    // Create a new paragraph with the processed HTML
    const newParagraph = new HTMLElement("p", {}, "");

    if (node.getAttribute("class")) {
      newParagraph.setAttribute("class", node.getAttribute("class")!);
    }

    // Set the innerHTML of the paragraph
    // Note: This requires that your HTML parser supports setting innerHTML
    // If not, you may need a different approach to construct the DOM
    newParagraph.set_content(html);

    return newParagraph;
  }

  private createMentionComponent(userId: string): HTMLElement {
    const mentionComponent = new HTMLElement("mention-component", {}, "");

    const id = uuidv4();

    // Set only the required attributes
    mentionComponent.setAttribute("id", id);
    mentionComponent.setAttribute("entity_identifier", userId);
    mentionComponent.setAttribute("entity_name", "user_mention");

    return mentionComponent;
  }

  private handleFallback(node: HTMLElement): HTMLElement {
    if (this.config.fallbackOptions?.replaceWithLink) {
      return this.createExternalLink(node);
    }

    return node;
  }

  private createExternalLink(node: HTMLElement): HTMLElement {
    if (!this.config.fallbackOptions?.replaceWithLink) {
      return node;
    }

    const [label, url] = this.config.fallbackOptions.replaceWithLink(node.textContent.replace("@", ""));

    const linkElement = new HTMLElement("a", {}, "");
    linkElement.setAttribute("href", url);
    linkElement.textContent = label;

    return linkElement;
  }
}
