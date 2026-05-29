import type { HocuspocusProvider } from "@hocuspocus/provider";
import type { Content } from "@tiptap/core";
// local imports
import type { ICollaborativeDocumentEditorProps, IEditorProps } from "./editor";

type TCoreHookProps = Pick<
  IEditorProps,
  | "disabledExtensions"
  | "editorClassName"
  | "editorProps"
  | "extendedEditorProps"
  | "extensions"
  | "flaggedExtensions"
  | "getEditorMetaData"
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
    | "showPlaceholderOnEmpty"
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
    | "showPlaceholderOnEmpty"
    | "tabIndex"
  > &
  Pick<
    ICollaborativeDocumentEditorProps,
    "dragDropEnabled" | "extendedDocumentEditorProps" | "realtimeConfig" | "serverHandler" | "user"
  > & {
    titleRef?: ICollaborativeDocumentEditorProps["titleRef"];
    updatePageProperties?: ICollaborativeDocumentEditorProps["updatePageProperties"];
  };
