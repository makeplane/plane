import type { HocuspocusProvider } from "@hocuspocus/provider";
import type { Content } from "@tiptap/core";
// local imports
import type { ICollaborativeDocumentEditorProps, IEditorProps } from "./editor";

type TCoreHookProps = Pick<
  IEditorProps,
  | "disabledExtensions"
  | "editorClassName"
  | "editorProps"
  | "extensions"
  | "flaggedExtensions"
  | "handleEditorReady"
  | "isTouchDevice"
  | "onEditorFocus"
>;

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
  Pick<
    ICollaborativeDocumentEditorProps,
    "dragDropEnabled" | "embedHandler" | "realtimeConfig" | "serverHandler" | "user"
  >;
