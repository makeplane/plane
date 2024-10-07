import { ReactNode } from "react";
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
  | "issue-embed";

export type CommandProps = {
  editor: Editor;
  range: Range;
};

export type ISlashCommandItem = {
  key: TEditorCommands;
  title: string;
  description: string;
  searchTerms: string[];
  icon: ReactNode;
  command: ({ editor, range }: CommandProps) => void;
};
