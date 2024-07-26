import { forwardRef, useCallback, useState } from "react";
// components
import { EditorWrapper } from "@/components/editors";
import { EditorBubbleMenu } from "@/components/menus";
// extensions
import { DragAndDrop, SlashCommand } from "@/extensions";
// types
import { EditorRefApi, IRichTextEditor } from "@/types";

const RichTextEditor = (props: IRichTextEditor) => {
  const { dragDropEnabled, fileHandler } = props;
  // states
  const [hideDragHandleOnMouseLeave, setHideDragHandleOnMouseLeave] = useState<() => void>(() => {});

  // this essentially sets the hideDragHandle function from the DragAndDrop extension as the Plugin
  // loads such that we can invoke it from react when the cursor leaves the container
  const setHideDragHandleFunction = (hideDragHandlerFromDragDrop: () => void) => {
    setHideDragHandleOnMouseLeave(() => hideDragHandlerFromDragDrop);
  };

  const getExtensions = useCallback(() => {
    const extensions = [
      SlashCommand(fileHandler.upload),
      // TODO; add the extension conditionally for forms that don't require it
      // EnterKeyExtension(onEnterKeyPress),
    ];

    if (dragDropEnabled) extensions.push(DragAndDrop(setHideDragHandleFunction));

    return extensions;
  }, [dragDropEnabled, fileHandler.upload]);

  return (
    <EditorWrapper {...props} extensions={getExtensions()} hideDragHandleOnMouseLeave={hideDragHandleOnMouseLeave}>
      {(editor) => <>{editor && <EditorBubbleMenu editor={editor} />}</>}
    </EditorWrapper>
  );
};

const RichTextEditorWithRef = forwardRef<EditorRefApi, IRichTextEditor>((props, ref) => (
  <RichTextEditor {...props} forwardedRef={ref as React.MutableRefObject<EditorRefApi | null>} />
));

RichTextEditorWithRef.displayName = "RichTextEditorWithRef";

export { RichTextEditorWithRef };
