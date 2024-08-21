// helpers
import { IMarking } from "@/helpers/scroll-to-node";
// types
import { IMentionHighlight, IMentionSuggestion, TDisplayConfig, TEditorCommands, TFileHandler } from "@/types";

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
  setSynced: () => void;
  hasUnsyncedChanges: () => boolean;
  getSelectedText: () => string | null;
  insertText: (contentHTML: string, insertOnNextLine?: boolean) => void;
}

export interface IEditorProps {
  containerClassName?: string;
  displayConfig?: TDisplayConfig;
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
  onEnterKeyPress?: (e?: any) => void;
  placeholder?: string | ((isFocused: boolean, value: string) => string);
  tabIndex?: number;
  value?: string | null;
}

export interface ILiteTextEditor extends IEditorProps {}

export interface IRichTextEditor extends IEditorProps {
  dragDropEnabled?: boolean;
}

export interface IReadOnlyEditorProps {
  containerClassName?: string;
  displayConfig?: TDisplayConfig;
  editorClassName?: string;
  forwardedRef?: React.MutableRefObject<EditorReadOnlyRefApi | null>;
  id: string;
  initialValue: string;
  mentionHandler: {
    highlights: () => Promise<IMentionHighlight[]>;
  };
  tabIndex?: number;
}

export interface ILiteTextReadOnlyEditor extends IReadOnlyEditorProps {}

export interface IRichTextReadOnlyEditor extends IReadOnlyEditorProps {}
