import { CSSProperties } from "react";
import { Editor, Range } from "@tiptap/core";

export type TEditorCommands =
  | "text"
  | "h1"
  | "h2"
  | "h3"
  | "h4"
  | "h5"
  | "h6"
  | "bold"
  | "italic"
  | "underline"
  | "strikethrough"
  | "bulleted-list"
  | "numbered-list"
  | "to-do-list"
  | "quote"
  | "code"
  | "table"
  | "image"
  | "divider"
  | "issue-embed"
  | "text-color"
  | "background-color"
  | "callout";

export type TColorEditorCommands = Extract<TEditorCommands, "text-color" | "background-color">;
export type TNonColorEditorCommands = Exclude<TEditorCommands, "text-color" | "background-color">;

export type CommandProps = {
  editor: Editor;
  range: Range;
};

export type ISlashCommandItem = {
  commandKey: TEditorCommands;
  key: string;
  title: string;
  description: string;
  searchTerms: string[];
  icon: React.ReactNode;
  iconContainerStyle?: CSSProperties;
  command: ({ editor, range }: CommandProps) => void;
};
