import { HocuspocusProvider } from "@hocuspocus/provider";
import { Extensions } from "@tiptap/core";
import Placeholder from "@tiptap/extension-placeholder";
import { DOMSerializer } from "@tiptap/pm/model";
import { useEditor } from "@tiptap/react";
import { useImperativeHandle } from "react";
// constants
import { CORE_EDITOR_META } from "@/constants/meta";
// extensions
import { SmoothCursorExtension } from "@/extensions";
import { TitleExtensions } from "@/extensions/title-extension";
// helpers
import { getEditorRefHelpers } from "@/helpers/editor-ref";
// types
import { EditorTitleRefApi } from "@/types/editor";

type Props = {
  editable?: boolean;
  provider: HocuspocusProvider;
  titleRef?: React.MutableRefObject<EditorTitleRefApi | null>;
  extensions?: Extensions;
  initialValue?: string;
  field?: string;
  placeholder?: string;
  updatePageProperties?: (pageId: string, messageType: string, payload?: any, performAction?: boolean) => void;
  id: string;
  isSmoothCursorEnabled: boolean;
};

/**
 * A hook that creates a title editor with collaboration features
 * Uses the same Y.Doc as the main editor but a different field
 */
export const useTitleEditor = (props: Props) => {
  const {
    editable = true,
    id,
    initialValue = "",
    isSmoothCursorEnabled = false,
    extensions,
    provider,
    updatePageProperties,
    titleRef,
  } = props;

  const editor = useEditor(
    {
      onUpdate: () => {
        if (updatePageProperties) {
          updatePageProperties(id, "title_updated", { title: editor?.getText() });
        }
      },
      editable,
      immediatelyRender: false,
      shouldRerenderOnTransaction: false,
      extensions: [
        ...TitleExtensions,
        ...(extensions ?? []),
        ...(isSmoothCursorEnabled ? [SmoothCursorExtension] : []),
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

  useImperativeHandle(titleRef, () => ({
    ...getEditorRefHelpers({
      editor,
      provider,
    }),
    clearEditor: (emitUpdate = false) => {
      editor
        ?.chain()
        .setMeta(CORE_EDITOR_META.SKIP_FILE_DELETION, true)
        .setMeta("intentionalDeletion", true)
        .clearContent(emitUpdate)
        .run();
    },
    setEditorValue: (content: string) => {
      editor?.commands.setContent(content);
    },
  }));

  return editor;
};
