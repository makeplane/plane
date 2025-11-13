import type { Editor } from "@tiptap/core";
import type { ReactElement } from "react";
import type { IEditorPropsExtended } from "@/types";

export type DocumentEditorSideEffectsProps = {
  editor: Editor;
  id: string;
  updatePageProperties?: unknown;
  extendedEditorProps?: IEditorPropsExtended;
};

export const DocumentEditorSideEffects = (_props: DocumentEditorSideEffectsProps): ReactElement | null => null;
