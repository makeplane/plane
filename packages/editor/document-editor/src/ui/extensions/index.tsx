import Placeholder from "@tiptap/extension-placeholder";
import { IssueWidgetExtension } from "./widgets/IssueEmbedWidget";

import { IIssueEmbedConfig } from "./widgets/IssueEmbedWidget/types";

import { SlashCommand, DragAndDrop } from "@plane/editor-extensions";
import { ISlashCommandItem, UploadImage } from "@plane/editor-types";
import { IssueSuggestions } from "./widgets/IssueEmbedSuggestionList";
import { LayersIcon } from "@plane/ui";

export const DocumentEditorExtensions = (
  uploadFile: UploadImage,
  issueEmbedConfig?: IIssueEmbedConfig,
  setIsSubmitting?: (
    isSubmitting: "submitting" | "submitted" | "saved",
  ) => void,
) => {
  const additonalOptions: ISlashCommandItem[] = [
    {
      title: "Issue Embed",
      description: "Embed an issue from the project",
      searchTerms: ["Issue", "Iss"],
      icon: <LayersIcon height={"20px"} width={"20px"} />,
      command: ({ editor, range }) => {
        editor
          .chain()
          .focus()
          .insertContentAt(
            range,
            "<p class='text-sm bg-gray-300 w-fit pl-3 pr-3 pt-1 pb-1 rounded shadow-sm'>#issue_</p>",
          )
          .run();
      },
    },
  ];

  return [
    SlashCommand(uploadFile, setIsSubmitting, additonalOptions),
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
