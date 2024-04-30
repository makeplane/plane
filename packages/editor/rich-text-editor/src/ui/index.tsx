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
} from "@plane/editor-core";
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
  id?: string;
  containerClassName?: string;
  editorClassName?: string;
  onChange?: (json: object, html: string) => void;
  forwardedRef?: React.MutableRefObject<EditorRefApi | null>;
  debouncedUpdatesEnabled?: boolean;
  mentionHandler: {
    highlights: () => Promise<IMentionHighlight[]>;
    suggestions: () => Promise<IMentionSuggestion[]>;
  };
  placeholder?: string | ((isFocused: boolean) => string);
  tabIndex?: number;
};

const RichTextEditor = (props: IRichTextEditor) => {
  const {
    onChange,
    dragDropEnabled,
    initialValue,
    value,
    fileHandler,
    containerClassName,
    editorClassName = "",
    forwardedRef,
    // rerenderOnPropsChange,
    id = "",
    placeholder,
    tabIndex,
    mentionHandler,
  } = props;

  const [hideDragHandleOnMouseLeave, setHideDragHandleOnMouseLeave] = React.useState<() => void>(() => {});

  // this essentially sets the hideDragHandle function from the DragAndDrop extension as the Plugin
  // loads such that we can invoke it from react when the cursor leaves the container
  const setHideDragHandleFunction = (hideDragHandlerFromDragDrop: () => void) => {
    setHideDragHandleOnMouseLeave(() => hideDragHandlerFromDragDrop);
  };

  const editor = useEditor({
    id,
    editorClassName,
    restoreFile: fileHandler.restore,
    uploadFile: fileHandler.upload,
    deleteFile: fileHandler.delete,
    cancelUploadImage: fileHandler.cancel,
    onChange,
    initialValue,
    value,
    forwardedRef,
    // rerenderOnPropsChange,
    extensions: RichTextEditorExtensions({
      uploadFile: fileHandler.upload,
      dragDropEnabled,
      setHideDragHandle: setHideDragHandleFunction,
    }),
    tabIndex,
    mentionHandler,
    placeholder,
  });

  const editorContainerClassName = getEditorClassNames({
    noBorder: true,
    borderOnFocus: false,
    containerClassName,
  });

  if (!editor) return null;

  return (
    <EditorContainer
      hideDragHandle={hideDragHandleOnMouseLeave}
      editor={editor}
      editorContainerClassName={editorContainerClassName}
    >
      {editor && <EditorBubbleMenu editor={editor} />}
      <div className="flex flex-col">
        <EditorContentWrapper tabIndex={tabIndex} editor={editor} />
      </div>
    </EditorContainer>
  );
};

const RichTextEditorWithRef = React.forwardRef<EditorRefApi, IRichTextEditor>((props, ref) => (
  <RichTextEditor {...props} forwardedRef={ref as React.MutableRefObject<EditorRefApi | null>} />
));

RichTextEditorWithRef.displayName = "RichTextEditorWithRef";

export { RichTextEditor, RichTextEditorWithRef };
