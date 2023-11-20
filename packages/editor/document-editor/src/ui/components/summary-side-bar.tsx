import { Editor } from "@tiptap/react"
import { IMarking } from ".."
import { ContentBrowser } from "./content-browser"

interface ISummarySideBarProps {
  editor: Editor,
  markings: IMarking[],
  sidePeakVisible: boolean
}

export const SummarySideBar = ({ editor, markings, sidePeakVisible }: ISummarySideBarProps) => {
  return (

    <div className={`flex flex-col items-stretch w-[21%] max-md:w-full max-md:ml-0 border-custom-border border-r border-solid transition-all duration-200 ease-in-out transform ${sidePeakVisible ? 'translate-x-0' : '-translate-x-full'}`}>
      <ContentBrowser editor={editor} markings={markings} />
    </div>
  )
}
