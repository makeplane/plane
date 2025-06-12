import { Extension } from "@tiptap/core";
import { FileText } from "lucide-react";
// core imports
import {
  TDocumentEditorAdditionalExtensionsProps,
  TDocumentEditorAdditionalExtensionsRegistry,
} from "src/ce/extensions";
// plane imports
import { LayersIcon } from "@plane/ui";
// extensions
import { SlashCommands, TSlashCommandAdditionalOption } from "@/extensions";
// helpers
import { insertPageEmbed } from "@/helpers/editor-commands";
// plane editor extensions
import { IssueEmbedSuggestions, IssueListRenderer, PageEmbedExtension } from "@/plane-editor/extensions";
// types
import { TExtensions } from "@/types";
// local imports
import { CustomCollaborationCursor } from "./collaboration-cursor";

/**
 * Registry for slash commands
 * Each entry defines a single slash command option with its own enabling logic
 */
const slashCommandRegistry = [
  {
    // Work item embed slash command
    isEnabled: (disabledExtensions: TExtensions[]) => !disabledExtensions.includes("issue-embed"),
    getOption: (): TSlashCommandAdditionalOption => ({
      commandKey: "issue-embed",
      key: "issue-embed",
      title: "Work item",
      description: "Embed work item from the project.",
      searchTerms: ["work item", "link", "embed"],
      icon: <LayersIcon className="size-3.5" />,
      command: ({ editor, range }) => {
        editor.chain().focus().insertContentAt(range, "<p>#workitem_</p>").run();
      },
      section: "general",
      pushAfter: "callout",
    }),
  },
  {
    // Page embed slash command
    isEnabled: (disabledExtensions: TExtensions[]) => !disabledExtensions.includes("nested-pages"),
    getOption: ({ embedConfig }: TDocumentEditorAdditionalExtensionsProps): TSlashCommandAdditionalOption | null => {
      // Only enable if page config with createCallback exists
      const pageConfig = embedConfig?.page;
      if (!pageConfig?.createCallback) return null;

      const createCallback = pageConfig.createCallback;
      return {
        commandKey: "page-embed",
        key: "page-embed",
        title: "Page",
        description: "Embed a page from the project.",
        searchTerms: ["page", "link", "embed", "sub-page"],
        icon: <FileText className="size-3.5" />,
        command: async ({ editor, range }) => {
          const res = await createCallback();
          if (!res) return;
          insertPageEmbed(
            {
              pageId: res.pageId,
              workspaceSlug: res.workspaceSlug,
            },
            editor,
            range
          );
        },
        section: "general",
        pushAfter: "issue-embed",
      };
    },
  },
];

/**
 * Main extension registry
 * Each entry defines a TipTap extension with its own enabling logic
 */
const extensionRegistry: TDocumentEditorAdditionalExtensionsRegistry[] = [
  {
    // Slash commands extension
    isEnabled: (disabledExtensions) => !disabledExtensions.includes("slash-commands"),
    getExtension: (props) => {
      // Get enabled slash command options from the registry
      const slashCommandOptions = slashCommandRegistry
        .filter((command) => command.isEnabled(props.disabledExtensions || []))
        .map((command) => command.getOption(props))
        .filter((option): option is TSlashCommandAdditionalOption => option !== null);

      return SlashCommands({
        additionalOptions: slashCommandOptions,
        disabledExtensions: props.disabledExtensions,
      });
    },
  },
  {
    // Issue embed suggestions extension
    isEnabled: (disabledExtensions) => !disabledExtensions.includes("issue-embed"),
    getExtension: ({ embedConfig }) => {
      const issueConfig = embedConfig?.issue;
      const searchCallback = issueConfig?.searchCallback;

      // Only enable if search callback exists
      if (!searchCallback) return undefined;

      return IssueEmbedSuggestions.configure({
        suggestion: {
          render: () => IssueListRenderer(searchCallback),
        },
      });
    },
  },
  {
    // Collaboration cursor extension
    isEnabled: (disabledExtensions) => !disabledExtensions.includes("collaboration-cursor"),
    getExtension: ({ provider, userDetails }) =>
      provider &&
      CustomCollaborationCursor({
        provider,
        userDetails,
      }),
  },
  {
    // Page embed extension
    isEnabled: () => true,
    getExtension: ({ embedConfig }) => {
      const pageConfig = embedConfig?.page;

      // Only enable if widget callback exists
      if (!pageConfig) return undefined;

      return PageEmbedExtension({
        widgetCallback: pageConfig.widgetCallback,
        archivePage: pageConfig.archivePage,
        unarchivePage: pageConfig.unarchivePage,
        deletePage: pageConfig.deletePage,
        getPageDetailsCallback: pageConfig.getPageDetailsCallback,
      });
    },
  },
];

/**
 * Returns all enabled extensions for the document editor
 */
export const DocumentEditorAdditionalExtensions = (props: TDocumentEditorAdditionalExtensionsProps) => {
  const { disabledExtensions = [] } = props;

  // Filter enabled extensions and flatten the result
  const extensions: Extension[] = extensionRegistry
    .filter((config) => config.isEnabled(disabledExtensions))
    .map((config) => config.getExtension(props))
    .filter((extension): extension is Extension => extension !== undefined);

  return extensions;
};
