import { forwardRef, MutableRefObject } from "react";
// components
import { PageRenderer } from "@/components/editors";
// constants
import { DEFAULT_DISPLAY_CONFIG } from "@/constants/config";
// extensions
import { IssueWidget } from "@/extensions";
// helpers
import { getEditorClassNames } from "@/helpers/common";
// hooks
import { useReadOnlyEditor } from "@/hooks/use-read-only-editor";
// plane web types
import { TEmbedConfig } from "@/plane-editor/types";
// types
import { EditorReadOnlyRefApi, IMentionHighlight, TDisplayConfig } from "@/types";

interface IDocumentReadOnlyEditor {
  id: string;
  initialValue: string;
  containerClassName: string;
  displayConfig?: TDisplayConfig;
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
    displayConfig = DEFAULT_DISPLAY_CONFIG,
    editorClassName = "",
    embedHandler,
    id,
    initialValue,
    forwardedRef,
    tabIndex,
    handleEditorReady,
    mentionHandler,
  } = props;
  const editor = useReadOnlyEditor({
    editorClassName,
    extensions: [
      embedHandler?.issue &&
        IssueWidget({
          widgetCallback: embedHandler?.issue.widgetCallback,
        }),
    ],
    forwardedRef,
    handleEditorReady,
    initialValue,
    mentionHandler,
  });

  if (!editor) {
    return null;
  }

  const editorContainerClassName = getEditorClassNames({
    containerClassName,
  });

  return (
    <PageRenderer
      displayConfig={displayConfig}
      editor={editor}
      editorContainerClassName={editorContainerClassName}
      id={id}
      tabIndex={tabIndex}
    />
  );
};

const DocumentReadOnlyEditorWithRef = forwardRef<EditorReadOnlyRefApi, IDocumentReadOnlyEditor>((props, ref) => (
  <DocumentReadOnlyEditor {...props} forwardedRef={ref as MutableRefObject<EditorReadOnlyRefApi | null>} />
));

DocumentReadOnlyEditorWithRef.displayName = "DocumentReadOnlyEditorWithRef";

export { DocumentReadOnlyEditorWithRef };
