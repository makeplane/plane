"use client"
import * as React from 'react';
import { EditorContainer, EditorContentWrapper, getEditorClassNames, useEditor } from '@plane/editor-core';
import { FixedMenu } from './menus/fixed-menu';
import { LiteTextEditorExtensions } from './extensions';

export type UploadImage = (file: File) => Promise<string>;
export type DeleteImage = (assetUrlWithWorkspaceId: string) => Promise<any>;

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
    accessValue: string,
    onAccessChange: (accessKey: string) => void,
    showAccessSpecifier: boolean,
    commentAccess: {
      icon: string;
      key: string;
      label: "Private" | "Public";
    }[]
  };
  onEnterKeyPress?: (e?: any) => void;
}

interface LiteTextEditorProps extends ILiteTextEditor {
  forwardedRef?: React.Ref<EditorHandle>;
}

interface EditorHandle {
  clearEditor: () => void;
  setEditorValue: (content: string) => void;
}

const LiteTextEditor = ({
  onChange,
  debouncedUpdatesEnabled,
  editable,
  setIsSubmitting,
  setShouldShowAlert,
  editorContentCustomClassNames,
  value,
  uploadFile,
  deleteFile,
  noBorder,
  borderOnFocus,
  customClassName,
  forwardedRef,
  commentAccessSpecifier,
  onEnterKeyPress
}: LiteTextEditorProps) => {
  const editor = useEditor({
    onChange,
    debouncedUpdatesEnabled,
    editable,
    setIsSubmitting,
    setShouldShowAlert,
    value,
    uploadFile,
    deleteFile,
    forwardedRef,
    extensions: LiteTextEditorExtensions(onEnterKeyPress),
  });

  const editorClassNames = getEditorClassNames({ noBorder, borderOnFocus, customClassName });

  if (!editor) return null;

  return (
    <EditorContainer editor={editor} editorClassNames={editorClassNames}>
      <div className="flex flex-col">
        <EditorContentWrapper editor={editor} editorContentCustomClassNames={editorContentCustomClassNames} />
        {(editable !== false) &&
          (<div className="w-full mt-4">
            <FixedMenu editor={editor} commentAccessSpecifier={commentAccessSpecifier} />
          </div>)
        }
      </div>
    </EditorContainer >
  );
};

const LiteTextEditorWithRef = React.forwardRef<EditorHandle, ILiteTextEditor>((props, ref) => (
  <LiteTextEditor {...props} forwardedRef={ref} />
));

LiteTextEditorWithRef.displayName = "LiteTextEditorWithRef";

export { LiteTextEditor, LiteTextEditorWithRef };
