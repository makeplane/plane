import { HTMLElement } from "node-html-parser";
import { IParserExtension } from "@plane/etl/parser";
import { logger } from "@/logger";

export type ExtractBodyExtensionConfig = {
  selector: string;
  context: Map<string, any>;
}

export class ExtractBodyExtension implements IParserExtension {
  constructor(protected readonly config: ExtractBodyExtensionConfig) { }

  shouldParse(node: HTMLElement): boolean {
    // This extension should only run on the root html element
    if (node.tagName !== "HTML") {
      return false;
    }

    // Check if the expected structure exists
    const pageBodyElement = node.querySelector(this.config.selector);
    return pageBodyElement !== null;
  }

  async mutate(node: HTMLElement): Promise<HTMLElement> {
    try {
      // Find the div with class "page-body"
      const pageBodyElement = node.querySelector(this.config.selector);

      if (!pageBodyElement) {
        // If we can't find the target element, return the original node
        logger.warn(`ExtractBodyExtension: Could not find ${this.config.selector} element`);
        return node;
      }

      return pageBodyElement;
    } catch (error) {
      logger.error("ExtractBodyExtension: Error while extracting body", error);
      return node;
    }
  }
}
