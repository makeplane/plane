import * as React from 'react';

type UploadImage = (file: File) => Promise<string>;
type DeleteImage = (assetUrlWithWorkspaceId: string) => Promise<any>;
interface IRichTextEditor {
    value: string;
    uploadFile: UploadImage;
    deleteFile: DeleteImage;
    noBorder?: boolean;
    borderOnFocus?: boolean;
    customClassName?: string;
    editorContentCustomClassNames?: string;
    onChange?: (json: any, html: string) => void;
    setIsSubmitting?: (isSubmitting: "submitting" | "submitted" | "saved") => void;
    setShouldShowAlert?: (showAlert: boolean) => void;
    editable?: boolean;
    forwardedRef?: any;
    debouncedUpdatesEnabled?: boolean;
}
interface RichTextEditorProps extends IRichTextEditor {
    forwardedRef?: React.Ref<EditorHandle$1>;
}
interface EditorHandle$1 {
    clearEditor: () => void;
    setEditorValue: (content: string) => void;
}
declare const RichTextEditor: ({ onChange, debouncedUpdatesEnabled, editable, setIsSubmitting, setShouldShowAlert, editorContentCustomClassNames, value, uploadFile, deleteFile, noBorder, borderOnFocus, customClassName, forwardedRef, }: RichTextEditorProps) => JSX.Element | null;
declare const RichTextEditorWithRef: React.ForwardRefExoticComponent<IRichTextEditor & React.RefAttributes<EditorHandle$1>>;

interface IRichTextReadOnlyEditor {
    value: string;
    editorContentCustomClassNames?: string;
    noBorder?: boolean;
    borderOnFocus?: boolean;
    customClassName?: string;
}
interface RichTextReadOnlyEditorProps extends IRichTextReadOnlyEditor {
    forwardedRef?: React.Ref<EditorHandle>;
}
interface EditorHandle {
    clearEditor: () => void;
    setEditorValue: (content: string) => void;
}
declare const RichReadOnlyEditor: ({ editorContentCustomClassNames, noBorder, borderOnFocus, customClassName, value, forwardedRef, }: RichTextReadOnlyEditorProps) => JSX.Element | null;
declare const RichReadOnlyEditorWithRef: React.ForwardRefExoticComponent<IRichTextReadOnlyEditor & React.RefAttributes<EditorHandle>>;

export { RichReadOnlyEditor, RichReadOnlyEditorWithRef, RichTextEditor, RichTextEditorWithRef };
