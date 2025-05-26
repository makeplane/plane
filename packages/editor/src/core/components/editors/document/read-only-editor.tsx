import { Extensions } from "@tiptap/core";
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
// plane editor extensions
import { PageEmbedReadOnlyExtension } from "@/plane-editor/extensions";
// plane web types
import { TReadOnlyEmbedConfig } from "@/plane-editor/types";
// types
import {
  EditorReadOnlyRefApi,
  TDisplayConfig,
  TExtensions,
  TReadOnlyFileHandler,
  TReadOnlyMentionHandler,
} from "@/types";

interface IDocumentReadOnlyEditor {
  disabledExtensions: TExtensions[];
  id: string;
  initialValue: string;
  containerClassName: string;
  displayConfig?: TDisplayConfig;
  editorClassName?: string;
  embedHandler: TReadOnlyEmbedConfig;
  fileHandler: TReadOnlyFileHandler;
  tabIndex?: number;
  handleEditorReady?: (value: boolean) => void;
  mentionHandler: TReadOnlyMentionHandler;
  forwardedRef?: React.MutableRefObject<EditorReadOnlyRefApi | null>;
}

const DocumentReadOnlyEditor = (props: IDocumentReadOnlyEditor) => {
  const {
    containerClassName,
    disabledExtensions,
    displayConfig = DEFAULT_DISPLAY_CONFIG,
    editorClassName = "",
    embedHandler,
    fileHandler,
    id,
    forwardedRef,
    handleEditorReady,
    initialValue,
    mentionHandler,
  } = props;
  const extensions: Extensions = [];
  if (embedHandler?.issue) {
    extensions.push(
      IssueWidget({
        widgetCallback: embedHandler.issue.widgetCallback,
      })
    );
  }

  if (embedHandler?.page) {
    extensions.push(
      PageEmbedReadOnlyExtension({
        widgetCallback: embedHandler.page.widgetCallback,
      })
    );
  }

  const editor = useReadOnlyEditor({
    disabledExtensions,
    editorClassName,
    extensions,
    fileHandler,
    forwardedRef,
    handleEditorReady,
    initialValue,
    mentionHandler,
  });

  const editorContainerClassName = getEditorClassNames({
    containerClassName,
  });

  if (!editor) return null;

  return (
    <PageRenderer
      bubbleMenuEnabled={false}
      displayConfig={displayConfig}
      editor={editor}
      editorContainerClassName={editorContainerClassName}
      id={id}
    />
  );
};

const DocumentReadOnlyEditorWithRef = forwardRef<EditorReadOnlyRefApi, IDocumentReadOnlyEditor>((props, ref) => (
  <DocumentReadOnlyEditor {...props} forwardedRef={ref as MutableRefObject<EditorReadOnlyRefApi | null>} />
));

DocumentReadOnlyEditorWithRef.displayName = "DocumentReadOnlyEditorWithRef";

export { DocumentReadOnlyEditorWithRef };
