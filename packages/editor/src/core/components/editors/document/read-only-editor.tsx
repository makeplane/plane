import { forwardRef, MutableRefObject } from "react";
// components
import { PageRenderer } from "@/components/editors";
// extensions
import { IssueWidget } from "@/extensions";
// helpers
import { getEditorClassNames } from "@/helpers/common";
// hooks
import { useReadOnlyCollaborativeEditor } from "@/hooks/use-read-only-collaborative-editor";
// types
import { EditorReadOnlyRefApi, IDocumentReadOnlyEditor } from "@/types";

const DocumentReadOnlyEditor = (props: IDocumentReadOnlyEditor) => {
  const {
    containerClassName,
    editorClassName = "",
    embedHandler,
    forwardedRef,
    handleEditorReady,
    id,
    mentionHandler,
    realtimeConfig,
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

  const { editor } = useReadOnlyCollaborativeEditor({
    editorClassName,
    extensions,
    forwardedRef,
    handleEditorReady,
    id,
    mentionHandler,
    realtimeConfig,
    user,
  });

  const editorContainerClassName = getEditorClassNames({
    containerClassName,
  });

  if (!editor) return null;
  return <PageRenderer editor={editor} editorContainerClassName={editorContainerClassName} />;
};

const DocumentReadOnlyEditorWithRef = forwardRef<EditorReadOnlyRefApi, IDocumentReadOnlyEditor>((props, ref) => (
  <DocumentReadOnlyEditor {...props} forwardedRef={ref as MutableRefObject<EditorReadOnlyRefApi | null>} />
));

DocumentReadOnlyEditorWithRef.displayName = "DocumentReadOnlyEditorWithRef";

export { DocumentReadOnlyEditorWithRef };
