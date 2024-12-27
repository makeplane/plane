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

type TCollaborativeEditorHookCommonProps = {
  disabledExtensions: TExtensions[];
  editable?: boolean;
  editorClassName: string;
  editorProps?: EditorProps;
  extensions?: Extensions;
  handleEditorReady?: (value: boolean) => void;
  id: string;
};

type TCollaborativeEditorHookProps = TCollaborativeEditorHookCommonProps & {
  embedHandler?: TEmbedConfig;
  fileHandler: TFileHandler;
  forwardedRef?: React.MutableRefObject<EditorRefApi | null>;
  mentionHandler: TMentionHandler;
  placeholder?: string | ((isFocused: boolean, value: string) => string);
  tabIndex?: number;
};

type TCollaborativeReadOnlyEditorHookProps = TCollaborativeEditorHookCommonProps & {
  fileHandler: Pick<TFileHandler, "getAssetSrc">;
  forwardedRef?: React.MutableRefObject<EditorReadOnlyRefApi | null>;
  mentionHandler: TReadOnlyMentionHandler;
};

export type TCollaborativeDocumentEditorHookProps = TCollaborativeEditorHookProps & {
  onTransaction?: () => void;
  embedHandler?: TEmbedConfig;
  realtimeConfig: TRealtimeConfig;
  serverHandler?: TServerHandler;
  user: TUserDetails;
};

export type TCollaborativeRichTextEditorHookProps = TCollaborativeEditorHookProps & {
  onChange: (updatedDescription: Uint8Array) => void;
  value: Uint8Array;
};

export type TCollaborativeRichTextReadOnlyEditorHookProps = TCollaborativeReadOnlyEditorHookProps & {
  value: Uint8Array;
};
