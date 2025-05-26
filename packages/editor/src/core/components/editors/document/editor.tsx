import { Extensions } from "@tiptap/core";
import { forwardRef, MutableRefObject, useMemo } from "react";
// components
import { PageRenderer } from "@/components/editors";
// constants
import { DEFAULT_DISPLAY_CONFIG } from "@/constants/config";
// extensions
import { HeadingListExtension, IssueWidget, SideMenuExtension } from "@/extensions";
// helpers
import { getEditorClassNames } from "@/helpers/common";
// hooks
import { useEditor } from "@/hooks/use-editor";
// plane editor extensions
import { DocumentEditorAdditionalExtensions } from "@/plane-editor/extensions";
// types
import { EditorRefApi, IDocumentEditor } from "@/types";

const DocumentEditor = (props: IDocumentEditor) => {
  const {
    containerClassName,
    disabledExtensions,
    displayConfig = DEFAULT_DISPLAY_CONFIG,
    editorClassName = "",
    embedHandler,
    fileHandler,
    id,
    forwardedRef,
    handleEditorReady,
    initialValue,
    isSmoothCursorEnabled,
    mentionHandler,
    onChange,
    user,
  } = props;
  const extensions: Extensions = useMemo(() => {
    const additionalExtensions: Extensions = [];
    if (embedHandler?.issue) {
      additionalExtensions.push(
        IssueWidget({
          widgetCallback: embedHandler.issue.widgetCallback,
        })
      );
    }
    additionalExtensions.push(
      SideMenuExtension({
        aiEnabled: !disabledExtensions?.includes("ai"),
        dragDropEnabled: true,
      }),
      HeadingListExtension,
      ...DocumentEditorAdditionalExtensions({
        disabledExtensions,
        embedConfig: embedHandler,
        userDetails: user,
      })
    );
    return additionalExtensions;
  }, []);

  const editor = useEditor({
    disabledExtensions,
    editable: true,
    editorClassName,
    enableHistory: true,
    extensions,
    fileHandler,
    forwardedRef,
    handleEditorReady,
    initialValue,
    isSmoothCursorEnabled,
    mentionHandler,
    onChange,
  });

  const editorContainerClassName = getEditorClassNames({
    containerClassName,
  });

  if (!editor) return null;

  return (
    <PageRenderer
      bubbleMenuEnabled={false}
      displayConfig={displayConfig}
      editor={editor}
      editorContainerClassName={editorContainerClassName}
      id={id}
    />
  );
};

const DocumentEditorWithRef = forwardRef<EditorRefApi, IDocumentEditor>((props, ref) => (
  <DocumentEditor {...props} forwardedRef={ref as MutableRefObject<EditorRefApi | null>} />
));

DocumentEditorWithRef.displayName = "DocumentEditorWithRef";

export { DocumentEditorWithRef };
