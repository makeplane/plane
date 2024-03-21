import { IMarking } from "src/helpers/scroll-to-node";
import { EditorMenuItemNames } from "src/ui/menus/menu-items";

export interface EditorRefApi {
  clearEditor: () => void;
  setEditorValue: (content: string) => void;
  setEditorValueAtCursorPosition: (content: string) => void;
  executeMenuItemCommand: (itemName: EditorMenuItemNames) => void;
  isMenuItemActive: (itemName: EditorMenuItemNames) => boolean;
  getMarkDown: () => string;
  scrollSummary: (marking: IMarking) => void;
  onStateChange: (callback: () => void) => () => void;
}

export type EditorReadOnlyRefApi = Pick<
  EditorRefApi,
  "getMarkDown" | "clearEditor" | "setEditorValue" | "scrollSummary"
>;
