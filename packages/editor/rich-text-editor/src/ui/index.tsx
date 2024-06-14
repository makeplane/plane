"use client";
import * as React from "react";
// editor-core
import {
  EditorContainer,
  EditorContentWrapper,
  getEditorClassNames,
  IMentionHighlight,
  IMentionSuggestion,
  EditorRefApi,
  TFileHandler,
  useConflictFreeEditor,
} from "@plane/editor-core";
// extensions
import { RichTextEditorExtensions } from "src/ui/extensions";
// components
import { EditorBubbleMenu } from "src/ui/menus/bubble-menu";

export type IRichTextEditor = {
  value: Uint8Array;
  dragDropEnabled?: boolean;
  fileHandler: TFileHandler;
  id?: string;
  containerClassName?: string;
  editorClassName?: string;
  onChange: (updates: Uint8Array) => void;
  forwardedRef?: React.MutableRefObject<EditorRefApi | null>;
  debouncedUpdatesEnabled?: boolean;
  mentionHandler: {
    highlights: () => Promise<IMentionHighlight[]>;
    suggestions: () => Promise<IMentionSuggestion[]>;
  };
  placeholder?: string | ((isFocused: boolean, value: string) => string);
  tabIndex?: number;
  onEnterKeyPress?: (e?: any) => void;
};

const RichTextEditor = (props: IRichTextEditor) => {
  const {
    onChange,
    dragDropEnabled,
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
    onEnterKeyPress,
  } = props;

  const [hideDragHandleOnMouseLeave, setHideDragHandleOnMouseLeave] = React.useState<() => void>(() => {});

  // this essentially sets the hideDragHandle function from the DragAndDrop extension as the Plugin
  // loads such that we can invoke it from react when the cursor leaves the container
  const setHideDragHandleFunction = (hideDragHandlerFromDragDrop: () => void) => {
    setHideDragHandleOnMouseLeave(() => hideDragHandlerFromDragDrop);
  };

  const editor = useConflictFreeEditor({
    id,
    editorClassName,
    fileHandler,
    value,
    onChange,
    forwardedRef,
    extensions: RichTextEditorExtensions({
      uploadFile: fileHandler.upload,
      dragDropEnabled,
      setHideDragHandle: setHideDragHandleFunction,
      onEnterKeyPress,
    }),
    mentionHandler,
    placeholder,
    tabIndex,
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
