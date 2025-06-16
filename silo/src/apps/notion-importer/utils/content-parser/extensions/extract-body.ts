import { HTMLElement } from "node-html-parser";
import { IParserExtension } from "@plane/etl/parser";
import { logger } from "@/logger";

export class ExtractBodyExtension implements IParserExtension {
  shouldParse(node: HTMLElement): boolean {
    // This extension should only run on the root html element
    if (node.tagName !== "HTML") {
      return false;
    }

    // Check if the expected structure exists
    const pageBodyElement = node.querySelector("div.page-body");
    return pageBodyElement !== null;
  }

  async mutate(node: HTMLElement): Promise<HTMLElement> {
    try {
      // Find the div with class "page-body"
      const pageBodyElement = node.querySelector("div.page-body");

      if (!pageBodyElement) {
        // If we can't find the target element, return the original node
        logger.warn("ExtractBodyExtension: Could not find div.page-body element");
        return node;
      }
      // Return the extracted content for further processing

      return pageBodyElement;
    } catch (error) {
      logger.error("ExtractBodyExtension: Error while extracting body", error);
      return node;
    }
  }
}
