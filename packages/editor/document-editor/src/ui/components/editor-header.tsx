import { Editor } from "@tiptap/react"
import { AlertCircle, ArchiveIcon, ClipboardIcon, Copy, FileLineChart, Link, Lock, MenuSquare, MoreVertical, XCircle } from "lucide-react"
import { useRouter } from "next/router"
import { useRef, useState } from "react"
import { usePopper } from "react-popper"
import { IMarking, UploadImage } from ".."
import { FixedMenu } from "../menu"
import { IDuplicationConfig, IPageArchiveConfig, IPageLockConfig } from "../types/menu-actions"
import { copyMarkdownToClipboard, CopyPageLink } from "../utils/menu-actions"
import { ContentBrowser } from "./content-browser"
import { IVerticalDropdownItemProps, VerticalDropdownMenu } from "./vertical-dropdown-menu"

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


  const { styles: summaryPopoverStyles, attributes: summaryPopoverAttributes } = usePopper(summaryButtonRef.current, summaryMenuRef.current, {
    placement: "bottom-start"
  })

  const KanbanMenuOptions: IVerticalDropdownItemProps[] = [
    {
      type: "copy_markdown",
      Icon: ClipboardIcon,
      action: () => copyMarkdownToClipboard(editor),
      label: "Copy Markdown"
    },
    {
      type: "close_page",
      Icon: XCircle,
      action: () => router.back(),
      label: "Close the page"
    },
    {
      type: "copy_page_link",
      Icon: Link,
      action: () => CopyPageLink(),
      label: "Copy Page Link"
    },
  ]

  // If duplicateConfig is given, page duplication will be allowed
  if (duplicationConfig) {
    KanbanMenuOptions.push({
      type: "duplicate_page",
      Icon: Copy,
      action: duplicationConfig.action,
      label: "Make a copy"
    })
  }
  // If Lock Configuration is given then, lock page option will be available in the kanban menu
  if (pageLockConfig) {
    KanbanMenuOptions.push({
      type: "lock_page",
      Icon: Lock,
      label: "Lock Page",
      action: pageLockConfig.action
    })
  }

  // Archiving will be visible in the menu bar config once the pageArchiveConfig is given.
  if (pageArchiveConfig) {
    KanbanMenuOptions.push({
      type: "archive_page",
      Icon: ArchiveIcon,
      label: "Archive Page",
      action: pageArchiveConfig.action,
    })
  }

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
              <ContentBrowser editor={editor} markings={markings} scrollSummary={scrollSummary} />
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
