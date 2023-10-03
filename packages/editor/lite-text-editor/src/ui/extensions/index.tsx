import { EnterKeyExtension } from "./enter-key-extension";

export const LiteTextEditorExtensions = (onEnterKeyPress?: () => void) => [
  EnterKeyExtension(onEnterKeyPress),
];
