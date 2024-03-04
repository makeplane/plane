import { Editor, Range } from "@tiptap/react";
export type IMentionSuggestion = {
  id: string;
  type: string;
  entity_name: string;
  entity_identifier: string;
  avatar: string;
  title: string;
  subtitle: string;
  redirect_uri: string;
};

export type CommandProps = {
  editor: Editor;
  range: Range;
};

export type IMentionHighlight = string;
