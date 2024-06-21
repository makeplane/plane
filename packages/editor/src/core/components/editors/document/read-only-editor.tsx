import { forwardRef, MutableRefObject } from "react";
// components
import { PageRenderer } from "@/components/editors";
// extensions
import { IssueWidget } from "@/extensions";
// helpers
import { getEditorClassNames } from "@/helpers/common";
// hooks
import { useReadOnlyEditor } from "@/hooks/use-read-only-editor";
// plane web types
import { TEmbedConfig } from "@/plane-editor/types";
// types
import { EditorReadOnlyRefApi, IMentionHighlight } from "@/types";

interface IDocumentReadOnlyEditor {
  initialValue: string;
  containerClassName: string;
  editorClassName?: string;
  embedHandler: TEmbedConfig;
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
    embedHandler,
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
    extensions: [
      embedHandler?.issue &&
        IssueWidget({
          widgetCallback: embedHandler?.issue.widgetCallback,
        }),
    ],
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
