import { BoldIcon, QuoteIcon, ImageIcon, TableIcon, ListIcon, ListOrderedIcon, ItalicIcon, UnderlineIcon, StrikethroughIcon, CodeIcon } from "lucide-react";
import { Editor } from "@tiptap/react";
import { UploadImage } from "../../../types/upload-image";
import { insertImage, insertTable, toggleBlockquote, toggleBold, toggleBulletList, toggleCode, toggleItalic, toggleOrderedList, toggleStrike } from "../../../lib/editor-commands";

export interface EditorMenuItem {
  name: string;
  isActive: () => boolean;
  command: () => void;
  icon: typeof BoldIcon;
}

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
  command: () => UnderLineItem(editor),
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
  command: () => insertTable(editor),
  icon: TableIcon
})

export const ImageItem = (editor: Editor, uploadFile: UploadImage, setIsSubmitting?: (isSubmitting: "submitting" | "submitted" | "saved") => void): EditorMenuItem => ({
  name: "image",
  isActive: () => editor?.isActive("image"),
  command: () => insertImage(editor, uploadFile, setIsSubmitting),
  icon: ImageIcon,
})
