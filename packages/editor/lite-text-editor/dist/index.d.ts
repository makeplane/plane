import * as React from 'react';

type UploadImage = (file: File) => Promise<string>;
type DeleteImage = (assetUrlWithWorkspaceId: string) => Promise<any>;
interface ILiteTextEditor {
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
    commentAccessSpecifier?: {
        accessValue: string;
        onAccessChange: (accessKey: string) => void;
        showAccessSpecifier: boolean;
        commentAccess: {
            icon: string;
            key: string;
            label: "Private" | "Public";
        }[];
    };
    onEnterKeyPress?: (e?: any) => void;
}
interface LiteTextEditorProps extends ILiteTextEditor {
    forwardedRef?: React.Ref<EditorHandle$1>;
}
interface EditorHandle$1 {
    clearEditor: () => void;
    setEditorValue: (content: string) => void;
}
declare const LiteTextEditor: ({ onChange, debouncedUpdatesEnabled, editable, setIsSubmitting, setShouldShowAlert, editorContentCustomClassNames, value, uploadFile, deleteFile, noBorder, borderOnFocus, customClassName, forwardedRef, commentAccessSpecifier, onEnterKeyPress }: LiteTextEditorProps) => JSX.Element | null;
declare const LiteTextEditorWithRef: React.ForwardRefExoticComponent<ILiteTextEditor & React.RefAttributes<EditorHandle$1>>;

interface ICoreReadOnlyEditor {
    value: string;
    editorContentCustomClassNames?: string;
    noBorder?: boolean;
    borderOnFocus?: boolean;
    customClassName?: string;
}
interface EditorCoreProps extends ICoreReadOnlyEditor {
    forwardedRef?: React.Ref<EditorHandle>;
}
interface EditorHandle {
    clearEditor: () => void;
    setEditorValue: (content: string) => void;
}
declare const LiteReadOnlyEditor: ({ editorContentCustomClassNames, noBorder, borderOnFocus, customClassName, value, forwardedRef, }: EditorCoreProps) => JSX.Element | null;
declare const LiteReadOnlyEditorWithRef: React.ForwardRefExoticComponent<ICoreReadOnlyEditor & React.RefAttributes<EditorHandle>>;

export { LiteReadOnlyEditor, LiteReadOnlyEditorWithRef, LiteTextEditor, LiteTextEditorWithRef };
