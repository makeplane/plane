import { ClassValue } from 'clsx';
import { EditorView, EditorProps } from '@tiptap/pm/view';
import { Editor } from '@tiptap/react';
import { ReactNode } from 'react';
import { BoldIcon } from 'lucide-react';
import { Editor as Editor$1, Range } from '@tiptap/core';

interface EditorClassNames {
    noBorder?: boolean;
    borderOnFocus?: boolean;
    customClassName?: string;
}
declare const getEditorClassNames: ({ noBorder, borderOnFocus, customClassName }: EditorClassNames) => string;
declare function cn(...inputs: ClassValue[]): string;

type UploadImage = (file: File) => Promise<string>;

declare function startImageUpload(file: File, view: EditorView, pos: number, uploadFile: UploadImage, setIsSubmitting?: (isSubmitting: "submitting" | "submitted" | "saved") => void): Promise<void>;

interface EditorContainerProps {
    editor: Editor | null;
    editorClassNames: string;
    children: ReactNode;
}
declare const EditorContainer: ({ editor, editorClassNames, children }: EditorContainerProps) => JSX.Element;

interface EditorContentProps {
    editor: Editor | null;
    editorContentCustomClassNames: string | undefined;
    children?: ReactNode;
}
declare const EditorContentWrapper: ({ editor, editorContentCustomClassNames, children }: EditorContentProps) => JSX.Element;

type DeleteImage = (assetUrlWithWorkspaceId: string) => Promise<any>;

interface CustomEditorProps {
    editable?: boolean;
    uploadFile: UploadImage;
    setIsSubmitting?: (isSubmitting: "submitting" | "submitted" | "saved") => void;
    setShouldShowAlert?: (showAlert: boolean) => void;
    value: string;
    deleteFile: DeleteImage;
    debouncedUpdatesEnabled?: boolean;
    onChange?: (json: any, html: string) => void;
    extensions?: any;
    editorProps?: EditorProps;
    forwardedRef?: any;
}
declare const useEditor: ({ uploadFile, editable, deleteFile, editorProps, value, extensions, onChange, setIsSubmitting, debouncedUpdatesEnabled, forwardedRef, setShouldShowAlert, }: CustomEditorProps) => Editor | null;

interface CustomReadOnlyEditorProps {
    value: string;
    forwardedRef?: any;
}
declare const useReadOnlyEditor: ({ value, forwardedRef }: CustomReadOnlyEditorProps) => Editor | null;

interface EditorMenuItem {
    name: string;
    isActive: () => boolean;
    command: () => void;
    icon: typeof BoldIcon;
}
declare const BoldItem: (editor: Editor) => EditorMenuItem;
declare const ItalicItem: (editor: Editor) => EditorMenuItem;
declare const UnderLineItem: (editor: Editor) => EditorMenuItem;
declare const StrikeThroughItem: (editor: Editor) => EditorMenuItem;
declare const CodeItem: (editor: Editor) => EditorMenuItem;
declare const BulletListItem: (editor: Editor) => EditorMenuItem;
declare const NumberedListItem: (editor: Editor) => EditorMenuItem;
declare const QuoteItem: (editor: Editor) => EditorMenuItem;
declare const TableItem: (editor: Editor) => EditorMenuItem;
declare const ImageItem: (editor: Editor, uploadFile: UploadImage, setIsSubmitting?: ((isSubmitting: "submitting" | "submitted" | "saved") => void) | undefined) => EditorMenuItem;

declare const toggleBold: (editor: Editor$1, range?: Range) => void;
declare const toggleItalic: (editor: Editor$1, range?: Range) => void;
declare const toggleUnderline: (editor: Editor$1, range?: Range) => void;
declare const toggleCode: (editor: Editor$1, range?: Range) => void;
declare const toggleOrderedList: (editor: Editor$1, range?: Range) => void;
declare const toggleBulletList: (editor: Editor$1, range?: Range) => void;
declare const toggleStrike: (editor: Editor$1, range?: Range) => void;
declare const toggleBlockquote: (editor: Editor$1, range?: Range) => void;
declare const insertTableCommand: (editor: Editor$1, range?: Range) => void;
declare const insertImageCommand: (editor: Editor$1, uploadFile: UploadImage, setIsSubmitting?: ((isSubmitting: "submitting" | "submitted" | "saved") => void) | undefined, range?: Range) => void;

export { BoldItem, BulletListItem, CodeItem, EditorContainer, EditorContentWrapper, EditorMenuItem, ImageItem, ItalicItem, NumberedListItem, QuoteItem, StrikeThroughItem, TableItem, UnderLineItem, cn, getEditorClassNames, insertImageCommand, insertTableCommand, startImageUpload, toggleBlockquote, toggleBold, toggleBulletList, toggleCode, toggleItalic, toggleOrderedList, toggleStrike, toggleUnderline, useEditor, useReadOnlyEditor };
