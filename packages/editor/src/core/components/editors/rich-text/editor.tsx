import { forwardRef, useCallback } from "react";
// components
import { EditorWrapper } from "@/components/editors";
import { EditorBubbleMenu } from "@/components/menus";
// extensions
import { SideMenuExtension, SlashCommands } from "@/extensions";
// types
import { EditorRefApi, IRichTextEditor } from "@/types";

const RichTextEditor = (props: IRichTextEditor) => {
  const { disabledExtensions, dragDropEnabled, bubbleMenuEnabled = true, extensions: externalExtensions = [] } = props;

  const getExtensions = useCallback(() => {
    const extensions = [
      ...externalExtensions,
      SideMenuExtension({
        aiEnabled: false,
        dragDropEnabled: !!dragDropEnabled,
      }),
    ];
    if (!disabledExtensions?.includes("slash-commands")) {
      extensions.push(
        SlashCommands({
          disabledExtensions,
        })
      );
    }

    return extensions;
  }, [dragDropEnabled, disabledExtensions, externalExtensions]);

  return (
    <EditorWrapper {...props} extensions={getExtensions()}>
      {(editor) => <>{editor && bubbleMenuEnabled && <EditorBubbleMenu editor={editor} />}</>}
    </EditorWrapper>
  );
};

const RichTextEditorWithRef = forwardRef<EditorRefApi, IRichTextEditor>((props, ref) => (
  <RichTextEditor {...props} forwardedRef={ref as React.MutableRefObject<EditorRefApi | null>} />
));

RichTextEditorWithRef.displayName = "RichTextEditorWithRef";

export { RichTextEditorWithRef };
