import { HocuspocusProvider } from "@hocuspocus/provider";
import { AnyExtension } from "@tiptap/core";
// ui
import { LayersIcon } from "@plane/ui";
// extensions
import { SlashCommands, TSlashCommandAdditionalOption } from "@/extensions";
// plane editor extensions
import { IssueEmbedSuggestions, IssueListRenderer } from "@/plane-editor/extensions";
// plane editor types
import { TIssueEmbedConfig } from "@/plane-editor/types";
// types
import { TExtensions, TUserDetails } from "@/types";
// local extensions
import { CustomCollaborationCursor } from "./collaboration-cursor";

type Props = {
  disabledExtensions?: TExtensions[];
  issueEmbedConfig: TIssueEmbedConfig | undefined;
  provider: HocuspocusProvider;
  userDetails: TUserDetails;
};

type ExtensionConfig = {
  isEnabled: (disabledExtensions: TExtensions[]) => boolean;
  getExtension: (props: Props) => AnyExtension;
};

const createSlashCommandOptions: TSlashCommandAdditionalOption[] = [
  {
    commandKey: "issue-embed",
    key: "issue-embed",
    title: "Work item embed",
    description: "Embed work item from the project.",
    searchTerms: ["work item", "link", "embed"],
    icon: <LayersIcon className="size-3.5" />,
    command: ({ editor, range }) => {
      editor.chain().focus().insertContentAt(range, "<p>#workitem_</p>").run();
    },
    section: "general",
    pushAfter: "callout",
  },
];

const extensionRegistry: ExtensionConfig[] = [
  {
    isEnabled: (disabledExtensions) => !disabledExtensions.includes("slash-commands"),
    getExtension: () => SlashCommands({ additionalOptions: createSlashCommandOptions }),
  },
  {
    isEnabled: (disabledExtensions) => !disabledExtensions.includes("issue-embed"),
    getExtension: ({ issueEmbedConfig }) =>
      IssueEmbedSuggestions.configure({
        suggestion: {
          render: () => issueEmbedConfig?.searchCallback && IssueListRenderer(issueEmbedConfig.searchCallback),
        },
      }),
  },
  {
    isEnabled: (disabledExtensions) => !disabledExtensions.includes("collaboration-cursor"),
    getExtension: ({ provider, userDetails }) => CustomCollaborationCursor({ provider, userDetails }),
  },
];

export const DocumentEditorAdditionalExtensions = (props: Props) => {
  const { disabledExtensions = [] } = props;

  const documentExtensions = extensionRegistry
    .filter((config) => config.isEnabled(disabledExtensions))
    .map((config) => config.getExtension(props));

  return documentExtensions;
};
