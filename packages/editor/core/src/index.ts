// styles
// import "./styles/tailwind.css";
import "src/styles/editor.css";
import "src/styles/table.css";
import "src/styles/github-dark.css";

export { isCellSelection } from "src/ui/extensions/table/table/utilities/is-cell-selection";

// utils
export * from "src/lib/utils";
export * from "src/ui/extensions/table/table";
export { startImageUpload } from "src/ui/plugins/upload-image";

// components
export { EditorContainer } from "src/ui/components/editor-container";
export { EditorContentWrapper } from "src/ui/components/editor-content";

// hooks
export { useEditor } from "src/hooks/use-editor";
export { useReadOnlyEditor } from "src/hooks/use-read-only-editor";

// helper items
export * from "src/ui/menus/menu-items";
export * from "src/lib/editor-commands";

// types
export type { DeleteImage } from "src/types/delete-image";
export type { UploadImage } from "src/types/upload-image";
export type { RestoreImage } from "src/types/restore-image";
export type { IMentionHighlight, IMentionSuggestion } from "src/types/mention-suggestion";
export type { ISlashCommandItem, CommandProps } from "src/types/slash-commands-suggestion";
export type { LucideIconType } from "src/types/lucide-icon";
