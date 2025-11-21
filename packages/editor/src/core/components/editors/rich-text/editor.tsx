import { forwardRef, useCallback } from "react";
// components
import { EditorWrapper } from "@/components/editors";
import { BlockMenu, EditorBubbleMenu } from "@/components/menus";
// extensions
import { SideMenuExtension } from "@/extensions";
// plane editor imports
import { RichTextEditorAdditionalExtensions } from "@/plane-editor/extensions/rich-text-extensions";
// types
import type { EditorRefApi, IRichTextEditorProps } from "@/types";

function RichTextEditor(props: IRichTextEditorProps) {
  const {
    bubbleMenuEnabled = true,
    disabledExtensions,
    dragDropEnabled,
    extensions: externalExtensions = [],
    fileHandler,
    flaggedExtensions,
    extendedEditorProps,
    workItemIdentifier,
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
          {editor && bubbleMenuEnabled && (
            <EditorBubbleMenu
              disabledExtensions={disabledExtensions}
              editor={editor}
              extendedEditorProps={extendedEditorProps}
              flaggedExtensions={flaggedExtensions}
            />
          )}
          <BlockMenu
            editor={editor}
            flaggedExtensions={flaggedExtensions}
            disabledExtensions={disabledExtensions}
            workItemIdentifier={workItemIdentifier}
          />
        </>
      )}
    </EditorWrapper>
  );
}

const RichTextEditorWithRef = forwardRef(function RichTextEditorWithRef(
  props: IRichTextEditorProps,
  ref: React.ForwardedRef<EditorRefApi>
) {
  return <RichTextEditor {...props} forwardedRef={ref as React.MutableRefObject<EditorRefApi | null>} />;
});

RichTextEditorWithRef.displayName = "RichTextEditorWithRef";

export { RichTextEditorWithRef };
