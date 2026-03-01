/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import type { Content, Editor, Extensions, JSONContent, RawCommands } from "@tiptap/core";
import type { Node as ProseMirrorNode, Fragment, MarkType, NodeType } from "@tiptap/pm/model";
import type { Selection } from "@tiptap/pm/state";
import type { EditorProps, EditorView } from "@tiptap/pm/view";
import type { NodeViewProps as TNodeViewProps } from "@tiptap/react";
// plane imports
import type { TCustomComponentsMetaData } from "@plane/utils";
// extension types
import type { TTextAlign } from "@/extensions";
// plane editor imports
import type {
  IEditorPropsExtended,
  TExtendedEditorCommands,
  ICollaborativeDocumentEditorPropsExtended,
  TPiChatEditorApi,
} from "@/plane-editor/types/editor-extended";
// types
import type {
  IMarking,
  EventToPayloadMap,
  TAIHandler,
  TDisplayConfig,
  TDocumentEventEmitter,
  TDocumentEventsServer,
  TEditorAsset,
  TExtensions,
  TFileHandler,
  TMentionHandler,
  TRealtimeConfig,
  TServerHandler,
  TUserDetails,
  TExtendedEditorRefApi,
  TExtendedCommandExtraProps,
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
  | "link"
  | "issue-embed"
  | "text-color"
  | "background-color"
  | "text-align"
  | "callout"
  | "ai-block"
  | "page-embed"
  | "attachment"
  | "emoji"
  | "external-embed"
  | TExtendedEditorCommands;

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
  link: {
    url: string;
    text?: string;
  };
  "background-color": {
    color: string | undefined;
  };
  "text-align": {
    alignment: TTextAlign;
  };
} & TExtendedCommandExtraProps;

// Create a utility type that maps a command to its extra props or an empty object if none are defined
export type TCommandWithProps<T extends TEditorCommands> = T extends keyof TCommandExtraProps
  ? TCommandExtraProps[T] // If the command has extra props, include them
  : object; // Otherwise, just return the command type with no extra props

export type TCommandWithPropsWithItemKey<T extends TEditorCommands> = T extends keyof TCommandExtraProps
  ? { itemKey: T } & TCommandExtraProps[T]
  : { itemKey: T };

export type TDocumentInfo = {
  characters: number;
  paragraphs: number;
  words: number;
};
export type CoreEditorRefApi = {
  blur: () => void;
  clearEditor: (emitUpdate?: boolean) => void;
  createSelectionAtCursorPosition: () => void;
  emitRealTimeUpdate: (action: TDocumentEventsServer) => void;
  executeMenuItemCommand: <T extends TEditorCommands>(props: TCommandWithPropsWithItemKey<T>) => void;
  focus: (args: Parameters<RawCommands["focus"]>[0]) => void;
  getAttributesWithExtendedMark: (
    mark: string | MarkType,
    attribute: string | NodeType | MarkType
  ) => Record<string, any> | undefined;
  getCoordsFromPos: (pos?: number) => ReturnType<EditorView["coordsAtPos"]> | undefined;
  editorHasSynced: () => boolean;
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
  getCurrentCursorPosition: () => number | undefined;
  getDocument: () => {
    binary: Uint8Array | null;
    html: string;
    json: JSONContent | null;
  };
  getDocumentInfo: () => TDocumentInfo;
  getHeadings: () => IMarking[];
  getMarkDown: () => string;
  copyMarkdownToClipboard: () => void;
  getSelectedText: () => string | null;
  insertText: (contentHTML: string, insertOnNextLine?: boolean) => void;
  isAnyDropbarOpen: () => boolean;
  isEditorReadyToDiscard: () => boolean;
  isMenuItemActive: <T extends TEditorCommands>(props: TCommandWithPropsWithItemKey<T>) => boolean;
  listenToRealTimeUpdate: () => TDocumentEventEmitter | undefined;
  onDocumentInfoChange: (callback: (documentInfo: TDocumentInfo) => void) => () => void;
  onHeadingChange: (callback: (headings: IMarking[]) => void) => () => void;
  onStateChange: (callback: () => void) => () => void;
  redo: () => void;
  scrollSummary: (marking: IMarking) => void;

  scrollToNodeViaDOMCoordinates: ({ pos, behavior }: { pos?: number; behavior?: ScrollBehavior }) => void;
  setEditorValue: (content: Content | Fragment | ProseMirrorNode, emitUpdate?: boolean) => void;
  setEditorValueAtCursorPosition: (content: string) => void;
  setFocusAtPosition: (position: number) => void;
  setProviderDocument: (value: Uint8Array) => void;
  undo: () => void;
  appendText: (textContent: string) => boolean | undefined;
};

export type EditorRefApi = CoreEditorRefApi & TExtendedEditorRefApi;

export type EditorTitleRefApi = EditorRefApi;

export type TPiChatEditorRefApi = CoreEditorRefApi & TPiChatEditorApi;

// editor props
export type IEditorProps = {
  autofocus?: boolean;
  bubbleMenuEnabled?: boolean;
  containerClassName?: string;
  displayConfig?: TDisplayConfig;
  disabledExtensions: TExtensions[];
  editable: boolean;
  editorClassName?: string;
  editorProps?: EditorProps;
  extensions?: Extensions;
  flaggedExtensions: TExtensions[];
  fileHandler: TFileHandler;
  forwardedRef?: React.MutableRefObject<EditorRefApi | null>;
  getEditorMetaData: (htmlContent: string) => TCustomComponentsMetaData;
  handleEditorReady?: (value: boolean) => void;
  id: string;
  initialValue: Content;
  isTouchDevice?: boolean;
  mentionHandler: TMentionHandler;
  onAssetChange?: (assets: TEditorAsset[]) => void;
  onEditorFocus?: () => void;
  onChange?: (json: object, html: string, options?: { isMigrationUpdate?: boolean }) => void;
  onEnterKeyPress?: (e?: any) => void;
  onTransaction?: () => void;
  placeholder?: string | ((isFocused: boolean, isEmpty: boolean) => string);
  showPlaceholderOnEmpty?: boolean;
  tabIndex?: number;
  value?: Content | null;
  extendedEditorProps: IEditorPropsExtended;
};

export type ILiteTextEditorProps = IEditorProps;

export type IRichTextEditorProps = IEditorProps & {
  dragDropEnabled?: boolean;
};

export type ICollaborativeDocumentEditorProps = Omit<IEditorProps, "initialValue" | "onEnterKeyPress" | "value"> & {
  aiHandler?: TAIHandler;
  documentLoaderClassName?: string;
  dragDropEnabled?: boolean;
  editable: boolean;
  realtimeConfig: TRealtimeConfig;
  serverHandler: TServerHandler;
  user: TUserDetails;
  updatePageProperties?: <T extends keyof EventToPayloadMap>(
    pageIds: string | string[],
    actionType: T,
    data: EventToPayloadMap[T],
    performAction?: boolean
  ) => void;
  pageRestorationInProgress?: boolean;
  titleRef?: React.MutableRefObject<EditorTitleRefApi | null>;
  extendedDocumentEditorProps?: ICollaborativeDocumentEditorPropsExtended;
  isFetchingFallbackBinary?: boolean;
};

export type IDocumentEditorProps = Omit<IEditorProps, "initialValue" | "onEnterKeyPress" | "value"> & {
  aiHandler?: TAIHandler;
  user?: TUserDetails;
  value: Content;
  /** Optional callback to receive the TipTap Editor instance once created */
  onEditorInstanceCreated?: (editor: Editor) => void;
  /** Optional loader to display while editor is initializing */
  loader?: React.ReactNode;
};

export type EditorEvents = {
  beforeCreate: never;
  create: never;
  update: never;
  selectionUpdate: never;
  transaction: never;
  focus: never;
  blur: never;
  destroy: never;
  ready: { height: number };
};

export type NodeViewProps = TNodeViewProps;
