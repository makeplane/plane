import { CustomListItem } from "./custom-list-extension";
import { EnterKeyExtension } from "./enter-key-extension";

export const LiteTextEditorExtensions = (onEnterKeyPress?: () => void) => [
  CustomListItem,
  EnterKeyExtension(onEnterKeyPress),
];
