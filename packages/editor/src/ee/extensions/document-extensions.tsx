import { HocuspocusProvider } from "@hocuspocus/provider";
import { Extensions } from "@tiptap/core";
// ui
import { LayersIcon } from "@plane/ui";
// extensions
import { SlashCommand } from "@/extensions";
// plane editor extensions
import { IssueEmbedSuggestions, IssueListRenderer } from "@/plane-editor/extensions";
// plane editor types
import { TIssueEmbedConfig } from "@/plane-editor/types";
// types
import { ISlashCommandItem, TExtensions, TFileHandler, TUserDetails } from "@/types";
// local extensions
import { CustomCollaborationCursor } from "./collaboration-cursor";

type Props = {
  disabledExtensions?: TExtensions[];
  fileHandler: TFileHandler;
  issueEmbedConfig: TIssueEmbedConfig | undefined;
  provider: HocuspocusProvider;
  userDetails: TUserDetails;
};

export const DocumentEditorAdditionalExtensions = (props: Props) => {
  const { disabledExtensions, fileHandler, issueEmbedConfig, provider, userDetails } = props;

  const isIssueEmbedDisabled = !!disabledExtensions?.includes("issue-embed");
  const isCollaborationCursorDisabled = !!disabledExtensions?.includes("collaboration-cursor");

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

  if (!isCollaborationCursorDisabled) {
    extensions.push(
      CustomCollaborationCursor({
        provider,
        userDetails,
      })
    );
  }

  return extensions;
};
