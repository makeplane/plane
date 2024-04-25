import { EnterKeyExtension } from "src/extensions/enter-key-extension";

export const LiteTextEditorExtensions = (onEnterKeyPress?: () => void) => [EnterKeyExtension(onEnterKeyPress)];
