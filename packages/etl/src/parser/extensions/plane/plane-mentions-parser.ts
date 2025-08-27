import { HTMLElement } from "node-html-parser";
import { IParserExtension } from "../../types";

export type PlaneMentionResult =
  | {
      type: "text";
      text: string;
    }
  | {
      type: "link";
      link: string;
      label: string;
    };

export type PlaneMentionCallback = (mentionData: {
  id?: string;
  entityIdentifier?: string;
  entityName?: string;
}) => PlaneMentionResult;

export type PlaneMentionParserConfig = {
  callback: PlaneMentionCallback;
};

export class PlaneMentionParserExtension implements IParserExtension {
  constructor(private readonly config: PlaneMentionParserConfig) {}

  shouldParse(node: HTMLElement): boolean {
    // Check if the node contains mention-component elements
    return this.findMentionComponents(node).length > 0;
  }

  async mutate(node: HTMLElement): Promise<HTMLElement> {
    // Find all mention components in the node
    const mentionComponents = this.findMentionComponents(node);

    if (mentionComponents.length === 0) {
      return node;
    }

    // If the node itself is a mention component, process it directly
    if (node.tagName?.toLowerCase() === "mention-component") {
      return this.processMentionComponent(node);
    }

    // If the node contains mention components, process each one
    return this.processMixedContent(node, mentionComponents);
  }

  private findMentionComponents(node: HTMLElement): HTMLElement[] {
    const components: HTMLElement[] = [];

    // Check if the current node is a mention component
    if (node.tagName?.toLowerCase() === "mention-component") {
      components.push(node);
    }

    // Recursively check children
    if (node.childNodes) {
      for (const child of node.childNodes) {
        if (child instanceof HTMLElement) {
          components.push(...this.findMentionComponents(child));
        }
      }
    }

    return components;
  }

  private processMentionComponent(mentionComponent: HTMLElement): HTMLElement {
    // Extract data from the mention component
    const mentionData = this.extractMentionData(mentionComponent);

    // Call the callback to get the replacement
    const result = this.config.callback(mentionData);

    // Create the replacement element based on the result
    return this.createReplacementElement(result);
  }

  private processMixedContent(node: HTMLElement, mentionComponents: HTMLElement[]): HTMLElement {
    // Clone the node to avoid modifying the original
    const newElement = new HTMLElement(node.tagName ? node.tagName.toLowerCase() : "p", {}, "");

    // Copy all attributes from the original node
    for (const [key, value] of Object.entries(node.attributes)) {
      newElement.setAttribute(key, value);
    }

    // Get the HTML content
    let html = node.innerHTML || node.textContent || "";

    // Process each mention component
    for (const mentionComponent of mentionComponents) {
      const mentionData = this.extractMentionData(mentionComponent);
      const result = this.config.callback(mentionData);
      const replacement = this.createReplacementElement(result);

      // Replace the mention component HTML with the replacement HTML
      const mentionHtml = mentionComponent.toString();
      const replacementHtml = replacement.toString();
      html = html.replace(mentionHtml, replacementHtml);
    }

    // Set the processed content
    newElement.set_content(html);
    return newElement;
  }

  private extractMentionData(mentionComponent: HTMLElement): any {
    const data: any = {};

    // Extract common attributes
    const id = mentionComponent.getAttribute("id");
    const entityIdentifier = mentionComponent.getAttribute("entity_identifier");
    const entityName = mentionComponent.getAttribute("entity_name");

    if (id) data.id = id;
    if (entityIdentifier) data.entityIdentifier = entityIdentifier;
    if (entityName) data.entityName = entityName;
    // Extract any additional attributes
    for (const [key, value] of Object.entries(mentionComponent.attributes)) {
      if (!["id", "entity_identifier", "entity_name"].includes(key)) {
        data[key] = value;
      }
    }

    return data;
  }

  private createReplacementElement(result: PlaneMentionResult): HTMLElement {
    if (result.type === "text") {
      // Create a text node (we'll use a span to wrap it)
      const textElement = new HTMLElement("span", {}, "");
      textElement.textContent = result.text;
      return textElement;
    } else if (result.type === "link") {
      // Create a link element
      const linkElement = new HTMLElement("a", {}, "");
      linkElement.setAttribute("href", result.link);
      linkElement.setAttribute("target", "_blank");
      linkElement.textContent = result.label;
      return linkElement;
    }

    // Fallback - should never happen with proper typing
    const fallbackElement = new HTMLElement("span", {}, "");
    fallbackElement.textContent = "[mention]";
    return fallbackElement;
  }
}
