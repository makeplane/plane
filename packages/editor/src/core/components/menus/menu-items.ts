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
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";
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
  isActive: () => editor.isActive(CORE_EXTENSIONS.PARAGRAPH),
  command: () => setText(editor),
  icon: CaseSensitive,
});

export const HeadingOneItem = (editor: Editor): EditorMenuItem<"h1"> => ({
  key: "h1",
  name: "Heading 1",
  isActive: () => editor.isActive(CORE_EXTENSIONS.HEADING, { level: 1 }),
  command: () => toggleHeadingOne(editor),
  icon: Heading1,
});

export const HeadingTwoItem = (editor: Editor): EditorMenuItem<"h2"> => ({
  key: "h2",
  name: "Heading 2",
  isActive: () => editor.isActive(CORE_EXTENSIONS.HEADING, { level: 2 }),
  command: () => toggleHeadingTwo(editor),
  icon: Heading2,
});

export const HeadingThreeItem = (editor: Editor): EditorMenuItem<"h3"> => ({
  key: "h3",
  name: "Heading 3",
  isActive: () => editor.isActive(CORE_EXTENSIONS.HEADING, { level: 3 }),
  command: () => toggleHeadingThree(editor),
  icon: Heading3,
});

export const HeadingFourItem = (editor: Editor): EditorMenuItem<"h4"> => ({
  key: "h4",
  name: "Heading 4",
  isActive: () => editor.isActive(CORE_EXTENSIONS.HEADING, { level: 4 }),
  command: () => toggleHeadingFour(editor),
  icon: Heading4,
});

export const HeadingFiveItem = (editor: Editor): EditorMenuItem<"h5"> => ({
  key: "h5",
  name: "Heading 5",
  isActive: () => editor.isActive(CORE_EXTENSIONS.HEADING, { level: 5 }),
  command: () => toggleHeadingFive(editor),
  icon: Heading5,
});

export const HeadingSixItem = (editor: Editor): EditorMenuItem<"h6"> => ({
  key: "h6",
  name: "Heading 6",
  isActive: () => editor.isActive(CORE_EXTENSIONS.HEADING, { level: 6 }),
  command: () => toggleHeadingSix(editor),
  icon: Heading6,
});

export const BoldItem = (editor: Editor): EditorMenuItem<"bold"> => ({
  key: "bold",
  name: "Bold",
  isActive: () => editor?.isActive(CORE_EXTENSIONS.BOLD),
  command: () => toggleBold(editor),
  icon: BoldIcon,
});

export const ItalicItem = (editor: Editor): EditorMenuItem<"italic"> => ({
  key: "italic",
  name: "Italic",
  isActive: () => editor?.isActive(CORE_EXTENSIONS.ITALIC),
  command: () => toggleItalic(editor),
  icon: ItalicIcon,
});

export const UnderLineItem = (editor: Editor): EditorMenuItem<"underline"> => ({
  key: "underline",
  name: "Underline",
  isActive: () => editor?.isActive(CORE_EXTENSIONS.UNDERLINE),
  command: () => toggleUnderline(editor),
  icon: UnderlineIcon,
});

export const StrikeThroughItem = (editor: Editor): EditorMenuItem<"strikethrough"> => ({
  key: "strikethrough",
  name: "Strikethrough",
  isActive: () => editor?.isActive(CORE_EXTENSIONS.STRIKETHROUGH),
  command: () => toggleStrike(editor),
  icon: StrikethroughIcon,
});

export const BulletListItem = (editor: Editor): EditorMenuItem<"bulleted-list"> => ({
  key: "bulleted-list",
  name: "Bulleted list",
  isActive: () => editor?.isActive(CORE_EXTENSIONS.BULLET_LIST),
  command: () => toggleBulletList(editor),
  icon: ListIcon,
});

export const NumberedListItem = (editor: Editor): EditorMenuItem<"numbered-list"> => ({
  key: "numbered-list",
  name: "Numbered list",
  isActive: () => editor?.isActive(CORE_EXTENSIONS.ORDERED_LIST),
  command: () => toggleOrderedList(editor),
  icon: ListOrderedIcon,
});

export const TodoListItem = (editor: Editor): EditorMenuItem<"to-do-list"> => ({
  key: "to-do-list",
  name: "To-do list",
  isActive: () => editor.isActive(CORE_EXTENSIONS.TASK_ITEM),
  command: () => toggleTaskList(editor),
  icon: CheckSquare,
});

export const QuoteItem = (editor: Editor): EditorMenuItem<"quote"> => ({
  key: "quote",
  name: "Quote",
  isActive: () => editor?.isActive(CORE_EXTENSIONS.BLOCKQUOTE),
  command: () => toggleBlockquote(editor),
  icon: TextQuote,
});

export const CodeItem = (editor: Editor): EditorMenuItem<"code"> => ({
  key: "code",
  name: "Code",
  isActive: () => editor?.isActive(CORE_EXTENSIONS.CODE_INLINE) || editor?.isActive(CORE_EXTENSIONS.CODE_BLOCK),
  command: () => toggleCodeBlock(editor),
  icon: CodeIcon,
});

export const TableItem = (editor: Editor): EditorMenuItem<"table"> => ({
  key: "table",
  name: "Table",
  isActive: () => editor?.isActive(CORE_EXTENSIONS.TABLE),
  command: () => insertTableCommand(editor),
  icon: TableIcon,
});

export const ImageItem = (editor: Editor): EditorMenuItem<"image"> => ({
  key: "image",
  name: "Image",
  isActive: () => editor?.isActive(CORE_EXTENSIONS.IMAGE) || editor?.isActive(CORE_EXTENSIONS.CUSTOM_IMAGE),
  command: () => insertImage({ editor, event: "insert", pos: editor.state.selection.from }),
  icon: ImageIcon,
});

export const HorizontalRuleItem = (editor: Editor) =>
  ({
    key: "divider",
    name: "Divider",
    isActive: () => editor?.isActive(CORE_EXTENSIONS.HORIZONTAL_RULE),
    command: () => insertHorizontalRule(editor),
    icon: MinusSquare,
  }) as const;

export const TextColorItem = (editor: Editor): EditorMenuItem<"text-color"> => ({
  key: "text-color",
  name: "Color",
  isActive: (props) => editor.isActive(CORE_EXTENSIONS.CUSTOM_COLOR, { color: props?.color }),
  command: (props) => {
    if (!props) return;
    toggleTextColor(props.color, editor);
  },
  icon: Palette,
});

export const BackgroundColorItem = (editor: Editor): EditorMenuItem<"background-color"> => ({
  key: "background-color",
  name: "Background color",
  isActive: (props) => editor.isActive(CORE_EXTENSIONS.CUSTOM_COLOR, { backgroundColor: props?.color }),
  command: (props) => {
    if (!props) return;
    toggleBackgroundColor(props.color, editor);
  },
  icon: Palette,
});

export const TextAlignItem = (editor: Editor): EditorMenuItem<"text-align"> => ({
  key: "text-align",
  name: "Text align",
  isActive: (props) => editor.isActive({ textAlign: props?.alignment }),
  command: (props) => {
    if (!props) return;
    setTextAlign(props.alignment, editor);
  },
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
