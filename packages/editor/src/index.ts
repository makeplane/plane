// styles
// import "./styles/tailwind.css";
import "./styles/variables.css";
import "./styles/editor.css";
import "./styles/table.css";
import "./styles/github-dark.css";
import "./styles/drag-drop.css";

// editors
export {
  CollaborativeDocumentEditorWithRef,
  CollaborativeDocumentReadOnlyEditorWithRef,
  DocumentReadOnlyEditorWithRef,
  LiteTextEditorWithRef,
  LiteTextReadOnlyEditorWithRef,
  RichTextEditorWithRef,
  RichTextReadOnlyEditorWithRef,
} from "@/components/editors";

export { isCellSelection } from "@/extensions/table/table/utilities/is-cell-selection";

// constants
export * from "@/constants/common";

// helpers
export * from "@/helpers/common";
export * from "@/helpers/editor-commands";
export * from "@/helpers/yjs";
export * from "@/extensions/table/table";

// components
export * from "@/components/menus";

// hooks
export { useEditor } from "@/hooks/use-editor";
export { type IMarking, useEditorMarkings } from "@/hooks/use-editor-markings";
export { useReadOnlyEditor } from "@/hooks/use-read-only-editor";

// types
export type { CustomEditorProps } from "@/hooks/use-editor";
export * from "@/types";
