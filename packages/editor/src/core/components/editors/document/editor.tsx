import React from "react";
// components
import { PageRenderer } from "@/components/editors";
// helpers
import { getEditorClassNames } from "@/helpers/common";
// hooks
import { useDocumentEditor } from "@/hooks/use-document-editor";
import { TFileHandler } from "@/hooks/use-editor";
// plane editor types
import { TEmbedConfig } from "@/plane-editor/types";
// types
import { EditorRefApi, IMentionHighlight, IMentionSuggestion, TExtensions } from "@/types";

interface IDocumentEditor {
  containerClassName?: string;
  disabledExtensions?: TExtensions[];
  editorClassName?: string;
  embedHandler: TEmbedConfig;
  fileHandler: TFileHandler;
  forwardedRef?: React.MutableRefObject<EditorRefApi | null>;
  handleEditorReady?: (value: boolean) => void;
  id: string;
  mentionHandler: {
    highlights: () => Promise<IMentionHighlight[]>;
    suggestions: () => Promise<IMentionSuggestion[]>;
  };
  onChange: (updates: Uint8Array) => void;
  placeholder?: string | ((isFocused: boolean, value: string) => string);
  tabIndex?: number;
  value: Uint8Array;
}

const DocumentEditor = (props: IDocumentEditor) => {
  const {
    containerClassName,
    disabledExtensions,
    editorClassName = "",
    embedHandler,
    fileHandler,
    forwardedRef,
    handleEditorReady,
    id,
    mentionHandler,
    onChange,
    placeholder,
    tabIndex,
    value,
  } = props;

  // use document editor
  const { editor, isIndexedDbSynced } = useDocumentEditor({
    disabledExtensions,
    id,
    editorClassName,
    embedHandler,
    fileHandler,
    value,
    onChange,
    handleEditorReady,
    forwardedRef,
    mentionHandler,
    placeholder,
    tabIndex,
  });

  const editorContainerClassNames = getEditorClassNames({
    noBorder: true,
    borderOnFocus: false,
    containerClassName,
  });

  if (!editor || !isIndexedDbSynced) return null;

  return (
    <PageRenderer editor={editor} editorContainerClassName={editorContainerClassNames} id={id} tabIndex={tabIndex} />
  );
};

const DocumentEditorWithRef = React.forwardRef<EditorRefApi, IDocumentEditor>((props, ref) => (
  <DocumentEditor {...props} forwardedRef={ref as React.MutableRefObject<EditorRefApi | null>} />
));

DocumentEditorWithRef.displayName = "DocumentEditorWithRef";

export { DocumentEditorWithRef };
