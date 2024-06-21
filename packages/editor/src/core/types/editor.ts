// types
import { EditorMenuItemNames } from "@/components/menus";
import { IMarking } from "@/helpers/scroll-to-node";
import { TFileHandler } from "@/hooks/use-editor";
import { IMentionHighlight, IMentionSuggestion } from "@/types";

export type EditorReadOnlyRefApi = {
  getMarkDown: () => string;
  getHTML: () => string;
  clearEditor: () => void;
  setEditorValue: (content: string) => void;
  scrollSummary: (marking: IMarking) => void;
};

export interface EditorRefApi extends EditorReadOnlyRefApi {
  setEditorValueAtCursorPosition: (content: string) => void;
  executeMenuItemCommand: (itemName: EditorMenuItemNames) => void;
  isMenuItemActive: (itemName: EditorMenuItemNames) => boolean;
  onStateChange: (callback: () => void) => () => void;
  setFocusAtPosition: (position: number) => void;
  isEditorReadyToDiscard: () => boolean;
}

export interface IEditorProps {
  containerClassName?: string;
  editorClassName?: string;
  fileHandler: TFileHandler;
  forwardedRef?: React.MutableRefObject<EditorRefApi | null>;
  id?: string;
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
  editorClassName?: string;
  forwardedRef?: React.MutableRefObject<EditorReadOnlyRefApi | null>;
  initialValue: string;
  mentionHandler: {
    highlights: () => Promise<IMentionHighlight[]>;
  };
  tabIndex?: number;
}

export interface ILiteTextReadOnlyEditor extends IReadOnlyEditorProps {}

export interface IRichTextReadOnlyEditor extends IReadOnlyEditorProps {}
