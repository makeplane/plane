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
}

/**
 * A hook that creates a title editor with collaboration features
 * Uses the same Y.Doc as the main editor but a different field
 */
export const useTitleEditor = (props: TitleEditorProps) => {
  const { editable = true, initialValue = "", extensions } = props;

  const editor = useEditor(
    {
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
