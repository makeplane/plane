import { Editor } from "@tiptap/react"
import { Lock, ArchiveIcon, MenuSquare } from "lucide-react"
import { useRef, useState } from "react"
import { usePopper } from "react-popper"
import { IMarking, UploadImage } from ".."
import { FixedMenu } from "../menu"
import { DocumentDetails } from "../types/editor-types"
import { AlertLabel } from "./alert-label"
import { ContentBrowser } from "./content-browser"
import { IVerticalDropdownItemProps, VerticalDropdownMenu } from "./vertical-dropdown-menu"

interface IEditorHeader {
  editor: Editor,
  KanbanMenuOptions: IVerticalDropdownItemProps[],
  sidePeakVisible: boolean,
  setSidePeakVisible: (currentState: boolean) => void,
  markings: IMarking[],
  isLocked: boolean,
  isArchived: boolean,
  archivedAt?: Date,
  readonly: boolean,
  uploadFile?: UploadImage,
  setIsSubmitting?: (isSubmitting: "submitting" | "submitted" | "saved") => void,
  documentDetails: DocumentDetails
}

export const EditorHeader = ({ documentDetails, archivedAt, editor, sidePeakVisible, readonly, setSidePeakVisible, markings, uploadFile, setIsSubmitting, KanbanMenuOptions, isArchived, isLocked }: IEditorHeader) => {

  const summaryMenuRef = useRef(null);
  const summaryButtonRef = useRef(null);
  const [summaryPopoverVisible, setSummaryPopoverVisible] = useState(false);

  const { styles: summaryPopoverStyles, attributes: summaryPopoverAttributes } = usePopper(summaryButtonRef.current, summaryMenuRef.current, {
    placement: "bottom-start"
  })

  return (

    <div className="border-custom-border self-stretch flex flex-col border-b border-solid max-md:max-w-full">
      <div
        className="self-center flex ml-0 w-full items-start justify-between gap-5 max-md:max-w-full max-md:flex-wrap max-md:justify-center">
        <div className={"flex flex-row items-center"}>
          <div
            onMouseEnter={() => setSummaryPopoverVisible(true)}
            onMouseLeave={() => setSummaryPopoverVisible(false)}
          >
            <button
              ref={summaryButtonRef}
              className={"p-2 text-custom-text-300 hover:bg-custom-primary-100/5 active:bg-custom-primary-100/5 transition-colors"}
              onClick={() => {
                setSidePeakVisible(!sidePeakVisible)
                setSummaryPopoverVisible(false)
              }}
            >
              <MenuSquare
                size={20}
              />
            </button>
            {summaryPopoverVisible &&
              <div style={summaryPopoverStyles.popper} {...summaryPopoverAttributes.popper} className="z-10 h-[300px] w-[300px] ml-[40px] mt-[40px] shadow-xl rounded border-custom-border border-solid border-2 bg-custom-background-100 border-b pl-3 pr-3 pb-3 overflow-scroll">
                <ContentBrowser editor={editor} markings={markings} />
              </div>
            }
          </div>
          {isLocked && <AlertLabel Icon={Lock} backgroundColor={"bg-red-200"} label={"Locked"} />}
          {(isArchived && archivedAt) && <AlertLabel Icon={ArchiveIcon} backgroundColor={"bg-blue-200"} label={`Archived at ${new Date(archivedAt).toLocaleString()}`} />}
        </div>

        {(!readonly && uploadFile) && <FixedMenu editor={editor} uploadFile={uploadFile} setIsSubmitting={setIsSubmitting} />}
        <div className="self-center flex items-start gap-3 my-auto max-md:justify-center"
        >
          {!isArchived && <p className="text-sm text-custom-text-300">{`Last updated at ${new Date(documentDetails.last_updated_at).toLocaleString()}`}</p>}
          <VerticalDropdownMenu items={KanbanMenuOptions} />
        </div>
      </div>
    </div>
  )

}
