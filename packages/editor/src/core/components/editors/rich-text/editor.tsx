import { forwardRef, useCallback } from "react";
// components
import { EditorWrapper } from "@/components/editors";
import { EditorBubbleMenu } from "@/components/menus";
// extensions
import { SideMenuExtension } from "@/extensions";
// plane editor imports
import { RichTextEditorAdditionalExtensions } from "@/plane-editor/extensions/rich-text/extensions";
// types
import { EditorRefApi, IRichTextEditor } from "@/types";

const RichTextEditor = (props: IRichTextEditor) => {
  const {
    disabledExtensions,
    dragDropEnabled,
    fileHandler,
    bubbleMenuEnabled = true,
    extensions: externalExtensions = [],
    isSmoothCursorEnabled,
  } = props;

  const getExtensions = useCallback(() => {
    const extensions = [
      ...externalExtensions,
      SideMenuExtension({
        aiEnabled: false,
        dragDropEnabled: !!dragDropEnabled,
      }),
      ...RichTextEditorAdditionalExtensions({
        disabledExtensions,
        fileHandler,
      }),
    ];

    return extensions;
  }, [dragDropEnabled, disabledExtensions, externalExtensions, fileHandler]);

  return (
    <EditorWrapper {...props} extensions={getExtensions()} isSmoothCursorEnabled={isSmoothCursorEnabled}>
      {(editor) => <>{editor && bubbleMenuEnabled && <EditorBubbleMenu editor={editor} />}</>}
    </EditorWrapper>
  );
};

const RichTextEditorWithRef = forwardRef<EditorRefApi, IRichTextEditor>((props, ref) => (
  <RichTextEditor {...props} forwardedRef={ref as React.MutableRefObject<EditorRefApi | null>} />
));

RichTextEditorWithRef.displayName = "RichTextEditorWithRef";

export { RichTextEditorWithRef };
