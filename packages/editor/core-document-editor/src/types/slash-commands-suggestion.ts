import { ReactNode } from "react";
import { Editor, Range } from "@tiptap/core";

export type CommandProps = {
  editor: Editor;
  range: Range;
};

export type ISlashCommandItem = {
  key: string;
  title: string;
  description: string;
  searchTerms: string[];
  icon: ReactNode;
  command: ({ editor, range }: CommandProps) => void;
};
