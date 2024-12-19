import { Extensions } from "@tiptap/core";
import { EditorProps } from "@tiptap/pm/view";
// plane editor types
import { TEmbedConfig } from "@/plane-editor/types";
// types
import {
  EditorReadOnlyRefApi,
  EditorRefApi,
  TExtensions,
  TFileHandler,
  TMentionHandler,
  TReadOnlyMentionHandler,
  TRealtimeConfig,
  TUserDetails,
} from "@/types";

export type TServerHandler = {
  onConnect?: () => void;
  onServerError?: () => void;
};

type TCollaborativeEditorHookProps = {
  disabledExtensions: TExtensions[];
  editable?: boolean;
  editorClassName: string;
  editorProps?: EditorProps;
  extensions?: Extensions;
  handleEditorReady?: (value: boolean) => void;
  id: string;
  realtimeConfig: TRealtimeConfig;
  serverHandler?: TServerHandler;
  user: TUserDetails;
};

export type TCollaborativeEditorProps = TCollaborativeEditorHookProps & {
  onTransaction?: () => void;
  embedHandler?: TEmbedConfig;
  fileHandler: TFileHandler;
  forwardedRef?: React.MutableRefObject<EditorRefApi | null>;
  mentionHandler: TMentionHandler;
  placeholder?: string | ((isFocused: boolean, value: string) => string);
  tabIndex?: number;
};

export type TReadOnlyCollaborativeEditorProps = TCollaborativeEditorHookProps & {
  fileHandler: Pick<TFileHandler, "getAssetSrc">;
  forwardedRef?: React.MutableRefObject<EditorReadOnlyRefApi | null>;
  mentionHandler: TReadOnlyMentionHandler;
};
