import { AnyExtension, Extensions } from "@tiptap/core";
import { FileText, Paperclip } from "lucide-react";
// plane imports
import { LayersIcon } from "@plane/propel/icons";
import { ADDITIONAL_EXTENSIONS } from "@plane/utils";
// ce imports
import { TDocumentEditorAdditionalExtensionsProps, TDocumentEditorAdditionalExtensionsRegistry } from "@/ce/extensions";
// extensions
import { SlashCommands, TSlashCommandAdditionalOption, WorkItemEmbedExtension } from "@/extensions";
// helpers
import { insertPageEmbed } from "@/helpers/editor-commands";
// plane editor extensions
import { IssueEmbedSuggestions, IssueListRenderer, PageEmbedExtension } from "@/plane-editor/extensions";
// types
import { TExtensions } from "@/types";
// local imports
import { insertAttachment } from "../helpers/editor-commands";
import { CustomAttachmentExtension } from "./attachments/extension";
import { CustomCollaborationCursor } from "./collaboration-cursor";
import { CommentsExtension } from "./comments";

/**
 * Registry for slash commands
 * Each entry defines a single slash command option with its own enabling logic
 */
const slashCommandRegistry: {
  isEnabled: (disabledExtensions: TExtensions[], flaggedExtensions: TExtensions[]) => boolean;
  getOption: (props: TDocumentEditorAdditionalExtensionsProps) => TSlashCommandAdditionalOption | null;
}[] = [
  {
    // Work item embed slash command
    isEnabled: (disabledExtensions, flaggedExtensions) =>
      !disabledExtensions.includes("issue-embed") && !flaggedExtensions.includes("issue-embed"),
    getOption: () => ({
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
    isEnabled: (disabledExtensions, flaggedExtensions) =>
      !disabledExtensions.includes("nested-pages") && !flaggedExtensions.includes("nested-pages"),
    getOption: ({ extendedEditorProps }) => {
      // Only enable if page config with createCallback exists
      const pageConfig = extendedEditorProps.embedHandler?.page;
      const createCallback = pageConfig?.createCallback;
      if (!createCallback) return null;

      return {
        commandKey: "page-embed",
        key: "page-embed",
        title: "Page",
        description: "Embed a page from the project.",
        searchTerms: ["page", "link", "embed", "sub-page"],
        icon: <FileText className="size-3.5" />,
        command: async ({ editor, range }) => {
          const currentPos = editor.state.selection.from;
          let pageEmbedNodesBeforeCurrentPos = 0;
          editor.state.doc.nodesBetween(0, currentPos, (node) => {
            if (node.type.name === ADDITIONAL_EXTENSIONS.PAGE_EMBED_COMPONENT) pageEmbedNodesBeforeCurrentPos++;
          });
          const res = await createCallback(pageEmbedNodesBeforeCurrentPos);
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
  {
    // Attachment slash command
    isEnabled: (disabledExtensions, flaggedExtensions) =>
      !disabledExtensions.includes("attachments") && !flaggedExtensions.includes("attachments"),
    getOption: () => ({
      commandKey: "attachment",
      key: "attachment",
      title: "Attachment",
      description: "Insert a file",
      searchTerms: ["image", "photo", "picture", "pdf", "media", "upload", "audio", "video", "file", "attachment"],
      icon: <Paperclip className="size-3.5" />,
      command: ({ editor, range }) => insertAttachment({ editor, event: "insert", range }),
      section: "general",
      pushAfter: "image",
    }),
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
        .filter((command) => command.isEnabled(props.disabledExtensions, props.flaggedExtensions))
        .map((command) => command.getOption(props))
        .filter((option): option is TSlashCommandAdditionalOption => option !== null);

      return SlashCommands({
        additionalOptions: slashCommandOptions,
        disabledExtensions: props.disabledExtensions,
        flaggedExtensions: props.flaggedExtensions,
      });
    },
  },
  {
    // Page embed extension
    isEnabled: (disabledExtensions) => !disabledExtensions.includes("issue-embed"),
    getExtension: ({ extendedEditorProps }) => {
      const workItemEmbedConfig = extendedEditorProps.embedHandler?.issue;

      // Only enable if widget callback exists
      if (!workItemEmbedConfig) return undefined;

      return WorkItemEmbedExtension({
        widgetCallback: workItemEmbedConfig.widgetCallback,
      });
    },
  },
  {
    // Work item embed suggestions extension
    isEnabled: (disabledExtensions) => !disabledExtensions.includes("issue-embed"),
    getExtension: ({ extendedEditorProps }) => {
      const issueConfig = extendedEditorProps.embedHandler?.issue;
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
    isEnabled: (disabledExtensions) => !disabledExtensions.includes("nested-pages"),
    getExtension: ({ extendedEditorProps }) => {
      const pageConfig = extendedEditorProps.embedHandler?.page;

      // Only enable if widget callback exists
      if (!pageConfig) return undefined;

      return PageEmbedExtension({
        widgetCallback: pageConfig.widgetCallback,
        archivePage: pageConfig.archivePage,
        unarchivePage: pageConfig.unarchivePage,
        deletePage: pageConfig.deletePage,
        getPageDetailsCallback: pageConfig.getPageDetailsCallback,
        onNodesPosChanged: pageConfig.onNodesPosChanged,
      });
    },
  },
  {
    // Attachment extension
    isEnabled: (disabledExtensions) => !disabledExtensions.includes("attachments"),
    getExtension: ({ flaggedExtensions, fileHandler, isEditable }) =>
      CustomAttachmentExtension({
        fileHandler,
        isFlagged: flaggedExtensions.includes("attachments"),
        isEditable,
      }),
  },
  {
    // Comment mark extension (for styling)
    isEnabled: (disabledExtensions) => !disabledExtensions.includes("comments"),
    getExtension: ({ extendedEditorProps, flaggedExtensions }) => {
      const { onClick, onDelete, onRestore, onResolve, onUnresolve, shouldHideComment } =
        extendedEditorProps.commentConfig ?? {};
      return CommentsExtension({
        isFlagged: flaggedExtensions.includes("comments"),
        onCommentClick: onClick,
        onCommentDelete: onDelete,
        onCommentRestore: onRestore,
        onCommentResolve: onResolve,
        onCommentUnresolve: onUnresolve,
        shouldHideComment: !!shouldHideComment,
      });
    },
  },
];

/**
 * Returns all enabled extensions for the document editor
 */
export const DocumentEditorAdditionalExtensions = (props: TDocumentEditorAdditionalExtensionsProps) => {
  const { disabledExtensions, flaggedExtensions } = props;

  // Filter enabled extensions and flatten the result
  const documentExtensions: Extensions = extensionRegistry
    .filter((config) => config.isEnabled(disabledExtensions, flaggedExtensions))
    .map((config) => config.getExtension(props))
    .filter((extension): extension is AnyExtension => extension !== undefined);

  return documentExtensions;
};
