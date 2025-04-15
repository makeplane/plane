import { HocuspocusProvider } from "@hocuspocus/provider";
import { Extensions } from "@tiptap/core";
import Placeholder from "@tiptap/extension-placeholder";
import { useEditor } from "@tiptap/react";

import { MutableRefObject } from "react";
import { TitleExtensions } from "@/extensions/title-extension";
import { EditorTitleRefApi } from "@/types/editor";

export interface TitleEditorProps {
  editable?: boolean;
  provider: HocuspocusProvider;
  forwardedRef?: MutableRefObject<EditorTitleRefApi | null>;
  extensions?: Extensions;
  initialValue?: string;
  field?: string;
  placeholder?: string;
  updatePageProperties?: (pageId: string, messageType: string, payload?: any, performAction?: boolean) => void;
  id: string;
}

/**
 * A hook that creates a title editor with collaboration features
 * Uses the same Y.Doc as the main editor but a different field
 */
export const useTitleEditor = (props: TitleEditorProps) => {
  const { editable = true, id, initialValue = "", extensions, updatePageProperties } = props;

  const editor = useEditor(
    {
      onUpdate: () => {
        if (updatePageProperties) {
          updatePageProperties(id, "title_updated", { title: editor?.getText() });
        }
      },
      editable,
      extensions: [
        ...TitleExtensions,
        ...(extensions ?? []),
        Placeholder.configure({
          placeholder: () => "Untitled",
          includeChildren: true,
          showOnlyWhenEditable: false,
        }),
      ],
      content: typeof initialValue === "string" && initialValue.trim() !== "" ? initialValue : "<h1></h1>",
    },
    [editable, initialValue]
  );

  return editor;
};
