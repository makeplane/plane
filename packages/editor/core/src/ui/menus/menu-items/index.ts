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
  Heading4,
  Heading5,
  Heading6,
  CaseSensitive,
} from "lucide-react";
import { Editor } from "@tiptap/react";
import {
  insertImageCommand,
  insertTableCommand,
  setText,
  toggleBlockquote,
  toggleBold,
  toggleBulletList,
  toggleCodeBlock,
  toggleHeadingFive,
  toggleHeadingFour,
  toggleHeadingOne,
  toggleHeadingSix,
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
  key: string;
  name: string;
  isActive: () => boolean;
  command: () => void;
  icon: LucideIconType;
}

export const TextItem = (editor: Editor) =>
  ({
    key: "text",
    name: "Text",
    isActive: () => editor.isActive("paragraph"),
    command: () => setText(editor),
    icon: CaseSensitive,
  }) as const satisfies EditorMenuItem;

export const HeadingOneItem = (editor: Editor) =>
  ({
    key: "h1",
    name: "Heading 1",
    isActive: () => editor.isActive("heading", { level: 1 }),
    command: () => toggleHeadingOne(editor),
    icon: Heading1,
  }) as const satisfies EditorMenuItem;

export const HeadingTwoItem = (editor: Editor) =>
  ({
    key: "h2",
    name: "Heading 2",
    isActive: () => editor.isActive("heading", { level: 2 }),
    command: () => toggleHeadingTwo(editor),
    icon: Heading2,
  }) as const satisfies EditorMenuItem;

export const HeadingThreeItem = (editor: Editor) =>
  ({
    key: "h3",
    name: "Heading 3",
    isActive: () => editor.isActive("heading", { level: 3 }),
    command: () => toggleHeadingThree(editor),
    icon: Heading3,
  }) as const satisfies EditorMenuItem;

export const HeadingFourItem = (editor: Editor) =>
  ({
    key: "h4",
    name: "Heading 4",
    isActive: () => editor.isActive("heading", { level: 4 }),
    command: () => toggleHeadingFour(editor),
    icon: Heading4,
  }) as const satisfies EditorMenuItem;

export const HeadingFiveItem = (editor: Editor) =>
  ({
    key: "h5",
    name: "Heading 5",
    isActive: () => editor.isActive("heading", { level: 5 }),
    command: () => toggleHeadingFive(editor),
    icon: Heading5,
  }) as const satisfies EditorMenuItem;

export const HeadingSixItem = (editor: Editor) =>
  ({
    key: "h6",
    name: "Heading 6",
    isActive: () => editor.isActive("heading", { level: 6 }),
    command: () => toggleHeadingSix(editor),
    icon: Heading6,
  }) as const satisfies EditorMenuItem;

export const BoldItem = (editor: Editor) =>
  ({
    key: "bold",
    name: "Bold",
    isActive: () => editor?.isActive("bold"),
    command: () => toggleBold(editor),
    icon: BoldIcon,
  }) as const satisfies EditorMenuItem;

export const ItalicItem = (editor: Editor) =>
  ({
    key: "italic",
    name: "Italic",
    isActive: () => editor?.isActive("italic"),
    command: () => toggleItalic(editor),
    icon: ItalicIcon,
  }) as const satisfies EditorMenuItem;

export const UnderLineItem = (editor: Editor) =>
  ({
    key: "underline",
    name: "Underline",
    isActive: () => editor?.isActive("underline"),
    command: () => toggleUnderline(editor),
    icon: UnderlineIcon,
  }) as const satisfies EditorMenuItem;

export const StrikeThroughItem = (editor: Editor) =>
  ({
    key: "strikethrough",
    name: "Strikethrough",
    isActive: () => editor?.isActive("strike"),
    command: () => toggleStrike(editor),
    icon: StrikethroughIcon,
  }) as const satisfies EditorMenuItem;

export const BulletListItem = (editor: Editor) =>
  ({
    key: "bulleted-list",
    name: "Bulleted list",
    isActive: () => editor?.isActive("bulletList"),
    command: () => toggleBulletList(editor),
    icon: ListIcon,
  }) as const satisfies EditorMenuItem;

export const NumberedListItem = (editor: Editor) =>
  ({
    key: "numbered-list",
    name: "Numbered list",
    isActive: () => editor?.isActive("orderedList"),
    command: () => toggleOrderedList(editor),
    icon: ListOrderedIcon,
  }) as const satisfies EditorMenuItem;

export const TodoListItem = (editor: Editor) =>
  ({
    key: "to-do-list",
    name: "To-do list",
    isActive: () => editor.isActive("taskItem"),
    command: () => toggleTaskList(editor),
    icon: CheckSquare,
  }) as const satisfies EditorMenuItem;

export const QuoteItem = (editor: Editor) =>
  ({
    key: "quote",
    name: "Quote",
    isActive: () => editor?.isActive("blockquote"),
    command: () => toggleBlockquote(editor),
    icon: QuoteIcon,
  }) as const satisfies EditorMenuItem;

export const CodeItem = (editor: Editor) =>
  ({
    key: "code",
    name: "Code",
    isActive: () => editor?.isActive("code") || editor?.isActive("codeBlock"),
    command: () => toggleCodeBlock(editor),
    icon: CodeIcon,
  }) as const satisfies EditorMenuItem;

export const TableItem = (editor: Editor) =>
  ({
    key: "table",
    name: "Table",
    isActive: () => editor?.isActive("table"),
    command: () => insertTableCommand(editor),
    icon: TableIcon,
  }) as const satisfies EditorMenuItem;

export const ImageItem = (editor: Editor, uploadFile: UploadImage) =>
  ({
    key: "image",
    name: "Image",
    isActive: () => editor?.isActive("image"),
    command: (savedSelection: Selection | null) => insertImageCommand(editor, uploadFile, savedSelection),
    icon: ImageIcon,
  }) as const;

export function getEditorMenuItems(editor: Editor | null, uploadFile: UploadImage) {
  if (!editor) {
    return [];
  }
  return [
    TextItem(editor),
    HeadingOneItem(editor),
    HeadingTwoItem(editor),
    HeadingThreeItem(editor),
    HeadingFourItem(editor),
    HeadingFiveItem(editor),
    HeadingSixItem(editor),
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

export type EditorMenuItemNames =
  ReturnType<typeof getEditorMenuItems> extends (infer U)[] ? (U extends { key: infer N } ? N : never) : never;
