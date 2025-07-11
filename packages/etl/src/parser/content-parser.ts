import { marked } from "marked";
import { parse, HTMLElement } from "node-html-parser";
import TurndownService from "turndown";
import { IParserExtension } from "./types";

export class ContentParser {
  private readonly MARKDOWN_IMAGE_PATTERN = /\!\[(.*?)\]\((.*?)\)/gim;

  /**
   * These extensions are run through the entire content before the main parsing process
   */
  private readonly preprocessExtensions: IParserExtension[] = [];

  /**
   * Extensions that run during the main parsing process, these extensions are applied to each node
   */
  private readonly extensions: IParserExtension[] = [];

  /**
   * Extensions that run after the main parsing process, these extensions are applied to each node
   */
  private readonly postprocessExtensions: IParserExtension[] = [];

  constructor(
    extensions: IParserExtension[],
    preprocessExtensions: IParserExtension[] = [],
    postprocessExtensions: IParserExtension[] = []
  ) {
    this.preprocessExtensions = preprocessExtensions;
    this.extensions = extensions;
    this.postprocessExtensions = postprocessExtensions;
  }

  private static readonly turndownService = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
  });

  /**
   * Converts GitHub's content (HTML/Markdown/Mixed) to Plane's HTML format
   */
  async toPlaneHtml(content: string): Promise<string> {
    try {
      // First try to parse as HTML to check if it's valid HTML
      const root = parse(content);
      const isHTML = root.childNodes.some((node) => node.nodeType === 1); // Has HTML elements

      // If the content is not HTML or has markdown-style images, treat it as markdown
      const hasMarkdownImages = this.MARKDOWN_IMAGE_PATTERN.test(content);

      let html = content;
      if (!isHTML || hasMarkdownImages) {
        // Convert markdown to HTML
        html = await marked(content, {
          async: true,
          gfm: true, // GitHub Flavored Markdown
          breaks: true, // Convert line breaks to <br>
        });
      }

      // Process HTML content
      html = await this.processHTML(html);

      return html;
    } catch {
      // If HTML parsing fails, treat as markdown
      const html = await marked(content, {
        async: true,
        gfm: true,
        breaks: true,
      });
      return await this.processHTML(html);
    }
  }

  /**
   * Process HTML content by traversing all nodes and applying extensions
   */
  private async processHTML(html: string): Promise<string> {
    const root = parse(html);
    const preProcessedRoot = await this.traverseAndProcess(root, this.preprocessExtensions);
    const processedRoot = await this.traverseAndProcess(preProcessedRoot, this.extensions);
    const postProcessedRoot = await this.traverseAndProcess(processedRoot, this.postprocessExtensions);

    const postProcessedHtml = postProcessedRoot.toString();
    return postProcessedHtml.length > 0 ? postProcessedHtml : "<p></p>";
  }

  /**
   * Recursively traverses the DOM tree and applies extensions to each node
   * @param node The current node to process
   * @returns The processed node
   */
  private async traverseAndProcess(node: HTMLElement, extensions: IParserExtension[]): Promise<HTMLElement> {
    // First process all children recursively
    for (let i = 0; i < node.childNodes.length; i++) {
      const child = node.childNodes[i];
      if (child instanceof HTMLElement) {
        // Replace the child with the processed version
        const processedChild = await this.traverseAndProcess(child, extensions);
        node.childNodes[i] = processedChild;
      }
    }

    // After processing all children, apply extensions to the current node
    let currentNode = node;
    for (const extension of extensions) {
      if (extension.shouldParse(currentNode)) {
        currentNode = await extension.mutate(currentNode);
      }
    }

    return currentNode;
  }
}
