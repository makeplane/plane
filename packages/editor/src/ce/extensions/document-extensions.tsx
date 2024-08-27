import { Extensions } from "@tiptap/core";
import { SlashCommand } from "@/extensions";
// hooks
import { TFileHandler } from "@/hooks/use-editor";
// plane editor types
import { TIssueEmbedConfig } from "@/plane-editor/types";
// types
import { TExtensions } from "@/types";

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
