export { DocumentEditor, DocumentEditorWithRef } from "src/ui";
export { DocumentReadOnlyEditor, DocumentReadOnlyEditorWithRef } from "src/ui/readonly";

// hooks
export { useEditorMarkings } from "src/hooks/use-editor-markings";
// utils
export { proseMirrorJSONToBinaryString, applyUpdates, mergeUpdates } from "src/utils/yjs";

export type { EditorRefApi, EditorReadOnlyRefApi, EditorMenuItem, EditorMenuItemNames } from "@plane/editor-core";

export type { IMarking } from "src/types/editor-types";
