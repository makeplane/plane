// helpers
import { IMarking } from "@/helpers/scroll-to-node";
// hooks
import { TFileHandler } from "@/hooks/use-editor";
// types
import { IMentionHighlight, IMentionSuggestion, TEditorCommands, TEmbedConfig, TServerHandler } from "@/types";

// editor refs
export type EditorReadOnlyRefApi = {
  getMarkDown: () => string;
  getHTML: () => string;
  clearEditor: () => void;
  setEditorValue: (content: string) => void;
  scrollSummary: (marking: IMarking) => void;
};

export interface EditorRefApi extends EditorReadOnlyRefApi {
  setEditorValueAtCursorPosition: (content: string) => void;
  executeMenuItemCommand: (itemKey: TEditorCommands) => void;
  isMenuItemActive: (itemKey: TEditorCommands) => boolean;
  onStateChange: (callback: () => void) => () => void;
  setFocusAtPosition: (position: number) => void;
  isEditorReadyToDiscard: () => boolean;
}

// editor props
export interface IEditorProps {
  containerClassName?: string;
  editorClassName?: string;
  fileHandler: TFileHandler;
  forwardedRef?: React.MutableRefObject<EditorRefApi | null>;
  id: string;
  initialValue: string;
  mentionHandler: {
    highlights: () => Promise<IMentionHighlight[]>;
    suggestions?: () => Promise<IMentionSuggestion[]>;
  };
  onChange?: (json: object, html: string) => void;
  onEnterKeyPress?: (descriptionHTML: string) => void;
  placeholder?: string | ((isFocused: boolean, value: string) => string);
  tabIndex?: number;
  value?: string | null;
}

export interface ILiteTextEditor extends IEditorProps {}

export interface IRichTextEditor extends IEditorProps {
  dragDropEnabled?: boolean;
}

export interface ICollaborativeDocumentEditor
  extends Omit<IEditorProps, "initialValue" | "onChange" | "onEnterKeyPress" | "value"> {
  embedHandler: TEmbedConfig;
  handleEditorReady?: (value: boolean) => void;
  id: string;
  realtimeConfig: TRealtimeConfig;
  serverHandler?: TServerHandler;
  user: TUserDetails;
}

// read only editor props
export interface IReadOnlyEditorProps {
  containerClassName?: string;
  editorClassName?: string;
  forwardedRef?: React.MutableRefObject<EditorReadOnlyRefApi | null>;
  id: string;
  initialValue: string;
  mentionHandler: {
    highlights: () => Promise<IMentionHighlight[]>;
  };
}

export interface ILiteTextReadOnlyEditor extends IReadOnlyEditorProps {}

export interface IRichTextReadOnlyEditor extends IReadOnlyEditorProps {}

export interface ICollaborativeDocumentReadOnlyEditor extends Omit<IReadOnlyEditorProps, "initialValue"> {
  embedHandler: TEmbedConfig;
  handleEditorReady?: (value: boolean) => void;
  id: string;
  realtimeConfig: TRealtimeConfig;
  serverHandler?: TServerHandler;
  user: TUserDetails;
}

export interface IDocumentReadOnlyEditor extends IReadOnlyEditorProps {
  embedHandler: TEmbedConfig;
  handleEditorReady?: (value: boolean) => void;
}

export type TUserDetails = {
  color: string;
  id: string;
  name: string;
};

export type TRealtimeConfig = {
  url: string;
  queryParams: {
    [key: string]: string;
  };
};
