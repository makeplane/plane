import { Extensions } from "@tiptap/core";
import { forwardRef, MutableRefObject, useMemo } from "react";
// plane imports
import { cn } from "@plane/utils";
// components
import { PageRenderer } from "@/components/editors";
// constants
import { DEFAULT_DISPLAY_CONFIG } from "@/constants/config";
// extensions
import { HeadingListExtension, WorkItemEmbedExtension, SideMenuExtension } from "@/extensions";
// helpers
import { getEditorClassNames } from "@/helpers/common";
// hooks
import { useEditor } from "@/hooks/use-editor";
// plane editor extensions
import { DocumentEditorAdditionalExtensions } from "@/plane-editor/extensions";
// types
import { EditorRefApi, IDocumentEditorProps } from "@/types";

const DocumentEditor = (props: IDocumentEditorProps) => {
  const {
    bubbleMenuEnabled = false,
    containerClassName,
    disabledExtensions,
    displayConfig = DEFAULT_DISPLAY_CONFIG,
    editable,
    editorClassName = "",
    embedHandler,
    fileHandler,
    flaggedExtensions,
    forwardedRef,
    id,
    isTouchDevice,
    handleEditorReady,
    mentionHandler,
    onChange,
    user,
    value,
    // additional props
    extensionOptions,
    isSmoothCursorEnabled,
  } = props;
  const extensions: Extensions = useMemo(() => {
    const additionalExtensions: Extensions = [];
    if (embedHandler?.issue) {
      additionalExtensions.push(
        WorkItemEmbedExtension({
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
        flaggedExtensions,
        isEditable: editable,
        fileHandler,
        userDetails: user ?? {
          id: "",
          name: "",
          color: "",
        },
      })
    );
    return additionalExtensions;
  }, []);

  const editor = useEditor({
    disabledExtensions,
    editable,
    editorClassName,
    enableHistory: true,
    extensions,
    fileHandler,
    flaggedExtensions,
    forwardedRef,
    handleEditorReady,
    id,
    initialValue: value,
    mentionHandler,
    onChange,
    // additional props
    embedHandler,
    extensionOptions,
    isSmoothCursorEnabled,
  });

  const editorContainerClassName = getEditorClassNames({
    containerClassName,
  });

  if (!editor) return null;

  return (
    <PageRenderer
      bubbleMenuEnabled={bubbleMenuEnabled}
      displayConfig={displayConfig}
      editor={editor}
      editorContainerClassName={cn(editorContainerClassName, "document-editor")}
      id={id}
      flaggedExtensions={flaggedExtensions}
      disabledExtensions={disabledExtensions}
      isTouchDevice={!!isTouchDevice}
    />
  );
};

const DocumentEditorWithRef = forwardRef<EditorRefApi, IDocumentEditorProps>((props, ref) => (
  <DocumentEditor {...props} forwardedRef={ref as MutableRefObject<EditorRefApi | null>} />
));

DocumentEditorWithRef.displayName = "DocumentEditorWithRef";

export { DocumentEditorWithRef };
