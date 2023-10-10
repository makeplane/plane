import { BoldIcon, Heading1, CheckSquare, Heading2, Heading3, QuoteIcon, ImageIcon, TableIcon, ListIcon, ListOrderedIcon, ItalicIcon, UnderlineIcon, StrikethroughIcon, CodeIcon } from "lucide-react";
import { Editor } from "@tiptap/react";
import { UploadImage } from "../../../types/upload-image";
import { insertImageCommand, insertTableCommand, toggleBlockquote, toggleBold, toggleBulletList, toggleCode, toggleHeadingOne, toggleHeadingThree, toggleHeadingTwo, toggleItalic, toggleOrderedList, toggleStrike, toggleTaskList, toggleUnderline, } from "../../../lib/editor-commands";

export interface EditorMenuItem {
  name: string;
  isActive: () => boolean;
  command: () => void;
  icon: typeof BoldIcon;
}

export const HeadingOneItem = (editor: Editor): EditorMenuItem => ({
  name: "H1",
  isActive: () => editor.isActive("heading", { level: 1 }),
  command: () => toggleHeadingOne(editor),
  icon: Heading1,
})

export const HeadingTwoItem = (editor: Editor): EditorMenuItem => ({
  name: "H2",
  isActive: () => editor.isActive("heading", { level: 2 }),
  command: () => toggleHeadingTwo(editor),
  icon: Heading2,
})

export const HeadingThreeItem = (editor: Editor): EditorMenuItem => ({
  name: "H3",
  isActive: () => editor.isActive("heading", { level: 3 }),
  command: () => toggleHeadingThree(editor),
  icon: Heading3,
})

export const BoldItem = (editor: Editor): EditorMenuItem => ({
  name: "bold",
  isActive: () => editor?.isActive("bold"),
  command: () => toggleBold(editor),
  icon: BoldIcon,
})

export const ItalicItem = (editor: Editor): EditorMenuItem => ({
  name: "italic",
  isActive: () => editor?.isActive("italic"),
  command: () => toggleItalic(editor),
  icon: ItalicIcon,
})

export const UnderLineItem = (editor: Editor): EditorMenuItem => ({
  name: "underline",
  isActive: () => editor?.isActive("underline"),
  command: () => toggleUnderline(editor),
  icon: UnderlineIcon,
})

export const StrikeThroughItem = (editor: Editor): EditorMenuItem => ({
  name: "strike",
  isActive: () => editor?.isActive("strike"),
  command: () => toggleStrike(editor),
  icon: StrikethroughIcon,
})

export const CodeItem = (editor: Editor): EditorMenuItem => ({
  name: "code",
  isActive: () => editor?.isActive("code"),
  command: () => toggleCode(editor),
  icon: CodeIcon,
})

export const BulletListItem = (editor: Editor): EditorMenuItem => ({
  name: "bullet-list",
  isActive: () => editor?.isActive("bulletList"),
  command: () => toggleBulletList(editor),
  icon: ListIcon,
})

export const TodoListItem = (editor: Editor): EditorMenuItem => ({
  name: "To-do List",
  isActive: () => editor.isActive("taskItem"),
  command: () => toggleTaskList(editor),
  icon: CheckSquare,
})

export const NumberedListItem = (editor: Editor): EditorMenuItem => ({
  name: "ordered-list",
  isActive: () => editor?.isActive("orderedList"),
  command: () => toggleOrderedList(editor),
  icon: ListOrderedIcon
})

export const QuoteItem = (editor: Editor): EditorMenuItem => ({
  name: "quote",
  isActive: () => editor?.isActive("quote"),
  command: () => toggleBlockquote(editor),
  icon: QuoteIcon
})

export const TableItem = (editor: Editor): EditorMenuItem => ({
  name: "quote",
  isActive: () => editor?.isActive("table"),
  command: () => insertTableCommand(editor),
  icon: TableIcon
})

export const ImageItem = (editor: Editor, uploadFile: UploadImage, setIsSubmitting?: (isSubmitting: "submitting" | "submitted" | "saved") => void): EditorMenuItem => ({
  name: "image",
  isActive: () => editor?.isActive("image"),
  command: () => insertImageCommand(editor, uploadFile, setIsSubmitting),
  icon: ImageIcon,
})
