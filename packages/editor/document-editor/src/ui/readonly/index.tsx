import { cn, getEditorClassNames, useReadOnlyEditor } from "@plane/editor-core"
import { useRouter } from "next/router";
import { useState, forwardRef, useEffect } from 'react'
import { EditorHeader } from "../components/editor-header";
import { PageRenderer } from "../components/page-renderer";
import { SummarySideBar } from "../components/summary-side-bar";
import { useEditorMarkings } from "../hooks/use-editor-markings";
import { DocumentDetails } from "../types/editor-types";
import { IPageArchiveConfig, IPageLockConfig, IDuplicationConfig } from "../types/menu-actions";
import { getMenuOptions } from "../utils/menu-options";

interface IDocumentReadOnlyEditor {
  value: string,
  noBorder: boolean,
  borderOnFocus: boolean,
  customClassName: string,
  documentDetails: DocumentDetails,
  pageLockConfig?: IPageLockConfig,
  pageArchiveConfig?: IPageArchiveConfig,
  pageDuplicationConfig?: IDuplicationConfig,
}

interface DocumentReadOnlyEditorProps extends IDocumentReadOnlyEditor {
  forwardedRef?: React.Ref<EditorHandle>
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

  const router = useRouter()
  const [sidePeakVisible, setSidePeakVisible] = useState(true)
  const { markings, updateMarkings } = useEditorMarkings()

  const editor = useReadOnlyEditor({
    value,
    forwardedRef,
  })


  useEffect(() => {
    if (editor) {
      updateMarkings(editor.getJSON())
    }
  }, [editor?.getJSON()])

  if (!editor) {
    return null
  }

  const editorClassNames = getEditorClassNames({
    noBorder,
    borderOnFocus,
    customClassName
  })

  const KanbanMenuOptions = getMenuOptions({
    editor: editor,
    router: router,
    pageArchiveConfig: pageArchiveConfig,
    pageLockConfig: pageLockConfig,
    duplicationConfig: pageDuplicationConfig,
  })

  return (
    <div className="flex flex-col">
      <div className="top-0 sticky z-10 bg-custom-background-100">
        <EditorHeader
          isLocked={!pageLockConfig ? false : pageLockConfig.is_locked}
          isArchived={!pageArchiveConfig ? false : pageArchiveConfig.is_archived}
          readonly={true}
          editor={editor}
          sidePeakVisible={sidePeakVisible}
          setSidePeakVisible={setSidePeakVisible}
          KanbanMenuOptions={KanbanMenuOptions}
          markings={markings}
          documentDetails={documentDetails}
					archivedAt={pageArchiveConfig && pageArchiveConfig.archived_at}
        />
      </div>
      <div className="self-center items-stretch w-full max-md:max-w-full overflow-y-hidden">
        <div className={cn("gap-5 flex max-md:flex-col max-md:items-stretch max-md:gap-0 overflow-y-hidden", { "justify-center": !sidePeakVisible })}>
          <SummarySideBar
            editor={editor}
            markings={markings}
            sidePeakVisible={sidePeakVisible}
          />
          <PageRenderer
            editor={editor}
            editorClassNames={editorClassNames}
            sidePeakVisible={sidePeakVisible}
            documentDetails={documentDetails}
          />
        </div>
      </div>
    </div>
  )
}


const DocumentReadOnlyEditorWithRef = forwardRef<
  EditorHandle,
  IDocumentReadOnlyEditor
>((props, ref) => <DocumentReadOnlyEditor {...props} forwardedRef={ref} />);

DocumentReadOnlyEditorWithRef.displayName = "DocumentReadOnlyEditorWithRef";

export { DocumentReadOnlyEditor, DocumentReadOnlyEditorWithRef } 
