import type { Extensions, JSONContent } from "@tiptap/core";
import type { Selection } from "@tiptap/pm/state";
// extension types
import type { TTextAlign } from "@/extensions";
// helpers
import type { IMarking } from "@/helpers/scroll-to-node";
// types
import type {
  EventToPayloadMap,
  TAIHandler,
  TDisplayConfig,
  TDocumentEventEmitter,
  TDocumentEventsServer,
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
  | "toggle-list"
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
  | "page-embed"
  | "attachment";

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

// editor refs
export type EditorReadOnlyRefApi = {
  getMarkDown: () => string;
  getDocument: () => {
    binary: Uint8Array | null;
    html: string;
    json: JSONContent | null;
  };
  clearEditor: (emitUpdate?: boolean) => void;
  setEditorValue: (content: string, emitUpdate?: boolean) => void;
  scrollSummary: (marking: IMarking) => void;
  getDocumentInfo: () => {
    characters: number;
    paragraphs: number;
    words: number;
  };
};

// title ref api
export interface EditorTitleRefApi extends EditorReadOnlyRefApi {
  setEditorValue: EditorReadOnlyRefApi["setEditorValue"];
}

export interface EditorRefApi extends EditorReadOnlyRefApi {
  blur: () => void;
  scrollToNodeViaDOMCoordinates: (behavior?: ScrollBehavior, position?: number) => void;
  getCurrentCursorPosition: () => number | undefined;
  setEditorValueAtCursorPosition: (content: string) => void;
  executeMenuItemCommand: <T extends TEditorCommands>(props: TCommandWithPropsWithItemKey<T>) => void;
  isMenuItemActive: <T extends TEditorCommands>(props: TCommandWithPropsWithItemKey<T>) => boolean;
  onStateChange: (callback: () => void) => () => void;
  setFocusAtPosition: (position: number) => void;
  isEditorReadyToDiscard: () => boolean;
  editorHasSynced: () => boolean;
  getSelectedText: () => string | null;
  insertText: (contentHTML: string, insertOnNextLine?: boolean) => void;
  setProviderDocument: (value: Uint8Array) => void;
  emitRealTimeUpdate: (action: TDocumentEventsServer) => void;
  listenToRealTimeUpdate: () => TDocumentEventEmitter | undefined;
  onHeadingChange: (callback: (headings: IMarking[]) => void) => () => void;
  getHeadings: () => IMarking[];
  findAndDeleteNode: (
    {
      attribute,
      value,
    }: {
      attribute: string;
      value: string | string[];
    },
    nodeName: string
  ) => void;
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
  mentionHandler: TMentionHandler;
  onChange?: (json: object, html: string) => void;
  isSmoothCursorEnabled: boolean;
  onEnterKeyPress?: (e?: any) => void;
  onTransaction?: () => void;
  placeholder?: string | ((isFocused: boolean, value: string) => string);
  tabIndex?: number;
  value?: string | null;
}

export type ILiteTextEditorProps = IEditorProps;
export interface IRichTextEditorProps extends IEditorProps {
  dragDropEnabled?: boolean;
}

export interface ICollaborativeDocumentEditorProps
  extends Omit<IEditorProps, "extensions" | "initialValue" | "onEnterKeyPress" | "value"> {
  aiHandler?: TAIHandler;
  editable: boolean;
  embedHandler: TEmbedConfig;
  realtimeConfig: TRealtimeConfig;
  serverHandler?: TServerHandler;
  user: TUserDetails;
  updatePageProperties?: <T extends keyof EventToPayloadMap>(
    pageIds: string | string[],
    actionType: T,
    data: EventToPayloadMap[T],
    performAction?: boolean
  ) => void;
  pageRestorationInProgress?: boolean;
  titleRef?: React.MutableRefObject<EditorTitleRefApi | null>;
}

export interface IDocumentEditor extends Omit<IEditorProps, "onEnterKeyPress" | "value"> {
  aiHandler?: TAIHandler;
  embedHandler: TEmbedConfig;
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
  > {
  fileHandler: TReadOnlyFileHandler;
  forwardedRef?: React.MutableRefObject<EditorReadOnlyRefApi | null>;
  mentionHandler: TReadOnlyMentionHandler;
}

export type ILiteTextReadOnlyEditorProps = IReadOnlyEditorProps;

export type IRichTextReadOnlyEditorProps = IReadOnlyEditorProps;

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
