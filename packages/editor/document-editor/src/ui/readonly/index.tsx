import { forwardRef, MutableRefObject } from "react";
import { EditorReadOnlyRefApi, getEditorClassNames, IMentionHighlight, useReadOnlyEditor } from "@plane/editor-core";
// components
import { PageRenderer } from "src/ui/components/page-renderer";
import { IssueWidget, TReadOnlyEmbedConfig } from "src/ui/extensions";

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
  embedHandler?: TReadOnlyEmbedConfig;
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
    embedHandler,
  } = props;
  const editor = useReadOnlyEditor({
    initialValue,
    editorClassName,
    mentionHandler,
    forwardedRef,
    handleEditorReady,
    extensions: embedHandler?.issue
      ? [
          IssueWidget({
            widgetCallback: embedHandler?.issue?.widgetCallback,
          }).configure({
            issueEmbedConfig: embedHandler?.issue,
          }),
        ]
      : [],
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

export { DocumentReadOnlyEditor, DocumentReadOnlyEditorWithRef };
