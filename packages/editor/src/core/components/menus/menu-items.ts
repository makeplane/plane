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
  MinusSquare,
  Palette,
  AlignCenter,
} from "lucide-react";
// helpers
import {
  insertHorizontalRule,
  insertImage,
  insertTableCommand,
  setText,
  setTextAlign,
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
import { TCommandWithProps, TEditorCommands } from "@/types";

type isActiveFunction<T extends TEditorCommands> = (params?: TCommandWithProps<T>) => boolean;
type commandFunction<T extends TEditorCommands> = (params?: TCommandWithProps<T>) => void;

export type EditorMenuItem<T extends TEditorCommands> = {
  key: T;
  name: string;
  command: commandFunction<T>;
  icon: LucideIcon;
  isActive: isActiveFunction<T>;
};

export const TextItem = (editor: Editor): EditorMenuItem<"text"> => ({
  key: "text",
  name: "Text",
  isActive: () => editor.isActive("paragraph"),
  command: () => setText(editor),
  icon: CaseSensitive,
});

export const HeadingOneItem = (editor: Editor): EditorMenuItem<"h1"> => ({
  key: "h1",
  name: "Heading 1",
  isActive: () => editor.isActive("heading", { level: 1 }),
  command: () => toggleHeadingOne(editor),
  icon: Heading1,
});

export const HeadingTwoItem = (editor: Editor): EditorMenuItem<"h2"> => ({
  key: "h2",
  name: "Heading 2",
  isActive: () => editor.isActive("heading", { level: 2 }),
  command: () => toggleHeadingTwo(editor),
  icon: Heading2,
});

export const HeadingThreeItem = (editor: Editor): EditorMenuItem<"h3"> => ({
  key: "h3",
  name: "Heading 3",
  isActive: () => editor.isActive("heading", { level: 3 }),
  command: () => toggleHeadingThree(editor),
  icon: Heading3,
});

export const HeadingFourItem = (editor: Editor): EditorMenuItem<"h4"> => ({
  key: "h4",
  name: "Heading 4",
  isActive: () => editor.isActive("heading", { level: 4 }),
  command: () => toggleHeadingFour(editor),
  icon: Heading4,
});

export const HeadingFiveItem = (editor: Editor): EditorMenuItem<"h5"> => ({
  key: "h5",
  name: "Heading 5",
  isActive: () => editor.isActive("heading", { level: 5 }),
  command: () => toggleHeadingFive(editor),
  icon: Heading5,
});

export const HeadingSixItem = (editor: Editor): EditorMenuItem<"h6"> => ({
  key: "h6",
  name: "Heading 6",
  isActive: () => editor.isActive("heading", { level: 6 }),
  command: () => toggleHeadingSix(editor),
  icon: Heading6,
});

export const BoldItem = (editor: Editor): EditorMenuItem<"bold"> => ({
  key: "bold",
  name: "Bold",
  isActive: () => editor?.isActive("bold"),
  command: () => toggleBold(editor),
  icon: BoldIcon,
});

export const ItalicItem = (editor: Editor): EditorMenuItem<"italic"> => ({
  key: "italic",
  name: "Italic",
  isActive: () => editor?.isActive("italic"),
  command: () => toggleItalic(editor),
  icon: ItalicIcon,
});

export const UnderLineItem = (editor: Editor): EditorMenuItem<"underline"> => ({
  key: "underline",
  name: "Underline",
  isActive: () => editor?.isActive("underline"),
  command: () => toggleUnderline(editor),
  icon: UnderlineIcon,
});

export const StrikeThroughItem = (editor: Editor): EditorMenuItem<"strikethrough"> => ({
  key: "strikethrough",
  name: "Strikethrough",
  isActive: () => editor?.isActive("strike"),
  command: () => toggleStrike(editor),
  icon: StrikethroughIcon,
});

export const BulletListItem = (editor: Editor): EditorMenuItem<"bulleted-list"> => ({
  key: "bulleted-list",
  name: "Bulleted list",
  isActive: () => editor?.isActive("bulletList"),
  command: () => toggleBulletList(editor),
  icon: ListIcon,
});

export const NumberedListItem = (editor: Editor): EditorMenuItem<"numbered-list"> => ({
  key: "numbered-list",
  name: "Numbered list",
  isActive: () => editor?.isActive("orderedList"),
  command: () => toggleOrderedList(editor),
  icon: ListOrderedIcon,
});

export const TodoListItem = (editor: Editor): EditorMenuItem<"to-do-list"> => ({
  key: "to-do-list",
  name: "To-do list",
  isActive: () => editor.isActive("taskItem"),
  command: () => toggleTaskList(editor),
  icon: CheckSquare,
});

export const QuoteItem = (editor: Editor): EditorMenuItem<"quote"> => ({
  key: "quote",
  name: "Quote",
  isActive: () => editor?.isActive("blockquote"),
  command: () => toggleBlockquote(editor),
  icon: TextQuote,
});

export const CodeItem = (editor: Editor): EditorMenuItem<"code"> => ({
  key: "code",
  name: "Code",
  isActive: () => editor?.isActive("code") || editor?.isActive("codeBlock"),
  command: () => toggleCodeBlock(editor),
  icon: CodeIcon,
});

export const TableItem = (editor: Editor): EditorMenuItem<"table"> => ({
  key: "table",
  name: "Table",
  isActive: () => editor?.isActive("table"),
  command: () => insertTableCommand(editor),
  icon: TableIcon,
});

export const ImageItem = (editor: Editor): EditorMenuItem<"image"> => ({
  key: "image",
  name: "Image",
  isActive: () => editor?.isActive("image") || editor?.isActive("imageComponent"),
  command: ({ savedSelection }) =>
    insertImage({ editor, event: "insert", pos: savedSelection?.from ?? editor.state.selection.from }),
  icon: ImageIcon,
});

export const HorizontalRuleItem = (editor: Editor) =>
  ({
    key: "divider",
    name: "Divider",
    isActive: () => editor?.isActive("horizontalRule"),
    command: () => insertHorizontalRule(editor),
    icon: MinusSquare,
  }) as const;

export const TextColorItem = (editor: Editor): EditorMenuItem<"text-color"> => ({
  key: "text-color",
  name: "Color",
  isActive: ({ color }) => editor.isActive("customColor", { color }),
  command: ({ color }) => toggleTextColor(color, editor),
  icon: Palette,
});

export const BackgroundColorItem = (editor: Editor): EditorMenuItem<"background-color"> => ({
  key: "background-color",
  name: "Background color",
  isActive: ({ color }) => editor.isActive("customColor", { backgroundColor: color }),
  command: ({ color }) => toggleBackgroundColor(color, editor),
  icon: Palette,
});

export const TextAlignItem = (editor: Editor): EditorMenuItem<"text-align"> => ({
  key: "text-align",
  name: "Text align",
  isActive: ({ alignment }) => editor.isActive({ textAlign: alignment }),
  command: ({ alignment }) => setTextAlign(alignment, editor),
  icon: AlignCenter,
});

export const getEditorMenuItems = (editor: Editor | null): EditorMenuItem<TEditorCommands>[] => {
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
    HorizontalRuleItem(editor),
    TextColorItem(editor),
    BackgroundColorItem(editor),
    TextAlignItem(editor),
  ];
};
