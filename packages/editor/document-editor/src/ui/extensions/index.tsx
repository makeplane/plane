import Placeholder from "@tiptap/extension-placeholder";
import { IssueWidgetExtension } from "src/ui/extensions/widgets/issue-embed-widget";

import { IIssueEmbedConfig } from "src/ui/extensions/widgets/issue-embed-widget/types";

import { SlashCommand, DragAndDrop } from "@plane/editor-extensions";
import { ISlashCommandItem, UploadImage } from "@plane/editor-core";
import { IssueSuggestions } from "src/ui/extensions/widgets/issue-embed-suggestion-list";
import { LayersIcon } from "@plane/ui";

export const DocumentEditorExtensions = (
  uploadFile: UploadImage,
  issueEmbedConfig?: IIssueEmbedConfig,
  setIsSubmitting?: (isSubmitting: "submitting" | "submitted" | "saved") => void
) => {
  const additionalOptions: ISlashCommandItem[] = [
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

  return [
    SlashCommand(uploadFile, setIsSubmitting, additionalOptions),
    DragAndDrop,
    Placeholder.configure({
      placeholder: ({ node }) => {
        if (node.type.name === "heading") {
          return `Heading ${node.attrs.level}`;
        }
        if (node.type.name === "image" || node.type.name === "table") {
          return "";
        }

        return "Press '/' for commands...";
      },
      includeChildren: true,
    }),
    IssueWidgetExtension({ issueEmbedConfig }),
    IssueSuggestions(issueEmbedConfig ? issueEmbedConfig.issues : []),
  ];
};
