import { Extensions } from "@tiptap/core";
import { forwardRef, MutableRefObject, useMemo } from "react";
// plane imports
import { cn } from "@plane/utils";
// components
import { PageRenderer } from "@/components/editors";
// constants
import { DEFAULT_DISPLAY_CONFIG } from "@/constants/config";
// extensions
import { HeadingListExtension, SideMenuExtension } from "@/extensions";
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
    extendedEditorProps,
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
  } = props;
  const extensions: Extensions = useMemo(() => {
    const additionalExtensions: Extensions = [];
    additionalExtensions.push(
      SideMenuExtension({
        aiEnabled: !disabledExtensions?.includes("ai"),
        dragDropEnabled: true,
      }),
      HeadingListExtension,
      ...DocumentEditorAdditionalExtensions({
        disabledExtensions,
        extendedEditorProps,
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
    extendedEditorProps,
    extensions,
    fileHandler,
    flaggedExtensions,
    forwardedRef,
    handleEditorReady,
    id,
    initialValue: value,
    mentionHandler,
    onChange,
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
