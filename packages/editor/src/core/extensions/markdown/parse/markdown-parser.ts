import { Editor, JSONContent } from "@tiptap/core";
import { NodeType } from "@tiptap/pm/model";
import markdownit from "markdown-it";
import { elementFromString, extractElement, unwrapElement } from "../util/dom";
import { getMarkdownSpec } from "../util/extensions";

interface MarkdownParserOptions {
  html: boolean;
  linkify: boolean;
  breaks: boolean;
}

interface MarkdownRendererRule {
  (...args: unknown[]): string;
}

export class MarkdownParser {
  /**
   * @type {import('@tiptap/core').Editor}
   */
  editor: Editor;
  /**
   * @type {markdownit}
   */
  md: markdownit;

  constructor(editor: Editor, { html, linkify, breaks }: MarkdownParserOptions) {
    this.editor = editor;
    this.md = this.withPatchedRenderer(
      markdownit({
        html,
        linkify,
        breaks,
      })
    );
  }

  parse(content: string | JSONContent, { inline }: { inline?: boolean } = {}): string | JSONContent {
    if (typeof content === "string") {
      console.log("aaya", content);
      this.editor.extensionManager.extensions.forEach((extension) => {
        const markdownSpec = getMarkdownSpec(extension);
        console.log("markdownSpec", markdownSpec);
        return getMarkdownSpec(extension)?.parse?.setup?.call(
          { editor: this.editor, options: extension.options },
          this.md
        );
      });

      const renderedHTML = this.md.render(content);
      const element = elementFromString(renderedHTML);

      this.editor.extensionManager.extensions.forEach((extension) =>
        getMarkdownSpec(extension)?.parse?.updateDOM?.call({ editor: this.editor, options: extension.options }, element)
      );

      this.normalizeDOM(element, { inline, content });

      return element.innerHTML;
    }

    return content;
  }

  normalizeDOM(node: HTMLElement, { inline, content }: { inline?: boolean; content: string }): HTMLElement {
    this.normalizeBlocks(node);

    // remove all \n appended by markdown-it
    node.querySelectorAll("*").forEach((el) => {
      if (el.nextSibling?.nodeType === Node.TEXT_NODE && !el.closest("pre")) {
        el.nextSibling.textContent = el.nextSibling.textContent!.replace(/^\n/, "");
      }
    });

    if (inline) {
      this.normalizeInline(node, content);
    }

    return node;
  }

  normalizeBlocks(node: HTMLElement): void {
    const blocks = Object.values(this.editor.schema.nodes).filter((node): node is NodeType => "isBlock" in node);

    const selector = blocks
      .map((block) => block.spec.parseDOM?.map((spec) => spec.tag))
      .flat()
      .filter(Boolean)
      .join(",");

    if (!selector) {
      return;
    }

    Array.from(node.querySelectorAll(selector)).forEach((el) => {
      if (el.parentElement?.matches("p")) {
        extractElement(el);
      }
    });
  }

  normalizeInline(node: HTMLElement, content: string): void {
    if (node.firstElementChild?.matches("p")) {
      const firstParagraph = node.firstElementChild;
      const { nextElementSibling } = firstParagraph;
      const startSpaces = content.match(/^\s+/)?.[0] ?? "";
      const endSpaces = !nextElementSibling ? (content.match(/\s+$/)?.[0] ?? "") : "";

      if (content.match(/^\n\n/)) {
        firstParagraph.innerHTML = `${firstParagraph.innerHTML}${endSpaces}`;
        return;
      }

      unwrapElement(firstParagraph);

      node.innerHTML = `${startSpaces}${node.innerHTML}${endSpaces}`;
    }
  }

  /**
   * @param {markdownit} md
   */
  withPatchedRenderer(md: markdownit): markdownit {
    const withoutNewLine =
      (renderer: MarkdownRendererRule) =>
      (...args: unknown[]): string => {
        const rendered = renderer(...args);
        if (rendered === "\n") {
          return rendered; // keep soft breaks
        }
        if (rendered[rendered.length - 1] === "\n") {
          return rendered.slice(0, -1);
        }
        return rendered;
      };

    md.renderer.rules.hardbreak = withoutNewLine(md.renderer.rules.hardbreak);
    md.renderer.rules.softbreak = withoutNewLine(md.renderer.rules.softbreak);
    md.renderer.rules.fence = withoutNewLine(md.renderer.rules.fence);
    md.renderer.rules.code_block = withoutNewLine(md.renderer.rules.code_block);
    md.renderer.renderToken = withoutNewLine(md.renderer.renderToken.bind(md.renderer));

    return md;
  }
}
