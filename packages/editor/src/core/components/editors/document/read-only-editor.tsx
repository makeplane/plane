import { forwardRef, MutableRefObject } from "react";
// components
import { PageRenderer } from "@/components/editors";
// helpers
import { getEditorClassNames } from "@/helpers/common";
// hooks
import { useReadOnlyEditor } from "@/hooks/use-read-only-editor";
// plane editor extensions
import { IssueWidget } from "@/plane-editor/extensions";
// types
import { EditorReadOnlyRefApi, IMentionHighlight } from "@/types";

interface IDocumentReadOnlyEditor {
  initialValue: string;
  containerClassName: string;
  editorClassName?: string;
  tabIndex?: number;
  handleEditorReady?: (value: boolean) => void;
  mentionHandler: {
    highlights: () => Promise<IMentionHighlight[]>;
  };
  forwardedRef?: React.MutableRefObject<EditorReadOnlyRefApi | null>;
}

const DocumentReadOnlyEditor = (props: IDocumentReadOnlyEditor) => {
  const {
    containerClassName,
    editorClassName = "",
    initialValue,
    forwardedRef,
    tabIndex,
    handleEditorReady,
    mentionHandler,
  } = props;
  const editor = useReadOnlyEditor({
    initialValue,
    editorClassName,
    mentionHandler,
    forwardedRef,
    handleEditorReady,
    extensions: [IssueWidget],
  });

  if (!editor) {
    return null;
  }

  const editorContainerClassName = getEditorClassNames({
    containerClassName,
  });

  return <PageRenderer tabIndex={tabIndex} editor={editor} editorContainerClassName={editorContainerClassName} />;
};

const DocumentReadOnlyEditorWithRef = forwardRef<EditorReadOnlyRefApi, IDocumentReadOnlyEditor>((props, ref) => (
  <DocumentReadOnlyEditor {...props} forwardedRef={ref as MutableRefObject<EditorReadOnlyRefApi | null>} />
));

DocumentReadOnlyEditorWithRef.displayName = "DocumentReadOnlyEditorWithRef";

export { DocumentReadOnlyEditorWithRef };
