import { HTMLElement } from "node-html-parser";
import { v4 as uuidv4 } from "uuid";
import { IParserExtension } from "../../types";

export type ExternalMentionParserConfig = {
  // The symbol to use for mentions
  mentionSymbol?: string;

  // Entity map to map mentions to entities
  entityMap: Map<string, string>;

  // Add new options for fallback handling
  fallbackOptions?: {
    // If the user is not found in the userMap, we can replace the mention with a link
    replaceWithLink?: (mention: string) => [label: string, url: string];
  };
};

export class ExternalMentionParserExtension implements IParserExtension {
  private readonly MENTION_REGEX: RegExp;

  constructor(private readonly config: ExternalMentionParserConfig) {
    this.config.mentionSymbol = this.config.mentionSymbol ?? "@";
    this.MENTION_REGEX = new RegExp(`${this.config.mentionSymbol}([\\w.-]+)`, "g");
  }

  shouldParse(node: HTMLElement): boolean {
    // Only process if the node contains mentions with THIS extension's symbol
    // Reset the regex before testing
    this.MENTION_REGEX.lastIndex = 0;
    const hasMatch = (node.textContent && this.MENTION_REGEX.test(node.textContent)) || false;
    return hasMatch;
  }

  async mutate(node: HTMLElement): Promise<HTMLElement> {
    const text = node.textContent;

    if (!text) {
      return Promise.resolve(node);
    }

    // Reset regex and find all mentions for THIS symbol only
    this.MENTION_REGEX.lastIndex = 0;
    const mentions = text.match(this.MENTION_REGEX);

    if (!mentions || mentions.length === 0) {
      return node;
    }

    // Handle paragraphs with multiple mentions or mixed text and mentions
    if (mentions.length > 1 || text !== mentions[0]) {
      return this.handleMixedContent(node, mentions);
    }

    // If we have just a single mention that's the entire content, use original logic
    const displayName = mentions[0].replace(this.config.mentionSymbol ?? "@", "");
    const entityId = this.config.entityMap.get(displayName);

    if (entityId) {
      // User found in map - create a mention component
      const mention = this.createMentionComponent(entityId);
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
    // Use innerHTML to preserve existing HTML elements (like links from previous extensions)
    let html = node.innerHTML || node.textContent;
    // Only process mentions that match THIS extension's symbol
    const relevantMentions = mentions.filter((mention) => mention.startsWith(this.config.mentionSymbol ?? "@"));

    // Process each relevant mention and replace it in the HTML
    for (const mention of relevantMentions) {
      const mentionText = mention.replace(this.config.mentionSymbol ?? "@", "");
      const entityId = this.config.entityMap.get(mentionText);

      if (entityId) {
        // Create mention component
        const mentionComponent = this.createMentionComponent(entityId);
        const mentionHtml = mentionComponent.toString();
        html = html.replace(mention, mentionHtml);
      } else if (this.config.fallbackOptions?.replaceWithLink) {
        // Create fallback link
        const [label, url] = this.config.fallbackOptions.replaceWithLink(mentionText);
        const linkElement = new HTMLElement("a", {}, "");
        linkElement.setAttribute("href", encodeURIComponent(url));
        linkElement.setAttribute("target", "_blank");
        linkElement.textContent = label;
        html = html.replace(mention, linkElement.toString());
      }
    }

    // Create a new element with the same tag as the original
    const newElement = new HTMLElement(node.tagName ? node.tagName.toLowerCase() : "p", {}, "");

    // Copy all attributes from the original node
    for (const [key, value] of Object.entries(node.attributes)) {
      newElement.setAttribute(key, value);
    }

    // Set the processed content
    newElement.set_content(html);
    return newElement;
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

    const [label, url] = this.config.fallbackOptions.replaceWithLink(
      node.textContent.replace(this.config.mentionSymbol ?? "@", "")
    );
    const linkElement = new HTMLElement("a", {}, "");
    linkElement.setAttribute("href", url);
    linkElement.textContent = label;

    return linkElement;
  }
}
