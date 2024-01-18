"use client";
import {
  DeleteImage,
  EditorContainer,
  EditorContentWrapper,
  getEditorClassNames,
  IMentionSuggestion,
  RestoreImage,
  UploadImage,
  useEditor,
} from "@plane/editor-core";
import * as React from "react";
import { RichTextEditorExtensions } from "src/ui/extensions";
import { EditorBubbleMenu } from "src/ui/menus/bubble-menu";

export type IRichTextEditor = {
  value: string;
  dragDropEnabled?: boolean;
  uploadFile: UploadImage;
  restoreFile: RestoreImage;
  deleteFile: DeleteImage;
  noBorder?: boolean;
  borderOnFocus?: boolean;
  cancelUploadImage?: () => any;
  rerenderOnPropsChange?: {
    id: string;
    description_html: string;
  };
  customClassName?: string;
  editorContentCustomClassNames?: string;
  onChange?: (json: any, html: string) => void;
  setIsSubmitting?: (isSubmitting: "submitting" | "submitted" | "saved") => void;
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
  rerenderOnPropsChange,
  mentionSuggestions,
}: RichTextEditorProps) => {
  const [hideDragHandleOnMouseLeave, setHideDragHandleOnMouseLeave] = React.useState<() => void>(() => {});

  // this essentially sets the hideDragHandle function from the DragAndDrop extension as the Plugin
  // loads such that we can invoke it from react when the cursor leaves the container
  const setHideDragHandleFunction = (hideDragHandlerFromDragDrop: () => void) => {
    setHideDragHandleOnMouseLeave(() => hideDragHandlerFromDragDrop);
  };

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
    rerenderOnPropsChange,
    extensions: RichTextEditorExtensions(uploadFile, setIsSubmitting, dragDropEnabled, setHideDragHandleFunction),
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
    <EditorContainer hideDragHandle={hideDragHandleOnMouseLeave} editor={editor} editorClassNames={editorClassNames}>
      {editor && <EditorBubbleMenu editor={editor} />}
      <div className="flex flex-col">
        <EditorContentWrapper editor={editor} editorContentCustomClassNames={editorContentCustomClassNames} />
      </div>
    </EditorContainer>
  );
};

const RichTextEditorWithRef = React.forwardRef<EditorHandle, IRichTextEditor>((props, ref) => (
  <RichTextEditor {...props} forwardedRef={ref} />
));

RichTextEditorWithRef.displayName = "RichTextEditorWithRef";

export { RichTextEditor, RichTextEditorWithRef };
