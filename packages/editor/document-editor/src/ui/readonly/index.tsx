import { forwardRef, MutableRefObject, useEffect } from "react";
// hooks
import { useEditorMarkings } from "src/hooks/use-editor-markings";
import {
  EditorReadOnlyRefApi,
  getEditorClassNames,
  IMentionHighlight,
  useReadOnlyEditor,
} from "@plane/editor-document-core";
// components
import { PageRenderer } from "src/ui/components/page-renderer";
import { IssueWidgetPlaceholder } from "../extensions/widgets/issue-embed-widget";

interface IDocumentReadOnlyEditor {
  value: string;
  updatedValue?: string;
  customClassName: string;
  tabIndex?: number;
  title: string;
  handleEditorReady?: (value: boolean) => void;
  mentionHighlights?: () => Promise<IMentionHighlight[]>;

  forwardedRef?: React.MutableRefObject<EditorReadOnlyRefApi | null>;
}

const DocumentReadOnlyEditor = (props: IDocumentReadOnlyEditor) => {
  const {
    customClassName,
    value,
    updatedValue = "",
    title,
    forwardedRef,
    tabIndex,
    handleEditorReady,
    mentionHighlights,
  } = props;
  const { updateMarkings } = useEditorMarkings();

  const editor = useReadOnlyEditor({
    value,
    updatedValue,
    mentionHighlights,
    forwardedRef,
    handleEditorReady,
    extensions: [IssueWidgetPlaceholder()],
  });

  useEffect(() => {
    if (editor) {
      updateMarkings(editor.getHTML());
    }
  }, [editor, updateMarkings]);

  if (!editor) {
    return null;
  }

  const editorClassNames = getEditorClassNames({
    customClassName,
  });

  return (
    <PageRenderer
      tabIndex={tabIndex}
      updatePageTitle={() => Promise.resolve()}
      readonly
      editor={editor}
      editorClassNames={editorClassNames}
      title={title}
    />
  );
};

const DocumentReadOnlyEditorWithRef = forwardRef<EditorReadOnlyRefApi, IDocumentReadOnlyEditor>((props, ref) => (
  <DocumentReadOnlyEditor {...props} forwardedRef={ref as MutableRefObject<EditorReadOnlyRefApi | null>} />
));

DocumentReadOnlyEditorWithRef.displayName = "DocumentReadOnlyEditorWithRef";

export { DocumentReadOnlyEditor, DocumentReadOnlyEditorWithRef };
