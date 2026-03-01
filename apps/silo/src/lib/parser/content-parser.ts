/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { marked } from "marked";
import { parse, HTMLElement } from "node-html-parser";
import TurndownService from "turndown";

import { logger } from "@plane/logger";

import type { IParserExtension } from "./types";

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

  private readonly turndownService = new TurndownService({
    headingStyle: "atx",
    codeBlockStyle: "fenced",
  });

  /**
   * Converts HTML to Markdown
   * @param html - The HTML to convert
   * @param srcPrefixWithPath - The prefix to add to the image src
   * @returns The Markdown
   */
  toMarkdown(html: string, srcPrefixWithPath: string): string {
    // First convert image components to standard HTML img tags
    const standardHtml = this.replaceImageComponentsWithImgTags(html, srcPrefixWithPath);
    // Use TurndownService to convert HTML to Markdown
    return this.turndownService.turndown(standardHtml);
  }

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
        try {
          currentNode = await extension.mutate(currentNode);
        } catch (error) {
          logger.error("Unable to process extension", error);
        }
      }
    }

    return currentNode;
  }

  /**
   * Replaces image-component tags with img tags
   * @param html - The HTML to process
   * @param srcPrefix - The prefix to add to the image src
   * @returns The processed HTML
   */
  private replaceImageComponentsWithImgTags(html: string, srcPrefix: string): string {
    const root = parse(html);
    const imageComponents = root.querySelectorAll("image-component");

    imageComponents.forEach((component) => {
      // Extract all attributes
      const src = component.getAttribute("src");
      if (!src) return;

      const width = component.getAttribute("width");
      const height = component.getAttribute("height");
      const aspectRatio = component.getAttribute("aspectratio");

      // Create img tag with appropriate attributes
      const img = new HTMLElement("img", {}, "");
      img.setAttribute("src", `${srcPrefix}/${src}`);
      if (width) img.setAttribute("width", width);
      if (height) img.setAttribute("height", height);
      if (aspectRatio) img.setAttribute("data-aspect-ratio", aspectRatio);

      // Replace the image-component with the img tag
      component.replaceWith(img);
    });

    return root.toString();
  }
}
