import { forwardRef, useCallback } from "react";
// components
import { EditorWrapper } from "@/components/editors";
import { BlockMenu, EditorBubbleMenu } from "@/components/menus";
// extensions
import { SideMenuExtension } from "@/extensions";
// plane editor imports
import { RichTextEditorAdditionalExtensions } from "@/plane-editor/extensions/rich-text-extensions";
// types
import { EditorRefApi, IRichTextEditorProps } from "@/types";

const RichTextEditor: React.FC<IRichTextEditorProps> = (props) => {
  const {
    bubbleMenuEnabled = true,
    disabledExtensions,
    dragDropEnabled,
    extensions: externalExtensions = [],
    fileHandler,
    flaggedExtensions,
    extendedEditorProps,
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
        flaggedExtensions,
        extendedEditorProps,
      }),
    ];

    return extensions;
  }, [dragDropEnabled, disabledExtensions, externalExtensions, fileHandler, flaggedExtensions, extendedEditorProps]);

  return (
    <EditorWrapper {...props} extensions={getExtensions()}>
      {(editor) => (
        <>
          {editor && bubbleMenuEnabled && <EditorBubbleMenu editor={editor} />}
          <BlockMenu editor={editor} flaggedExtensions={flaggedExtensions} disabledExtensions={disabledExtensions} />
        </>
      )}
    </EditorWrapper>
  );
};

const RichTextEditorWithRef = forwardRef<EditorRefApi, IRichTextEditorProps>((props, ref) => (
  <RichTextEditor {...props} forwardedRef={ref as React.MutableRefObject<EditorRefApi | null>} />
));

RichTextEditorWithRef.displayName = "RichTextEditorWithRef";

export { RichTextEditorWithRef };
