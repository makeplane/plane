import { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { Mark } from "@tiptap/core";
import { MarkdownSerializerState as BaseMarkdownSerializerState } from "@tiptap/pm/markdown";
import { trimInline } from "../util/markdown";
import { SerializerNode, SerializerMark, InlinePosition } from "./types";

interface SerializerStateOptions {
  hardBreakNodeName: string;
}

/**
 * Override default MarkdownSerializerState to:
 * - handle commonmark delimiters (https://spec.commonmark.org/0.29/#left-flanking-delimiter-run)
 */
export class MarkdownSerializerState extends BaseMarkdownSerializerState {
  nodes: Record<string, SerializerNode>;
  marks: Record<string, SerializerMark>;
  options: SerializerStateOptions;
  out: string = "";
  closed: boolean = false;
  inTable: boolean = false;
  inlines: InlinePosition[] = [];
  delim: string = "";
  atBlockStart: boolean = false;

  constructor(
    nodes: Record<string, SerializerNode>,
    marks: Record<string, SerializerMark>,
    options: SerializerStateOptions
  ) {
    super();
    this.nodes = nodes;
    this.marks = marks;
    this.options = options;
  }

  render(node: ProseMirrorNode, parent: ProseMirrorNode, index: number): void {
    super.render(node, parent, index);
    const top = this.inlines[this.inlines.length - 1];
    if (top?.start !== undefined && top?.end !== undefined) {
      const { delimiter, start, end } = this.normalizeInline(top);
      this.out = trimInline(this.out, delimiter || "", start, end);
    }
  }

  markString(mark: Mark, open: boolean, parent: ProseMirrorNode, index: number): string {
    const info = this.marks[mark.type.name];
    if (info.expelEnclosingWhitespace) {
      if (open) {
        this.inlines.push({
          start: this.out.length,
          end: 0,
        });
      } else {
        const inline = this.inlines.pop();
        if (inline) {
          inline.end = this.out.length;
          this.inlines.push(inline);
        }
      }
    }
    return super.markString(mark, open, parent, index);
  }

  normalizeInline(inline: InlinePosition): InlinePosition {
    let { start, end } = inline;
    while (this.out.charAt(start).match(/\s/)) {
      start++;
    }
    return {
      ...inline,
      start,
    };
  }
}
