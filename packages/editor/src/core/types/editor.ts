import { Extensions, JSONContent } from "@tiptap/core";
import { Selection } from "@tiptap/pm/state";
// extension types
import type { TTextAlign } from "@/extensions";
// helpers
import type { IMarking } from "@/helpers/scroll-to-node";
// types
import type {
  TAIHandler,
  TDisplayConfig,
  TDocumentEventEmitter,
  TDocumentEventsServer,
  TEditorAsset,
  TEmbedConfig,
  TExtensions,
  TFileHandler,
  TMentionHandler,
  TReadOnlyFileHandler,
  TReadOnlyMentionHandler,
  TRealtimeConfig,
  TServerHandler,
  TUserDetails,
} from "@/types";

export type TEditorCommands =
  | "text"
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6"
  | "bold"
  | "italic"
  | "underline"
  | "strikethrough"
  | "bulleted-list"
  | "numbered-list"
  | "to-do-list"
  | "quote"
  | "code"
  | "table"
  | "image"
  | "divider"
  | "issue-embed"
  | "text-color"
  | "background-color"
  | "text-align"
  | "callout"
  | "attachment"
  | "emoji";

export type TCommandExtraProps = {
  image: {
    savedSelection: Selection | null;
  };
  attachment: {
    savedSelection: Selection | null;
  };
  "text-color": {
    color: string | undefined;
  };
  "background-color": {
    color: string | undefined;
  };
  "text-align": {
    alignment: TTextAlign;
  };
};

// Create a utility type that maps a command to its extra props or an empty object if none are defined
export type TCommandWithProps<T extends TEditorCommands> = T extends keyof TCommandExtraProps
  ? TCommandExtraProps[T] // If the command has extra props, include them
  : object; // Otherwise, just return the command type with no extra props

type TCommandWithPropsWithItemKey<T extends TEditorCommands> = T extends keyof TCommandExtraProps
  ? { itemKey: T } & TCommandExtraProps[T]
  : { itemKey: T };

export type TDocumentInfo = {
  characters: number;
  paragraphs: number;
  words: number;
};

// editor refs
export type EditorReadOnlyRefApi = {
  clearEditor: (emitUpdate?: boolean) => void;
  getDocument: () => {
    binary: Uint8Array | null;
    html: string;
    json: JSONContent | null;
  };
  getDocumentInfo: () => TDocumentInfo;
  getHeadings: () => IMarking[];
  getMarkDown: () => string;
  scrollSummary: (marking: IMarking) => void;
  setEditorValue: (content: string, emitUpdate?: boolean) => void;
};

export interface EditorRefApi extends EditorReadOnlyRefApi {
  blur: () => void;
  emitRealTimeUpdate: (action: TDocumentEventsServer) => void;
  executeMenuItemCommand: <T extends TEditorCommands>(props: TCommandWithPropsWithItemKey<T>) => void;
  getCurrentCursorPosition: () => number | undefined;
  getSelectedText: () => string | null;
  insertText: (contentHTML: string, insertOnNextLine?: boolean) => void;
  isEditorReadyToDiscard: () => boolean;
  isMenuItemActive: <T extends TEditorCommands>(props: TCommandWithPropsWithItemKey<T>) => boolean;
  listenToRealTimeUpdate: () => TDocumentEventEmitter | undefined;
  onDocumentInfoChange: (callback: (documentInfo: TDocumentInfo) => void) => () => void;
  onHeadingChange: (callback: (headings: IMarking[]) => void) => () => void;
  onStateChange: (callback: () => void) => () => void;
  // eslint-disable-next-line no-undef
  scrollToNodeViaDOMCoordinates: (behavior?: ScrollBehavior, position?: number) => void;
  setEditorValueAtCursorPosition: (content: string) => void;
  setFocusAtPosition: (position: number) => void;
  setProviderDocument: (value: Uint8Array) => void;
}

// editor props
export interface IEditorProps {
  autofocus?: boolean;
  bubbleMenuEnabled?: boolean;
  containerClassName?: string;
  displayConfig?: TDisplayConfig;
  disabledExtensions: TExtensions[];
  editorClassName?: string;
  extensions?: Extensions;
  flaggedExtensions: TExtensions[];
  fileHandler: TFileHandler;
  forwardedRef?: React.MutableRefObject<EditorRefApi | null>;
  handleEditorReady?: (value: boolean) => void;
  id: string;
  initialValue: string;
  isTouchDevice?: boolean;
  mentionHandler: TMentionHandler;
  onAssetChange?: (assets: TEditorAsset[]) => void;
  onChange?: (json: object, html: string) => void;
  onEnterKeyPress?: (e?: any) => void;
  onTransaction?: () => void;
  placeholder?: string | ((isFocused: boolean, value: string) => string);
  tabIndex?: number;
  value?: string | null;
}

export type ILiteTextEditorProps = IEditorProps;

export type IRichTextEditorProps = IEditorProps & {
  dragDropEnabled?: boolean;
  editable: boolean;
};

export interface ICollaborativeDocumentEditorProps
  extends Omit<IEditorProps, "extensions" | "initialValue" | "onEnterKeyPress" | "value"> {
  aiHandler?: TAIHandler;
  editable: boolean;
  embedHandler: TEmbedConfig;
  realtimeConfig: TRealtimeConfig;
  serverHandler?: TServerHandler;
  user: TUserDetails;
}

// read only editor props
export interface IReadOnlyEditorProps
  extends Pick<
    IEditorProps,
    | "containerClassName"
    | "disabledExtensions"
    | "flaggedExtensions"
    | "displayConfig"
    | "editorClassName"
    | "extensions"
    | "handleEditorReady"
    | "id"
    | "initialValue"
    | "isTouchDevice"
  > {
  fileHandler: TReadOnlyFileHandler;
  forwardedRef?: React.MutableRefObject<EditorReadOnlyRefApi | null>;
  mentionHandler: TReadOnlyMentionHandler;
}

export type ILiteTextReadOnlyEditorProps = IReadOnlyEditorProps;

export interface IDocumentReadOnlyEditorProps extends IReadOnlyEditorProps {
  embedHandler: TEmbedConfig;
}

export interface EditorEvents {
  beforeCreate: never;
  create: never;
  update: never;
  selectionUpdate: never;
  transaction: never;
  focus: never;
  blur: never;
  destroy: never;
  ready: { height: number };
}
