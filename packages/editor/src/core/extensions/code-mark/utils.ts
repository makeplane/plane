import type { MarkType, Node } from "@tiptap/pm/model";
import { type EditorState, PluginKey } from "@tiptap/pm/state";
import type { EditorView } from "@tiptap/pm/view";
import type { Options } from "./types";

export const MAX_MATCH = 100;
export const codeMarkPluginKey = new PluginKey("codemark");

export function getMarkType(view: EditorView | EditorState, opts?: Options): MarkType {
  if ("schema" in view) return opts?.markType ?? view.schema.marks.code;
  return opts?.markType ?? view.state.schema.marks.code;
}

export function safeResolve(doc: Node, pos: number) {
  return doc.resolve(Math.min(Math.max(1, pos), doc.nodeSize - 2));
}
