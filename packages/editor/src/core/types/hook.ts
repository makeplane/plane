import type { HocuspocusProvider } from "@hocuspocus/provider";
import type { EditorProps } from "@tiptap/pm/view";
// local imports
import type {
  EditorTitleRefApi,
  ICollaborativeDocumentEditorProps,
  IEditorProps,
  IReadOnlyEditorProps,
} from "./editor";

type TCoreHookProps = Pick<
  IEditorProps,
  | "disabledExtensions"
  | "editorClassName"
  | "extensions"
  | "flaggedExtensions"
  | "handleEditorReady"
  | "isSmoothCursorEnabled"
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
    | "onChange"
    | "onTransaction"
    | "placeholder"
    | "tabIndex"
  > &
  Pick<ICollaborativeDocumentEditorProps, "embedHandler" | "realtimeConfig" | "serverHandler" | "user"> & {
    titleRef?: React.MutableRefObject<EditorTitleRefApi | null>;
    updatePageProperties?: (pageId: string, messageType: string, payload?: any, performAction?: boolean) => void;
  };

export type TReadOnlyEditorHookProps = Omit<TCoreHookProps, "isSmoothCursorEnabled"> &
  Pick<TEditorHookProps, "initialValue" | "provider"> &
  Pick<IReadOnlyEditorProps, "fileHandler" | "forwardedRef" | "mentionHandler">;
