import { forwardRef, useCallback } from "react";
// components
import { EditorWrapper } from "@/components/editors";
import { EditorBubbleMenu } from "@/components/menus";
// extensions
import { SideMenuExtension, SlashCommand } from "@/extensions";
// types
import { EditorRefApi, IRichTextEditor } from "@/types";

const RichTextEditor = (props: IRichTextEditor) => {
  const { dragDropEnabled } = props;

  const getExtensions = useCallback(() => {
    const extensions = [SlashCommand()];

    extensions.push(
      SideMenuExtension({
        aiEnabled: false,
        dragDropEnabled: !!dragDropEnabled,
      })
    );

    return extensions;
  }, [dragDropEnabled]);

  return (
    <EditorWrapper {...props} extensions={getExtensions()}>
      {(editor) => <>{editor && <EditorBubbleMenu editor={editor} />}</>}
    </EditorWrapper>
  );
};

const RichTextEditorWithRef = forwardRef<EditorRefApi, IRichTextEditor>((props, ref) => (
  <RichTextEditor {...props} forwardedRef={ref as React.MutableRefObject<EditorRefApi | null>} />
));

RichTextEditorWithRef.displayName = "RichTextEditorWithRef";

export { RichTextEditorWithRef };
