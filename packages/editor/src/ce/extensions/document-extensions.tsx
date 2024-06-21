import { LayersIcon } from "lucide-react";
import { SlashCommand } from "@/extensions";
// hooks
import { TFileHandler } from "@/hooks/use-editor";
// plane editor types
import { TIssueEmbedConfig } from "@/plane-editor/types";
// types
import { ISlashCommandItem } from "@/types";

type Props = {
  fileHandler: TFileHandler;
  issueEmbedConfig: TIssueEmbedConfig | undefined;
};

export const DocumentEditorAdditionalExtensions = (props: Props) => {
  const { fileHandler } = props;

  const slashCommandAdditionalOptions: ISlashCommandItem[] = [
    {
      key: "issue_embed",
      title: "Issue embed",
      description: "Embed an issue from the project.",
      searchTerms: ["issue", "link", "embed"],
      icon: <LayersIcon className="h-3.5 w-3.5" />,
      command: ({ editor, range }) => {
        editor
          .chain()
          .focus()
          .insertContentAt(
            range,
            "<p class='text-sm bg-gray-300 w-fit pl-3 pr-3 pt-1 pb-1 rounded shadow-sm'>#issue_</p>"
          )
          .run();
      },
    },
  ];

  const extensions = [SlashCommand(fileHandler.upload, slashCommandAdditionalOptions)];

  return extensions;
};
