import {
  Bold,
  Code2,
  Heading1,
  Heading2,
  Heading3,
  Image,
  Italic,
  List,
  ListOrdered,
  ListTodo,
  LucideIcon,
  Quote,
  Strikethrough,
  Table,
  Underline,
} from "lucide-react";
// editor
import { EditorMenuItemNames } from "@plane/lite-text-editor";

type TEditorTypes = "lite" | "document";

export type ToolbarMenuItem = {
  key: EditorMenuItemNames;
  name: string;
  icon: LucideIcon;
  shortcut?: string[];
  editors: TEditorTypes[];
};

export const BASIC_MARK_ITEMS: ToolbarMenuItem[] = [
  { key: "H1", name: "Heading 1", icon: Heading1, editors: ["document"] },
  { key: "H2", name: "Heading 2", icon: Heading2, editors: ["document"] },
  { key: "H3", name: "Heading 3", icon: Heading3, editors: ["document"] },
  { key: "bold", name: "Bold", icon: Bold, shortcut: ["Cmd", "B"], editors: ["lite", "document"] },
  { key: "italic", name: "Italic", icon: Italic, shortcut: ["Cmd", "I"], editors: ["lite", "document"] },
  { key: "underline", name: "Underline", icon: Underline, shortcut: ["Cmd", "U"], editors: ["lite", "document"] },
  {
    key: "strike",
    name: "Strikethrough",
    icon: Strikethrough,
    shortcut: ["Cmd", "Shift", "S"],
    editors: ["lite", "document"],
  },
];

export const LIST_ITEMS: ToolbarMenuItem[] = [
  {
    key: "bullet-list",
    name: "Bulleted list",
    icon: List,
    shortcut: ["Cmd", "Shift", "7"],
    editors: ["lite", "document"],
  },
  {
    key: "ordered-list",
    name: "Numbered list",
    icon: ListOrdered,
    shortcut: ["Cmd", "Shift", "8"],
    editors: ["lite", "document"],
  },
  {
    key: "To-do List",
    name: "To-do list",
    icon: ListTodo,
    shortcut: ["Cmd", "Shift", "9"],
    editors: ["lite", "document"],
  },
];

export const USER_ACTION_ITEMS: ToolbarMenuItem[] = [
  { key: "quote", name: "Quote", icon: Quote, editors: ["lite", "document"] },
  { key: "code", name: "Code", icon: Code2, editors: ["lite", "document"] },
];

export const COMPLEX_ITEMS: ToolbarMenuItem[] = [
  { key: "table", name: "Table", icon: Table, editors: ["document"] },
  { key: "image", name: "Image", icon: Image, editors: ["lite", "document"] },
];

export const TOOLBAR_ITEMS: {
  [editorType in TEditorTypes]: {
    [key: string]: ToolbarMenuItem[];
  };
} = {
  lite: {
    basic: BASIC_MARK_ITEMS.filter((item) => item.editors.includes("lite")),
    list: LIST_ITEMS.filter((item) => item.editors.includes("lite")),
    userAction: USER_ACTION_ITEMS.filter((item) => item.editors.includes("lite")),
    complex: COMPLEX_ITEMS.filter((item) => item.editors.includes("lite")),
  },
  document: {
    basic: BASIC_MARK_ITEMS.filter((item) => item.editors.includes("document")),
    list: LIST_ITEMS.filter((item) => item.editors.includes("document")),
    userAction: USER_ACTION_ITEMS.filter((item) => item.editors.includes("document")),
    complex: COMPLEX_ITEMS.filter((item) => item.editors.includes("document")),
  },
};
