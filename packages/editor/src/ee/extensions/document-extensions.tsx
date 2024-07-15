// ui
import { LayersIcon } from "@plane/ui";
// extensions
import { SlashCommand } from "@/extensions";
// hooks
import { TFileHandler } from "@/hooks/use-editor";
// plane editor extensions
import { IssueEmbedSuggestions, IssueListRenderer } from "@/plane-editor/extensions";
// plane editor types
import { TIssueEmbedConfig } from "@/plane-editor/types";
// types
import { ISlashCommandItem } from "@/types";

type Props = {
  fileHandler: TFileHandler;
  issueEmbedConfig: TIssueEmbedConfig | undefined;
};

export const DocumentEditorAdditionalExtensions = (props: Props) => {
  const { fileHandler, issueEmbedConfig } = props;

  const slashCommandAdditionalOptions: ISlashCommandItem[] = [
    {
      key: "issue_embed",
      title: "Issue embed",
      description: "Embed an issue from the project.",
      searchTerms: ["issue", "link", "embed"],
      icon: <LayersIcon className="size-3.5" />,
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

  let extensions = [];
  // If searchCallback is provided, then add the slash command for issue embed. This check is required as the searchCallback is optional.
  if (issueEmbedConfig?.searchCallback) {
    extensions = [SlashCommand(fileHandler.upload, slashCommandAdditionalOptions)];
  } else {
    extensions = [SlashCommand(fileHandler.upload)];
  }

  if (issueEmbedConfig && issueEmbedConfig.searchCallback)
    extensions.push(
      IssueEmbedSuggestions.configure({
        suggestion: {
          render: () => issueEmbedConfig.searchCallback && IssueListRenderer(issueEmbedConfig.searchCallback),
        },
      })
    );

  return extensions;
};
