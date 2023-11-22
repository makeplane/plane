import { cn, getEditorClassNames, useReadOnlyEditor } from "@plane/editor-core";
import { useRouter } from "next/router";
import { useState, forwardRef, useEffect } from "react";
import { EditorHeader } from "../components/editor-header";
import { PageRenderer } from "../components/page-renderer";
import { SummarySideBar } from "../components/summary-side-bar";
import { useEditorMarkings } from "../hooks/use-editor-markings";
import { DocumentDetails } from "../types/editor-types";
import {
  IPageArchiveConfig,
  IPageLockConfig,
  IDuplicationConfig,
} from "../types/menu-actions";
import { getMenuOptions } from "../utils/menu-options";

interface IDocumentReadOnlyEditor {
  value: string;
  noBorder: boolean;
  borderOnFocus: boolean;
  customClassName: string;
  documentDetails: DocumentDetails;
  pageLockConfig?: IPageLockConfig;
  pageArchiveConfig?: IPageArchiveConfig;
  pageDuplicationConfig?: IDuplicationConfig;
}

interface DocumentReadOnlyEditorProps extends IDocumentReadOnlyEditor {
  forwardedRef?: React.Ref<EditorHandle>;
}

interface EditorHandle {
  clearEditor: () => void;
  setEditorValue: (content: string) => void;
}

const DocumentReadOnlyEditor = ({
  noBorder,
  borderOnFocus,
  customClassName,
  value,
  documentDetails,
  forwardedRef,
  pageDuplicationConfig,
  pageLockConfig,
  pageArchiveConfig,
}: DocumentReadOnlyEditorProps) => {
  const router = useRouter();
  const [sidePeekVisible, setSidePeekVisible] = useState(true);
  const { markings, updateMarkings } = useEditorMarkings();

  const editor = useReadOnlyEditor({
    value,
    forwardedRef,
  });

  useEffect(() => {
    if (editor) {
      updateMarkings(editor.getJSON());
    }
  }, [editor?.getJSON()]);

  if (!editor) {
    return null;
  }

  const editorClassNames = getEditorClassNames({
    noBorder,
    borderOnFocus,
    customClassName,
  });

  const KanbanMenuOptions = getMenuOptions({
    editor: editor,
    router: router,
    pageArchiveConfig: pageArchiveConfig,
    pageLockConfig: pageLockConfig,
    duplicationConfig: pageDuplicationConfig,
  });

  return (
    <div className="h-full w-full flex flex-col overflow-hidden">
      <EditorHeader
        isLocked={!pageLockConfig ? false : pageLockConfig.is_locked}
        isArchived={!pageArchiveConfig ? false : pageArchiveConfig.is_archived}
        readonly={true}
        editor={editor}
        sidePeekVisible={sidePeekVisible}
        setSidePeekVisible={setSidePeekVisible}
        KanbanMenuOptions={KanbanMenuOptions}
        markings={markings}
        documentDetails={documentDetails}
        archivedAt={pageArchiveConfig && pageArchiveConfig.archived_at}
      />
      <div className="h-full w-full flex overflow-hidden">
        <div className="flex-shrink-0 h-full w-56 lg:w-80">
          <SummarySideBar
            editor={editor}
            markings={markings}
            sidePeekVisible={sidePeekVisible}
          />
        </div>
        <div className="h-full w-full">
          <PageRenderer
            editor={editor}
            editorClassNames={editorClassNames}
            documentDetails={documentDetails}
          />
        </div>
        <div className="hidden lg:block flex-shrink-0 w-56 lg:w-80" />
      </div>
    </div>
  );
};

const DocumentReadOnlyEditorWithRef = forwardRef<
  EditorHandle,
  IDocumentReadOnlyEditor
>((props, ref) => <DocumentReadOnlyEditor {...props} forwardedRef={ref} />);

DocumentReadOnlyEditorWithRef.displayName = "DocumentReadOnlyEditorWithRef";

export { DocumentReadOnlyEditor, DocumentReadOnlyEditorWithRef };
