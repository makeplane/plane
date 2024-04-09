"use client";
import {
  DeleteImage,
  EditorContainer,
  EditorContentWrapper,
  getEditorClassNames,
  IMentionHighlight,
  IMentionSuggestion,
  RestoreImage,
  UploadImage,
  useEditor,
  EditorRefApi,
} from "@plane/editor-document-core";
import * as React from "react";
import { RichTextEditorExtensions } from "src/ui/extensions";
import { EditorBubbleMenu } from "src/ui/menus/bubble-menu";

export type IRichTextEditor = {
  initialValue: string;
  value?: string | null;
  dragDropEnabled?: boolean;
  fileHandler: {
    cancel: () => void;
    delete: DeleteImage;
    upload: UploadImage;
    restore: RestoreImage;
  };
  // rerenderOnPropsChange?: {
  //   id: string;
  //   description_html: string;
  // };
  id?: string;
  customClassName?: string;
  editorContentCustomClassNames?: string;
  onChange?: (json: object, html: string) => void;
  forwardedRef?: React.MutableRefObject<EditorRefApi | null>;
  debouncedUpdatesEnabled?: boolean;
  mentionHighlights: () => Promise<IMentionHighlight[]>;
  mentionSuggestions: () => Promise<IMentionSuggestion[]>;
  tabIndex?: number;
};

const RichTextEditor = (props: IRichTextEditor) => {
  const {
    onChange,
    dragDropEnabled,
    editorContentCustomClassNames,
    initialValue,
    value = "",
    fileHandler,
    customClassName,
    forwardedRef,
    mentionHighlights,
    // rerenderOnPropsChange,
    id = "",
    mentionSuggestions,
    tabIndex,
  } = props;

  const [hideDragHandleOnMouseLeave, setHideDragHandleOnMouseLeave] = React.useState<() => void>(() => {});

  // this essentially sets the hideDragHandle function from the DragAndDrop extension as the Plugin
  // loads such that we can invoke it from react when the cursor leaves the container
  const setHideDragHandleFunction = (hideDragHandlerFromDragDrop: () => void) => {
    setHideDragHandleOnMouseLeave(() => hideDragHandlerFromDragDrop);
  };

  const editor = useEditor({
    id,
    restoreFile: fileHandler.restore,
    uploadFile: fileHandler.upload,
    deleteFile: fileHandler.delete,
    cancelUploadImage: fileHandler.cancel,
    onChange,
    initialValue,
    value,
    forwardedRef,
    // rerenderOnPropsChange,
    extensions: RichTextEditorExtensions(fileHandler.upload, dragDropEnabled, setHideDragHandleFunction),
    mentionSuggestions,
    mentionHighlights,
  });

  const editorClassNames = getEditorClassNames({
    noBorder: true,
    borderOnFocus: false,
    customClassName,
  });

  if (!editor) return null;

  return (
    <EditorContainer hideDragHandle={hideDragHandleOnMouseLeave} editor={editor} editorClassNames={editorClassNames}>
      {editor && <EditorBubbleMenu editor={editor} />}
      <div className="flex flex-col">
        <EditorContentWrapper
          tabIndex={tabIndex}
          editor={editor}
          editorContentCustomClassNames={editorContentCustomClassNames}
        />
      </div>
    </EditorContainer>
  );
};

const RichTextEditorWithRef = React.forwardRef<EditorRefApi, IRichTextEditor>((props, ref) => (
  <RichTextEditor {...props} forwardedRef={ref as React.MutableRefObject<EditorRefApi | null>} />
));

RichTextEditorWithRef.displayName = "RichTextEditorWithRef";

export { RichTextEditor, RichTextEditorWithRef };
