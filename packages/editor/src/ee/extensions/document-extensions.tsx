import { Extensions } from "@tiptap/core";
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
import { ISlashCommandItem, TExtensions } from "@/types";

type Props = {
  disabledExtensions?: TExtensions[];
  fileHandler: TFileHandler;
  issueEmbedConfig: TIssueEmbedConfig | undefined;
};

export const DocumentEditorAdditionalExtensions = (props: Props) => {
  const { disabledExtensions, fileHandler, issueEmbedConfig } = props;

  const isIssueEmbedDisabled = !!disabledExtensions?.includes("issue-embed");

  const extensions: Extensions = [];

  if (!isIssueEmbedDisabled) {
    const slashCommandAdditionalOptions: ISlashCommandItem[] = [
      {
        key: "issue-embed",
        title: "Issue embed",
        description: "Embed an issue from the project.",
        searchTerms: ["issue", "link", "embed"],
        icon: <LayersIcon className="size-3.5" />,
        command: ({ editor, range }) => {
          editor.chain().focus().insertContentAt(range, "<p>#issue_</p>").run();
        },
      },
    ];
    extensions.push(SlashCommand(fileHandler.upload, slashCommandAdditionalOptions));
  } else {
    extensions.push(SlashCommand(fileHandler.upload));
  }

  if (issueEmbedConfig && !isIssueEmbedDisabled) {
    extensions.push(
      IssueEmbedSuggestions.configure({
        suggestion: {
          render: () => issueEmbedConfig.searchCallback && IssueListRenderer(issueEmbedConfig.searchCallback),
        },
      })
    );
  }

  return extensions;
};
