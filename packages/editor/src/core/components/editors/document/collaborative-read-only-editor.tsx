import { forwardRef, MutableRefObject } from "react";
// components
import { DocumentContentLoader, PageRenderer } from "@/components/editors";
// constants
import { DEFAULT_DISPLAY_CONFIG } from "@/constants/config";
// extensions
import { IssueWidget } from "@/extensions";
// helpers
import { getEditorClassNames } from "@/helpers/common";
// hooks
import { useReadOnlyCollaborativeEditor } from "@/hooks/use-read-only-collaborative-editor";
// types
import { EditorReadOnlyRefApi, ICollaborativeDocumentReadOnlyEditor } from "@/types";

const CollaborativeDocumentReadOnlyEditor = (props: ICollaborativeDocumentReadOnlyEditor) => {
  const {
    containerClassName,
    disabledExtensions,
    displayConfig = DEFAULT_DISPLAY_CONFIG,
    editorClassName = "",
    embedHandler,
    fileHandler,
    forwardedRef,
    handleEditorReady,
    id,
    mentionHandler,
    realtimeConfig,
    serverHandler,
    user,
  } = props;
  const extensions = [];
  if (embedHandler?.issue) {
    extensions.push(
      IssueWidget({
        widgetCallback: embedHandler.issue.widgetCallback,
      })
    );
  }

  const { editor, hasServerConnectionFailed, hasServerSynced } = useReadOnlyCollaborativeEditor({
    disabledExtensions,
    editorClassName,
    extensions,
    fileHandler,
    forwardedRef,
    handleEditorReady,
    id,
    mentionHandler,
    realtimeConfig,
    serverHandler,
    user,
  });

  const editorContainerClassName = getEditorClassNames({
    containerClassName,
  });

  if (!editor) return null;

  if (!hasServerSynced && !hasServerConnectionFailed) return <DocumentContentLoader />;

  return (
    <PageRenderer
      displayConfig={displayConfig}
      id={id}
      editor={editor}
      editorContainerClassName={editorContainerClassName}
    />
  );
};

const CollaborativeDocumentReadOnlyEditorWithRef = forwardRef<
  EditorReadOnlyRefApi,
  ICollaborativeDocumentReadOnlyEditor
>((props, ref) => (
  <CollaborativeDocumentReadOnlyEditor {...props} forwardedRef={ref as MutableRefObject<EditorReadOnlyRefApi | null>} />
));

CollaborativeDocumentReadOnlyEditorWithRef.displayName = "CollaborativeDocumentReadOnlyEditorWithRef";

export { CollaborativeDocumentReadOnlyEditorWithRef };
