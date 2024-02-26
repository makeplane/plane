import { EnterKeyExtension } from "src/ui/extensions/enter-key-extension";

export const LiteTextEditorExtensions = (onEnterKeyPress?: () => void) => [EnterKeyExtension(onEnterKeyPress)];
