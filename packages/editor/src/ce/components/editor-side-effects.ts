import { type Editor } from "@tiptap/core";
import type { IEditorPropsExtended } from "@/types";

export const EditorSideEffects = (props: {
  editor: Editor;
  id: string;
  updatePageProperties?: any;
  extendedEditorProps?: IEditorPropsExtended;
}) => null;
