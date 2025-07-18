import type { HocuspocusProvider } from "@hocuspocus/provider";
import type { EditorProps } from "@tiptap/pm/view";
// local imports
import type { ICollaborativeDocumentEditorProps, IEditorProps, IReadOnlyEditorProps } from "./editor";

type TCoreHookProps = Pick<
  IEditorProps,
  "disabledExtensions" | "editorClassName" | "extensions" | "flaggedExtensions" | "handleEditorReady" | "isTouchDevice"
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
  > & {
    editable: boolean;
    enableHistory: boolean;
    initialValue?: string;
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

export type TReadOnlyEditorHookProps = TCoreHookProps &
  Pick<TEditorHookProps, "initialValue" | "provider"> &
  Pick<IReadOnlyEditorProps, "fileHandler" | "forwardedRef" | "mentionHandler">;
