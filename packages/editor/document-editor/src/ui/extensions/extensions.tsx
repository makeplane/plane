import Collaboration from "@tiptap/extension-collaboration";
import Placeholder from "@tiptap/extension-placeholder";
// plane imports
import { SlashCommand, DragAndDrop } from "@plane/editor-extensions";
import { UploadImage, ISlashCommandItem } from "@plane/editor-core";
// ui
import { LayersIcon } from "@plane/ui";
import { IssueEmbedSuggestions, IssueWidget, IssueListRenderer, TIssueEmbedConfig } from "src/ui/extensions";
import { CollaborationProvider } from "src/providers/collaboration-provider";

type TArguments = {
  uploadFile: UploadImage;
  setHideDragHandle?: (hideDragHandlerFromDragDrop: () => void) => void;
  issueEmbedConfig?: TIssueEmbedConfig;
  provider: CollaborationProvider;
};

export const DocumentEditorExtensions = (props: TArguments) => {
  const { uploadFile, setHideDragHandle, issueEmbedConfig, provider } = props;

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

  const extensions = [
    SlashCommand(uploadFile, additionalOptions),
    DragAndDrop(setHideDragHandle),
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
    Collaboration.configure({
      document: provider.document,
    }),
  ];

  if (issueEmbedConfig) {
    extensions.push(
      // @ts-expect-error resolve this
      IssueWidget({
        widgetCallback: issueEmbedConfig.widgetCallback,
      }).configure({
        issueEmbedConfig,
      }),
      IssueEmbedSuggestions.configure({
        suggestion: {
          render: () => IssueListRenderer(issueEmbedConfig.searchCallback),
        },
      })
    );
  }

  return extensions;
};
