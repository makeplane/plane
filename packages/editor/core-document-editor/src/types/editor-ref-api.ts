import { EditorMenuItemNames } from "src/ui/menus/menu-items";

export interface EditorRefApi {
  clearEditor: () => void;
  setEditorValue: (content: string) => void;
  setEditorValueAtCursorPosition: (content: string) => void;
  executeMenuItemCommand: (itemName: EditorMenuItemNames) => void;
  isMenuItemActive: (itemName: EditorMenuItemNames) => boolean;
  getMarkDown: () => string;
}

export type EditorReadOnlyRefApi = Pick<EditorRefApi, "getMarkDown" | "clearEditor" | "setEditorValue">;
