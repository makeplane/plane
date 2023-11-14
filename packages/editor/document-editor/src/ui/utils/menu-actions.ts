import { Editor } from "@tiptap/core"
import { useRouter } from "next/router"

export const copyMarkdownToClipboard = (editor: Editor | null) => {
  const markdownOutput = editor?.storage.markdown.getMarkdown();
	navigator.clipboard.writeText(markdownOutput)	
}

export const duplicatePage = () => {
  
}

export const lockPage = () => {

}

export const CopyPageLink = () => {
  if (window){
    navigator.clipboard.writeText(window.location.toString())
  }
}

export const DuplicatePage = () => {


}

