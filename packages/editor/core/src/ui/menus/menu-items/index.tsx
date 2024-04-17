import {
  BoldIcon,
  Heading1,
  CheckSquare,
  Heading2,
  Heading3,
  QuoteIcon,
  ImageIcon,
  TableIcon,
  ListIcon,
  ListOrderedIcon,
  ItalicIcon,
  UnderlineIcon,
  StrikethroughIcon,
  CodeIcon,
} from "lucide-react";
import { Editor } from "@tiptap/react";
import {
  insertImageCommand,
  insertTableCommand,
  toggleBlockquote,
  toggleBold,
  toggleBulletList,
  toggleCodeBlock,
  toggleHeadingOne,
  toggleHeadingThree,
  toggleHeadingTwo,
  toggleItalic,
  toggleOrderedList,
  toggleStrike,
  toggleTaskList,
  toggleUnderline,
} from "src/lib/editor-commands";
import { LucideIconType } from "src/types/lucide-icon";
import { UploadImage } from "src/types/upload-image";
import { Selection } from "@tiptap/pm/state";

export interface EditorMenuItem {
  name: string;
  isActive: () => boolean;
  command: () => void;
  icon: LucideIconType;
}

export const HeadingOneItem = (editor: Editor) =>
  ({
    name: "H1",
    isActive: () => editor.isActive("heading", { level: 1 }),
    command: () => toggleHeadingOne(editor),
    icon: Heading1,
  }) as const satisfies EditorMenuItem;

export const HeadingTwoItem = (editor: Editor) =>
  ({
    name: "H2",
    isActive: () => editor.isActive("heading", { level: 2 }),
    command: () => toggleHeadingTwo(editor),
    icon: Heading2,
  }) as const satisfies EditorMenuItem;

export const HeadingThreeItem = (editor: Editor) =>
  ({
    name: "H3",
    isActive: () => editor.isActive("heading", { level: 3 }),
    command: () => toggleHeadingThree(editor),
    icon: Heading3,
  }) as const satisfies EditorMenuItem;

export const BoldItem = (editor: Editor) =>
  ({
    name: "bold",
    isActive: () => editor?.isActive("bold"),
    command: () => toggleBold(editor),
    icon: BoldIcon,
  }) as const satisfies EditorMenuItem;

export const ItalicItem = (editor: Editor) =>
  ({
    name: "italic",
    isActive: () => editor?.isActive("italic"),
    command: () => toggleItalic(editor),
    icon: ItalicIcon,
  }) as const satisfies EditorMenuItem;

export const UnderLineItem = (editor: Editor) =>
  ({
    name: "underline",
    isActive: () => editor?.isActive("underline"),
    command: () => toggleUnderline(editor),
    icon: UnderlineIcon,
  }) as const satisfies EditorMenuItem;

export const StrikeThroughItem = (editor: Editor) =>
  ({
    name: "strike",
    isActive: () => editor?.isActive("strike"),
    command: () => toggleStrike(editor),
    icon: StrikethroughIcon,
  }) as const satisfies EditorMenuItem;

export const BulletListItem = (editor: Editor) =>
  ({
    name: "bullet-list",
    isActive: () => editor?.isActive("bulletList"),
    command: () => toggleBulletList(editor),
    icon: ListIcon,
  }) as const satisfies EditorMenuItem;

export const TodoListItem = (editor: Editor) =>
  ({
    name: "To-do List",
    isActive: () => editor.isActive("taskItem"),
    command: () => toggleTaskList(editor),
    icon: CheckSquare,
  }) as const satisfies EditorMenuItem;

export const CodeItem = (editor: Editor) =>
  ({
    name: "code",
    isActive: () => editor?.isActive("code") || editor?.isActive("codeBlock"),
    command: () => toggleCodeBlock(editor),
    icon: CodeIcon,
  }) as const satisfies EditorMenuItem;

export const NumberedListItem = (editor: Editor) =>
  ({
    name: "ordered-list",
    isActive: () => editor?.isActive("orderedList"),
    command: () => toggleOrderedList(editor),
    icon: ListOrderedIcon,
  }) as const satisfies EditorMenuItem;

export const QuoteItem = (editor: Editor) =>
  ({
    name: "quote",
    isActive: () => editor?.isActive("blockquote"),
    command: () => toggleBlockquote(editor),
    icon: QuoteIcon,
  }) as const satisfies EditorMenuItem;

export const TableItem = (editor: Editor) =>
  ({
    name: "table",
    isActive: () => editor?.isActive("table"),
    command: () => insertTableCommand(editor),
    icon: TableIcon,
  }) as const satisfies EditorMenuItem;

export const ImageItem = (editor: Editor, uploadFile: UploadImage) =>
  ({
    name: "image",
    isActive: () => editor?.isActive("image"),
    command: (savedSelection: Selection | null) => insertImageCommand(editor, uploadFile, savedSelection),
    icon: ImageIcon,
  }) as const;

export function getEditorMenuItems(editor: Editor | null, uploadFile: UploadImage) {
  if (!editor) {
    return [];
  }
  return [
    HeadingOneItem(editor),
    HeadingTwoItem(editor),
    HeadingThreeItem(editor),
    BoldItem(editor),
    ItalicItem(editor),
    UnderLineItem(editor),
    StrikeThroughItem(editor),
    BulletListItem(editor),
    TodoListItem(editor),
    CodeItem(editor),
    NumberedListItem(editor),
    QuoteItem(editor),
    TableItem(editor),
    ImageItem(editor, uploadFile),
  ];
}

export type EditorMenuItemNames = ReturnType<typeof getEditorMenuItems> extends (infer U)[]
  ? U extends { name: infer N }
    ? N
    : never
  : never;
