import type { HocuspocusProvider } from "@hocuspocus/provider";
import type { Content } from "@tiptap/core";
import type { EditorProps } from "@tiptap/pm/view";
// local imports
import type { ICollaborativeDocumentEditorProps, IEditorProps } from "./editor";

type TCoreHookProps = Pick<
  IEditorProps,
  "disabledExtensions" | "editorClassName" | "extensions" | "flaggedExtensions" | "handleEditorReady"
> & {
  editorProps?: EditorProps;
};

export type TEditorHookProps = TCoreHookProps &
  Pick<
    IEditorProps,
    | "autofocus"
    | "fileHandler"
    | "forwardedRef"
    | "id"
    | "mentionHandler"
    | "onAssetChange"
    | "onChange"
    | "onTransaction"
    | "placeholder"
    | "tabIndex"
    | "value"
    | "embedHandler"
  > & {
    editable: boolean;
    enableHistory: boolean;
    initialValue?: Content;
    provider?: HocuspocusProvider;
  };

export type TCollaborativeEditorHookProps = TCoreHookProps &
  Pick<
    TEditorHookProps,
    | "editable"
    | "fileHandler"
    | "forwardedRef"
    | "id"
    | "mentionHandler"
    | "onAssetChange"
    | "onChange"
    | "onTransaction"
    | "placeholder"
    | "tabIndex"
  > &
  Pick<ICollaborativeDocumentEditorProps, "embedHandler" | "realtimeConfig" | "serverHandler" | "user">;
