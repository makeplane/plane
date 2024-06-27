import { SlashCommand } from "@/extensions";
// hooks
import { TFileHandler } from "@/hooks/use-editor";
// plane editor types
import { TIssueEmbedConfig } from "@/plane-editor/types";

type Props = {
  fileHandler: TFileHandler;
  issueEmbedConfig: TIssueEmbedConfig | undefined;
};

export const DocumentEditorAdditionalExtensions = (props: Props) => {
  const { fileHandler } = props;

  const extensions = [SlashCommand(fileHandler.upload)];

  return extensions;
};
