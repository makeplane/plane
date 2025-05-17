import { Editor } from "@tiptap/core";
// plane editor types
import { ExtensionStorageMap } from "@/plane-editor/types/storage";

export const getExtensionStorage = <K extends keyof ExtensionStorageMap>(
  editor: Editor,
  extensionName: K
): ExtensionStorageMap[K] => editor.storage[extensionName];
