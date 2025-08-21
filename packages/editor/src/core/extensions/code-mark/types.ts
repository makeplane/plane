import type { MarkType } from "@tiptap/pm/model";

export type Options = {
  markType?: MarkType;
};

export type CodemarkState = {
  active?: boolean;
  side?: -1 | 0;
  next?: true; // Move outside of code after next transaction
  click?: true; // When the editor is clicked on
} | null;

export type CursorMetaTr = { action: "next" } | { action: "click" };
