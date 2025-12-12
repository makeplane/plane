import type { HocuspocusProvider } from "@hocuspocus/provider";
import type { Extensions } from "@tiptap/core";
import { Placeholder } from "@tiptap/extension-placeholder";
import { useEditor } from "@tiptap/react";
import { useImperativeHandle } from "react";
// constants
import { CORE_EDITOR_META } from "@/constants/meta";
// extensions
import { TitleExtensions } from "@/extensions/title-extension";
// helpers
import { getEditorRefHelpers } from "@/helpers/editor-ref";
// types
import type { IEditorPropsExtended, IEditorProps } from "@/types";
import type { EditorTitleRefApi, ICollaborativeDocumentEditorProps } from "@/types/editor";

type TUseTitleEditorProps = {
  editable?: boolean;
  provider: HocuspocusProvider;
  titleRef?: React.MutableRefObject<EditorTitleRefApi | null>;
  extensions?: Extensions;
  initialValue?: string;
  field?: string;
  placeholder?: string;
  updatePageProperties?: ICollaborativeDocumentEditorProps["updatePageProperties"];
  id: string;
  extendedEditorProps?: IEditorPropsExtended;
  getEditorMetaData?: IEditorProps["getEditorMetaData"];
};

/**
 * A hook that creates a title editor with collaboration features
 * Uses the same Y.Doc as the main editor but a different field
 */
export const useTitleEditor = (props: TUseTitleEditorProps) => {
  const {
    editable = true,
    id,
    initialValue = "",
    extensions,
    provider,
    updatePageProperties,
    titleRef,
    getEditorMetaData,
  } = props;

  // Force editor recreation when Y.Doc changes (provider.document.guid)
  const docKey = provider?.document?.guid ?? id;

  const editor = useEditor(
    {
      onUpdate: ({ editor }) => {
        updatePageProperties?.(id, "property_updated", { name: editor?.getText() });
      },
      editable,
      immediatelyRender: false,
      shouldRerenderOnTransaction: false,
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
    [editable, initialValue, docKey]
  );

  useImperativeHandle(titleRef, () => ({
    ...getEditorRefHelpers({
      editor,
      provider,
      getEditorMetaData: getEditorMetaData ?? (() => ({ file_assets: [], user_mentions: [] })),
    }),
    clearEditor: (emitUpdate = false) => {
      editor
        ?.chain()
        .setMeta(CORE_EDITOR_META.SKIP_FILE_DELETION, true)
        .setMeta(CORE_EDITOR_META.INTENTIONAL_DELETION, true)
        .clearContent(emitUpdate)
        .run();
    },
    setEditorValue: (content: string) => {
      editor?.commands.setContent(content, false);
    },
  }));

  return editor;
};
