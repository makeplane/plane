import { forwardRef, MutableRefObject } from "react";
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
  initialValue: string;
  customClassName: string;
  tabIndex?: number;
  title: string;
  handleEditorReady?: (value: boolean) => void;
  mentionHandler: {
    highlights: () => Promise<IMentionHighlight[]>;
  };
  forwardedRef?: React.MutableRefObject<EditorReadOnlyRefApi | null>;
}

const DocumentReadOnlyEditor = (props: IDocumentReadOnlyEditor) => {
  const { customClassName, initialValue, title, forwardedRef, tabIndex, handleEditorReady, mentionHandler } = props;
  const editor = useReadOnlyEditor({
    initialValue,
    mentionHandler,
    forwardedRef,
    handleEditorReady,
    extensions: [IssueWidgetPlaceholder()],
  });

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
