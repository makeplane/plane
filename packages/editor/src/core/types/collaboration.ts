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

type TCollaborativeEditorHookProps = {
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
  realtimeConfig: TRealtimeConfig;
  serverHandler?: TServerHandler;
  user: TUserDetails;
};

export type TCollaborativeEditorProps = TCollaborativeEditorHookProps & {
  onTransaction?: () => void;
  embedHandler?: TEmbedConfig;
  fileHandler: TFileHandler;
  forwardedRef?: React.MutableRefObject<EditorRefApi | null>;
  placeholder?: string | ((isFocused: boolean, value: string) => string);
  tabIndex?: number;
};

export type TReadOnlyCollaborativeEditorProps = TCollaborativeEditorHookProps & {
  fileHandler: Pick<TFileHandler, "getAssetSrc">;
  forwardedRef?: React.MutableRefObject<EditorReadOnlyRefApi | null>;
};
