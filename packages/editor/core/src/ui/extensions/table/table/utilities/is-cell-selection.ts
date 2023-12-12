import { CellSelection } from "@tiptap/prosemirror-tables";

export function isCellSelection(value: unknown): value is CellSelection {
  return value instanceof CellSelection;
}
