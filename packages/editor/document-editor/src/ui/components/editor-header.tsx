import { Editor } from "@tiptap/react"
import { AlertCircle, FileLineChart, MenuSquare, MoreVertical} from "lucide-react"
import { useRouter } from "next/router"
import { useRef, useState } from "react"
import { usePopper } from "react-popper"
import { IMarking, UploadImage } from ".."
import { FixedMenu } from "../menu"
import { IDuplicationConfig, IPageArchiveConfig, IPageLockConfig } from "../types/menu-actions"
import { getMenuOptions } from "../utils/menu-options"
import { ContentBrowser } from "./content-browser"
import { VerticalDropdownMenu } from "./vertical-dropdown-menu"

interface IEditorHeader {
  editor: Editor,
  duplicationConfig?: IDuplicationConfig,
  pageLockConfig?: IPageLockConfig,
  pageArchiveConfig?: IPageArchiveConfig,
  sidePeakVisible: boolean,
  setSidePeakVisible: (currentState: boolean) => void,
  markings: IMarking[],
  scrollSummary: (editor: Editor, marking: IMarking) => void,
  uploadFile: UploadImage,
  setIsSubmitting?: (isSubmitting: "submitting" | "submitted" | "saved") => void,
}

export const EditorHeader = ({ editor, duplicationConfig, pageLockConfig, pageArchiveConfig, sidePeakVisible, setSidePeakVisible, markings, scrollSummary, uploadFile, setIsSubmitting }: IEditorHeader) => {

  const router = useRouter()

  const summaryMenuRef = useRef(null);
  const summaryButtonRef = useRef(null);
  const [summaryPopoverVisible, setSummaryPopoverVisible] = useState(false);


  const [menuItemVisible, setMenuItemVisible] = useState(false)
  const vericalIconRef = useRef(null);
  const verticalPopoverRef = useRef(null)


  const { styles: verticalPopoverStyles, attributes: verticalPopoverAttributes } = usePopper(vericalIconRef.current, verticalPopoverRef.current, {
    placement: "bottom-end",
    modifiers: [
      {
        name: 'offset',
        options: {
          offset: [0, -40],
        },
      },
    ],
  })

	const KanbanMenuOptions = getMenuOptions({
	  editor: editor,
		router: router,
		duplicationConfig: duplicationConfig,
		pageLockConfig: pageLockConfig,
		pageArchiveConfig: pageArchiveConfig
	})


  const { styles: summaryPopoverStyles, attributes: summaryPopoverAttributes } = usePopper(summaryButtonRef.current, summaryMenuRef.current, {
    placement: "bottom-start"
  })

  return (

    <div className="border-custom-border self-stretch flex flex-col border-b border-solid max-md:max-w-full">
      <div
        className="self-center flex ml-0 w-full items-start justify-between gap-5 max-md:max-w-full max-md:flex-wrap max-md:justify-center">
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
            <div style={summaryPopoverStyles.popper} {...summaryPopoverAttributes.popper} className="z-10 h-[300px] w-[300px] ml-[40px] mt-[50px] shadow-xl rounded border-custom-border border-solid border-2 bg-custom-background-100 border-b pl-3 pr-3 pb-3 overflow-scroll">
              <ContentBrowser editor={editor} markings={markings} />
            </div>
          }
        </div>

        <FixedMenu editor={editor} uploadFile={uploadFile} setIsSubmitting={setIsSubmitting} />
        <div className="self-center flex items-start gap-3 my-auto max-md:justify-center"
        >
          <button
            className={"p-2 text-custom-text-300 hover:bg-custom-primary-100/5 active:bg-custom-primary-100/5 transition-colors"}
          >
            <FileLineChart
              size={20}
            />
          </button>
          <button
            className={"p-2 text-custom-text-300 hover:bg-custom-primary-100/5 active:bg-custom-primary-100/5 transition-colors"}
          >
            <AlertCircle
              size={20}
            />
          </button>
          <div>
            <button
              ref={vericalIconRef}
              className={"p-2 text-custom-text-300 hover:bg-custom-primary-100/5 active:bg-custom-primary-100/5 transition-colors"}
              onClick={() => setMenuItemVisible(!menuItemVisible)}
            >
              <MoreVertical
                size={20}
              />
            </button>
            {menuItemVisible &&
              <div ref={verticalPopoverRef} style={verticalPopoverStyles.popper} {...verticalPopoverAttributes.popper} className="z-10 w-[250px] shadow-xl rounded border-custom-border border-solid border-2 bg-custom-background-100 border-b p-2 overflow-scroll">
                <VerticalDropdownMenu items={KanbanMenuOptions} />
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  )

}
