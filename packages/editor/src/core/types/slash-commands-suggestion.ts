import type { Editor, Range } from "@tiptap/core";
import type { CSSProperties } from "react";
import type { TEditorCommands } from "@/types";

export type CommandProps = {
  editor: Editor;
  range: Range;
};

export type TSlashCommandSectionKeys = "general" | "text-colors" | "background-colors";

export type ISlashCommandItem = {
  commandKey: TEditorCommands;
  key: string;
  title: string;
  description: string;
  searchTerms: string[];
  icon: React.ReactNode;
  iconContainerStyle?: CSSProperties;
  command: ({ editor, range }: CommandProps) => void;
  badge?: React.ReactNode;
};
