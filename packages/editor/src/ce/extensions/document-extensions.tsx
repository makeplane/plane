import { Extensions } from "@tiptap/core";
import { SlashCommand } from "@/extensions";
// plane editor types
import { TIssueEmbedConfig } from "@/plane-editor/types";
// types
import { TExtensions, TFileHandler } from "@/types";

type Props = {
  disabledExtensions?: TExtensions[];
  fileHandler: TFileHandler;
  issueEmbedConfig: TIssueEmbedConfig | undefined;
};

export const DocumentEditorAdditionalExtensions = (props: Props) => {
  const { fileHandler } = props;

  const extensions: Extensions = [SlashCommand(fileHandler.upload)];

  return extensions;
};
