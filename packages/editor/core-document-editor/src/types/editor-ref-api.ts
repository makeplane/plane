import { EditorMenuItemNames } from "src/ui/menus/menu-items";

export interface EditorRefApi {
  clearEditor: () => void;
  setEditorValue: (content: string) => void;
  setEditorValueAtCursorPosition: (content: string) => void;
  executeCommand: (itemName: EditorMenuItemNames) => void;
  isItemActive: (itemName: EditorMenuItemNames) => boolean;
}
