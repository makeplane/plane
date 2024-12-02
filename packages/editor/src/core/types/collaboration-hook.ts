import { Extensions } from "@tiptap/core";
import { EditorProps } from "@tiptap/pm/view";
// plane editor types
import { TEmbedConfig } from "@/plane-editor/types";
// types
import {
  EditorReadOnlyRefApi,
  EditorRefApi,
  IMentionHighlight,
  IMentionSuggestion,
  TExtensions,
  TFileHandler,
  TRealtimeConfig,
  TUserDetails,
} from "@/types";

export type TServerHandler = {
  onConnect?: () => void;
  onServerError?: () => void;
};

type TCollaborativeEditorHookCommonProps = {
  disabledExtensions: TExtensions[];
  editorClassName: string;
  editorProps?: EditorProps;
  extensions?: Extensions;
  handleEditorReady?: (value: boolean) => void;
  id: string;
  mentionHandler: {
    highlights: () => Promise<IMentionHighlight[]>;
    suggestions?: () => Promise<IMentionSuggestion[]>;
  };
};

type TCollaborativeEditorHookProps = TCollaborativeEditorHookCommonProps & {
  onTransaction?: () => void;
  embedHandler?: TEmbedConfig;
  fileHandler: TFileHandler;
  forwardedRef?: React.MutableRefObject<EditorRefApi | null>;
  placeholder?: string | ((isFocused: boolean, value: string) => string);
  tabIndex?: number;
};

type TCollaborativeReadOnlyEditorHookProps = TCollaborativeEditorHookCommonProps & {
  fileHandler: Pick<TFileHandler, "getAssetSrc">;
  forwardedRef?: React.MutableRefObject<EditorReadOnlyRefApi | null>;
};

export type TCollaborativeRichTextEditorHookProps = TCollaborativeEditorHookProps & {
  onChange: (updatedDescription: Uint8Array) => void;
  value: Uint8Array;
};

export type TCollaborativeRichTextReadOnlyEditorHookProps = TCollaborativeReadOnlyEditorHookProps & {
  value: Uint8Array;
};

export type TCollaborativeDocumentEditorHookProps = TCollaborativeEditorHookProps & {
  embedHandler?: TEmbedConfig;
  realtimeConfig: TRealtimeConfig;
  serverHandler?: TServerHandler;
  user: TUserDetails;
};

export type TCollaborativeDocumentReadOnlyEditorHookProps = TCollaborativeReadOnlyEditorHookProps & {
  realtimeConfig: TRealtimeConfig;
  serverHandler?: TServerHandler;
  user: TUserDetails;
};
