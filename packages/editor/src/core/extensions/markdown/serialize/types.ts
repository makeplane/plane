import { Node as ProseMirrorNode } from "@tiptap/pm/model";
import { Mark } from "@tiptap/core";
import { MarkdownSerializerState } from "./state";

export interface SerializerMark {
  open: string | ((state: MarkdownSerializerState, mark: Mark, parent: ProseMirrorNode, index: number) => string);
  close: string | ((state: MarkdownSerializerState, mark: Mark, parent: ProseMirrorNode, index: number) => string);
  mixable?: boolean;
  expelEnclosingWhitespace?: boolean;
  escape?: boolean;
}

export interface SerializerNode {
  (state: MarkdownSerializerState, node: ProseMirrorNode, parent: ProseMirrorNode, index: number): void;
}

export interface InlinePosition {
  start: number;
  end: number;
  delimiter?: string;
}
