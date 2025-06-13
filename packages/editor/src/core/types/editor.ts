import { Extensions, FocusPosition, JSONContent } from "@tiptap/core";
import { MarkType, NodeType } from "@tiptap/pm/model";
import { Selection } from "@tiptap/pm/state";
import { EditorProps } from "@tiptap/pm/view";
// plane types
import { TWebhookConnectionQueryParams } from "@plane/types";
// extension types
import { TTextAlign } from "@/extensions";
// helpers
import { IMarking } from "@/helpers/scroll-to-node";
// types
import {
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
  TServerHandler,
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
  | "link"
  | "issue-embed"
  | "text-color"
  | "background-color"
  | "text-align"
  | "callout"
  | "attachment";

export type TCommandExtraProps = {
  image: { savedSelection: Selection | null };
  attachment: { savedSelection: Selection | null };
  "text-color": { color: string | undefined };
  "background-color": { color: string | undefined };
  "text-align": { alignment: TTextAlign };
  link: { url: string; text?: string };
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
  getDocument: () => { binary: Uint8Array | null; html: string; json: JSONContent | null };
  clearEditor: (emitUpdate?: boolean) => void;
  setEditorValue: (content: string, emitUpdate?: boolean) => void;
  scrollSummary: (marking: IMarking) => void;
  getDocumentInfo: () => { characters: number; paragraphs: number; words: number };
};

export interface EditorRefApi extends EditorReadOnlyRefApi {
  blur: () => void;
  createSelectionAtCursorPosition?: () => void;
  focus: ({ position, scrollIntoView }: { position?: FocusPosition; scrollIntoView?: boolean }) => void;
  getCordsFromPos: (pos?: number) => { left: number; right: number; top: number; bottom: number } | undefined;
  getCurrentCursorPosition: () => number | undefined;
  getSelectedNodeAttributes: (attribute: string | NodeType | MarkType) => Record<string, any> | undefined;
  scrollToNodeViaDOMCoordinates: ({ pos, behavior }: { pos?: number; behavior?: ScrollBehavior }) => void;
  setEditorValueAtCursorPosition: (content: string) => void;
  executeMenuItemCommand: <T extends TEditorCommands>(props: TCommandWithPropsWithItemKey<T>) => void;
  isMenuItemActive: <T extends TEditorCommands>(props: TCommandWithPropsWithItemKey<T>) => boolean;
  onStateChange: (callback: () => void) => () => void;
  setFocusAtPosition: (position: number) => void;
  isEditorReadyToDiscard: () => boolean;
  getSelectedText: () => string | null;
  insertText: (contentHTML: string, insertOnNextLine?: boolean) => void;
  setProviderDocument: (value: Uint8Array) => void;
  onHeadingChange: (callback: (headings: IMarking[]) => void) => () => void;
  getHeadings: () => IMarking[];
  emitRealTimeUpdate: (action: TDocumentEventsServer) => void;
  listenToRealTimeUpdate: () => TDocumentEventEmitter | undefined;
  undo: () => void;
  redo: () => void;
}

// editor props
export interface IEditorProps {
  containerClassName?: string;
  displayConfig?: TDisplayConfig;
  disabledExtensions: TExtensions[];
  editable?: boolean;
  editorClassName?: string;
  extensions?: Extensions;
  fileHandler: TFileHandler;
  forwardedRef?: React.MutableRefObject<EditorRefApi | null>;
  id: string;
  initialValue: string;
  isMobile?: boolean;
  mentionHandler: TMentionHandler;
  onChange?: (json: object, html: string) => void;
  onInitialContentLoad?: (contentHeight: number) => void;
  onTransaction?: () => void;
  handleEditorReady?: (value: boolean) => void;
  autofocus?: boolean;
  onEnterKeyPress?: (e?: any) => void;
  placeholder?: string | ((isFocused: boolean, value: string) => string);
  tabIndex?: number;
  value?: string | null;
  bubbleMenuEnabled?: boolean;
}
export interface ILiteTextEditor extends IEditorProps {}
export interface IRichTextEditor extends IEditorProps {
  bubbleMenuEnabled?: boolean;
  dragDropEnabled?: boolean;
}

export interface ICollaborativeDocumentEditor
  extends Omit<IEditorProps, "initialValue" | "onChange" | "onEnterKeyPress" | "value"> {
  aiHandler?: TAIHandler;
  bubbleMenuEnabled?: boolean;
  editable: boolean;
  editorProps?: EditorProps;
  embedHandler: TEmbedConfig;
  handleEditorReady?: (value: boolean) => void;
  id: string;
  isDragDropEnabled?: boolean;
  isMobile?: boolean;
  loaderClassName?: string;
  onEditorClick?: () => void;
  realtimeConfig: TRealtimeConfig;
  serverHandler?: TServerHandler;
  user: TUserDetails;
}

// read only editor props
export interface IReadOnlyEditorProps {
  containerClassName?: string;
  disabledExtensions: TExtensions[];
  displayConfig?: TDisplayConfig;
  editorClassName?: string;
  extensions?: Extensions;
  fileHandler: TReadOnlyFileHandler;
  forwardedRef?: React.MutableRefObject<EditorReadOnlyRefApi | null>;
  id: string;
  initialValue: string;
  isMobile?: boolean;
  mentionHandler: TReadOnlyMentionHandler;
}

export type ILiteTextReadOnlyEditor = IReadOnlyEditorProps;

export type IRichTextReadOnlyEditor = IReadOnlyEditorProps;

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
  cookie?: string;
};

export type TRealtimeConfig = {
  url: string;
  queryParams: TWebhookConnectionQueryParams;
};

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
