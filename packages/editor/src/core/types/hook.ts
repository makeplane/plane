import type { HocuspocusProvider } from "@hocuspocus/provider";
import type { Content } from "@tiptap/core";
// local imports
import type { EditorTitleRefApi, ICollaborativeDocumentEditorProps, IEditorProps } from "./editor";

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
  | "isSmoothCursorEnabled"
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
  > & {
    titleRef?: React.MutableRefObject<EditorTitleRefApi | null>;
    updatePageProperties?: (pageId: string, messageType: string, payload?: any, performAction?: boolean) => void;
  };
