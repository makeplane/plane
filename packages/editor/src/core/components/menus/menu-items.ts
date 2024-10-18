import { Selection } from "@tiptap/pm/state";
import { Editor } from "@tiptap/react";
import {
  BoldIcon,
  Heading1,
  CheckSquare,
  Heading2,
  Heading3,
  TextQuote,
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
  LucideIcon,
  Palette,
} from "lucide-react";
// helpers
import {
  insertImage,
  insertTableCommand,
  setText,
  toggleBackgroundColor,
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
  toggleTextColor,
  toggleUnderline,
} from "@/helpers/editor-commands";
// types
import { TColorEditorCommands, TNonColorEditorCommands } from "@/types";

export type EditorMenuItem = {
  name: string;
  command: (...args: any) => void;
  icon: LucideIcon;
} & (
  | {
      key: TNonColorEditorCommands;
      isActive: () => boolean;
    }
  | {
      key: TColorEditorCommands;
      isActive: (color: string | undefined) => boolean;
    }
);

export const TextItem = (editor: Editor): EditorMenuItem => ({
  key: "text",
  name: "Text",
  isActive: () => editor.isActive("paragraph"),
  command: () => setText(editor),
  icon: CaseSensitive,
});

export const HeadingOneItem = (editor: Editor): EditorMenuItem => ({
  key: "h1",
  name: "Heading 1",
  isActive: () => editor.isActive("heading", { level: 1 }),
  command: () => toggleHeadingOne(editor),
  icon: Heading1,
});

export const HeadingTwoItem = (editor: Editor): EditorMenuItem => ({
  key: "h2",
  name: "Heading 2",
  isActive: () => editor.isActive("heading", { level: 2 }),
  command: () => toggleHeadingTwo(editor),
  icon: Heading2,
});

export const HeadingThreeItem = (editor: Editor): EditorMenuItem => ({
  key: "h3",
  name: "Heading 3",
  isActive: () => editor.isActive("heading", { level: 3 }),
  command: () => toggleHeadingThree(editor),
  icon: Heading3,
});

export const HeadingFourItem = (editor: Editor): EditorMenuItem => ({
  key: "h4",
  name: "Heading 4",
  isActive: () => editor.isActive("heading", { level: 4 }),
  command: () => toggleHeadingFour(editor),
  icon: Heading4,
});

export const HeadingFiveItem = (editor: Editor): EditorMenuItem => ({
  key: "h5",
  name: "Heading 5",
  isActive: () => editor.isActive("heading", { level: 5 }),
  command: () => toggleHeadingFive(editor),
  icon: Heading5,
});

export const HeadingSixItem = (editor: Editor): EditorMenuItem => ({
  key: "h6",
  name: "Heading 6",
  isActive: () => editor.isActive("heading", { level: 6 }),
  command: () => toggleHeadingSix(editor),
  icon: Heading6,
});

export const BoldItem = (editor: Editor): EditorMenuItem => ({
  key: "bold",
  name: "Bold",
  isActive: () => editor?.isActive("bold"),
  command: () => toggleBold(editor),
  icon: BoldIcon,
});

export const ItalicItem = (editor: Editor): EditorMenuItem => ({
  key: "italic",
  name: "Italic",
  isActive: () => editor?.isActive("italic"),
  command: () => toggleItalic(editor),
  icon: ItalicIcon,
});

export const UnderLineItem = (editor: Editor): EditorMenuItem => ({
  key: "underline",
  name: "Underline",
  isActive: () => editor?.isActive("underline"),
  command: () => toggleUnderline(editor),
  icon: UnderlineIcon,
});

export const StrikeThroughItem = (editor: Editor): EditorMenuItem => ({
  key: "strikethrough",
  name: "Strikethrough",
  isActive: () => editor?.isActive("strike"),
  command: () => toggleStrike(editor),
  icon: StrikethroughIcon,
});

export const BulletListItem = (editor: Editor): EditorMenuItem => ({
  key: "bulleted-list",
  name: "Bulleted list",
  isActive: () => editor?.isActive("bulletList"),
  command: () => toggleBulletList(editor),
  icon: ListIcon,
});

export const NumberedListItem = (editor: Editor): EditorMenuItem => ({
  key: "numbered-list",
  name: "Numbered list",
  isActive: () => editor?.isActive("orderedList"),
  command: () => toggleOrderedList(editor),
  icon: ListOrderedIcon,
});

export const TodoListItem = (editor: Editor): EditorMenuItem => ({
  key: "to-do-list",
  name: "To-do list",
  isActive: () => editor.isActive("taskItem"),
  command: () => toggleTaskList(editor),
  icon: CheckSquare,
});

export const QuoteItem = (editor: Editor): EditorMenuItem => ({
  key: "quote",
  name: "Quote",
  isActive: () => editor?.isActive("blockquote"),
  command: () => toggleBlockquote(editor),
  icon: TextQuote,
});

export const CodeItem = (editor: Editor): EditorMenuItem => ({
  key: "code",
  name: "Code",
  isActive: () => editor?.isActive("code") || editor?.isActive("codeBlock"),
  command: () => toggleCodeBlock(editor),
  icon: CodeIcon,
});

export const TableItem = (editor: Editor): EditorMenuItem => ({
  key: "table",
  name: "Table",
  isActive: () => editor?.isActive("table"),
  command: () => insertTableCommand(editor),
  icon: TableIcon,
});

export const ImageItem = (editor: Editor) =>
  ({
    key: "image",
    name: "Image",
    isActive: () => editor?.isActive("image") || editor?.isActive("imageComponent"),
    command: (savedSelection: Selection | null) => insertImage({ editor, event: "insert", pos: savedSelection?.from }),
    icon: ImageIcon,
  }) as const;

export const TextColorItem = (editor: Editor): EditorMenuItem => ({
  key: "text-color",
  name: "Color",
  isActive: (color) => editor.isActive("customColor", { color }),
  command: (color: string) => toggleTextColor(color, editor),
  icon: Palette,
});

export const BackgroundColorItem = (editor: Editor): EditorMenuItem => ({
  key: "background-color",
  name: "Background color",
  isActive: (color) => editor.isActive("customColor", { backgroundColor: color }),
  command: (color: string) => toggleBackgroundColor(color, editor),
  icon: Palette,
});

export const getEditorMenuItems = (editor: Editor | null): EditorMenuItem[] => {
  if (!editor) return [];

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
    ImageItem(editor),
    TextColorItem(editor),
    BackgroundColorItem(editor),
  ];
};
