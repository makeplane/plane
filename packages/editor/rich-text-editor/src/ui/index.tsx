"use client";
import * as React from "react";
import {
  EditorContainer,
  EditorContentWrapper,
  getEditorClassNames,
  useEditor,
} from "@plane/editor-core";
import { EditorBubbleMenu } from "./menus/bubble-menu";
import { RichTextEditorExtensions } from "./extensions";
import {
  DeleteImage,
  IMentionSuggestion,
  RestoreImage,
  UploadImage,
} from "@plane/editor-types";

export type IRichTextEditor = {
  value: string;
  dragDropEnabled?: boolean;
  uploadFile: UploadImage;
  restoreFile: RestoreImage;
  deleteFile: DeleteImage;
  noBorder?: boolean;
  borderOnFocus?: boolean;
  cancelUploadImage?: () => any;
  text_html?: string;
  customClassName?: string;
  editorContentCustomClassNames?: string;
  onChange?: (json: any, html: string) => void;
  setIsSubmitting?: (
    isSubmitting: "submitting" | "submitted" | "saved",
  ) => void;
  setShouldShowAlert?: (showAlert: boolean) => void;
  forwardedRef?: any;
  debouncedUpdatesEnabled?: boolean;
  mentionHighlights?: string[];
  mentionSuggestions?: IMentionSuggestion[];
};

export interface RichTextEditorProps extends IRichTextEditor {
  forwardedRef?: React.Ref<EditorHandle>;
}

interface EditorHandle {
  clearEditor: () => void;
  setEditorValue: (content: string) => void;
}

const RichTextEditor = ({
  onChange,
  text_html,
  dragDropEnabled,
  debouncedUpdatesEnabled,
  setIsSubmitting,
  setShouldShowAlert,
  editorContentCustomClassNames,
  value,
  uploadFile,
  deleteFile,
  noBorder,
  cancelUploadImage,
  borderOnFocus,
  customClassName,
  restoreFile,
  forwardedRef,
  mentionHighlights,
  mentionSuggestions,
}: RichTextEditorProps) => {
  const editor = useEditor({
    onChange,
    debouncedUpdatesEnabled,
    setIsSubmitting,
    setShouldShowAlert,
    value,
    uploadFile,
    cancelUploadImage,
    deleteFile,
    restoreFile,
    forwardedRef,
    text_html,
    extensions: RichTextEditorExtensions(
      uploadFile,
      setIsSubmitting,
      dragDropEnabled,
    ),
    mentionHighlights,
    mentionSuggestions,
  });

  const editorClassNames = getEditorClassNames({
    noBorder,
    borderOnFocus,
    customClassName,
  });

  if (!editor) return null;

  return (
    <EditorContainer editor={editor} editorClassNames={editorClassNames}>
      {editor && <EditorBubbleMenu editor={editor} />}
      <div className="flex flex-col">
        <EditorContentWrapper
          editor={editor}
          editorContentCustomClassNames={editorContentCustomClassNames}
        />
      </div>
    </EditorContainer>
  );
};

const RichTextEditorWithRef = React.forwardRef<EditorHandle, IRichTextEditor>(
  (props, ref) => <RichTextEditor {...props} forwardedRef={ref} />,
);

RichTextEditorWithRef.displayName = "RichTextEditorWithRef";

export { RichTextEditor, RichTextEditorWithRef };
