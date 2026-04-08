/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { findParentNodeClosestToPos } from "@tiptap/core";
import type { AnyExtension, Extensions } from "@tiptap/core";
import { PenTool, Presentation } from "lucide-react";
// plane imports
import { LayersIcon, PageIcon, PiIcon } from "@plane/propel/icons";
import { ADDITIONAL_EXTENSIONS } from "@plane/utils";
// ce imports
import type {
  TDocumentEditorAdditionalExtensionsProps,
  TDocumentEditorAdditionalExtensionsRegistry,
} from "@/ce/extensions";
// extensions
import type { TSlashCommandAdditionalOption } from "@/extensions";
import { SlashCommands, WorkItemEmbedExtension } from "@/extensions";
// helpers
import { insertPageEmbed } from "@/helpers/editor-commands";
// plane editor extensions
import {
  IssueEmbedSuggestions,
  WorkItemSuggestionsDropdownRenderer,
  PageEmbedExtension,
  PageEmbedReadOnlyExtension,
} from "@/plane-editor/extensions";
// types
import type { TExtensions } from "@/types";
// local imports
import { CustomAIBlockExtension } from "./ai-block/extension";
import { CustomCollaborationCaret } from "./collaboration-caret";
import { PiUtilityEmbedExtension } from "./pi-utility-embed/extension";
import { CommentsExtension } from "./comments";
import { DrawioExtension } from "./drawio/extension";
import { EDrawioMode } from "./drawio/types";
import { ProBadge } from "../components/badges/pro-badge";
import { insertAIBlock } from "../helpers/editor-commands";

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
        icon: <PageIcon className="size-3.5" />,
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
    // Draw.io diagram slash command
    isEnabled: (disabledExtensions, flaggedExtensions) =>
      !disabledExtensions.includes("drawio") && !flaggedExtensions.includes("drawio"),
    getOption: () => ({
      commandKey: "drawio-diagram",
      key: "drawio",
      title: "Draw.io diagram",
      description: "Create diagrams, flowcharts, and visual documentation.",
      searchTerms: ["draw.io", "diagram", "flowchart", "chart", "visual", "drawing"],
      icon: <PenTool className="size-3.5" />,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).insertDrawioDiagram({ mode: EDrawioMode.DIAGRAM }).run();
      },
      section: "general",
      pushAfter: "attachment",
    }),
  },
  {
    isEnabled: (disabledExtensions, flaggedExtensions) =>
      !disabledExtensions.includes("drawio") && !flaggedExtensions.includes("drawio"),
    getOption: () => ({
      commandKey: "drawio-board",
      key: "drawio-board",
      title: "Draw.io board",
      description: "Create whiteboards with freehand drawing and collaboration.",
      searchTerms: ["draw.io", "board", "whiteboard", "sketch", "brainstorm", "collaboration", "kanban"],
      icon: <Presentation className="size-3.5" />,
      command: ({ editor, range }) => {
        editor.chain().focus().deleteRange(range).insertDrawioDiagram({ mode: EDrawioMode.BOARD }).run();
      },
      section: "general",
      pushAfter: "drawio-diagram",
    }),
  },
  {
    // AI block slash command
    isEnabled: (disabledExtensions, flaggedExtensions) =>
      !flaggedExtensions?.includes("ai-block") && !disabledExtensions?.includes("ai-block"),
    getOption: ({ flaggedExtensions }) => {
      return {
        commandKey: "ai-block",
        key: "ai-block",
        title: "AI Block",
        icon: <PiIcon className="size-3.5 text-icon-secondary" />,
        description: "Insert an AI block",
        searchTerms: ["ai", "artificial", "intelligence", "smart", "assistant", "prompt", "generate"],
        command: ({ editor, range }) => insertAIBlock(editor, range),
        badge: flaggedExtensions?.includes("ai-block") ? <ProBadge /> : undefined,
        section: "general",
        pushAfter: "callout",
        // Prevent showing AI block option when already inside an AI block
        shouldShow: (editor) => {
          const { $from } = editor.state.selection;
          const aiBlockName: string = ADDITIONAL_EXTENSIONS.AI_BLOCK;
          const isInsideAIBlock = (node: { type: { name: string } }) => node.type.name === aiBlockName;
          const parentAIBlock = findParentNodeClosestToPos($from, isInsideAIBlock);
          return !parentAIBlock;
        },
      };
    },
  },
];

/**
 * Main extension registry
 * Each entry defines a TipTap extension with its own enabling logic.
 * Extensions check `isEditable` to return appropriate variants for read-only mode (e.g., version diff).
 */
const extensionRegistry: TDocumentEditorAdditionalExtensionsRegistry[] = [
  {
    // Slash commands extension (edit-only)
    isEnabled: (disabledExtensions) => !disabledExtensions.includes("slash-commands"),
    getExtension: (props) => {
      if (!props.isEditable) return undefined;

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
    // Work item embed extension (works in both modes)
    isEnabled: (disabledExtensions) => !disabledExtensions.includes("issue-embed"),
    getExtension: ({ extendedEditorProps }) => {
      const workItemEmbedConfig = extendedEditorProps.embedHandler?.issue;
      if (!workItemEmbedConfig?.widgetCallback) return undefined;

      return WorkItemEmbedExtension({
        widgetCallback: workItemEmbedConfig.widgetCallback,
      });
    },
  },
  {
    // Work item embed suggestions extension (edit-only)
    isEnabled: (disabledExtensions) => !disabledExtensions.includes("issue-embed"),
    getExtension: ({ isEditable, extendedEditorProps }) => {
      if (!isEditable) return undefined;

      const issueConfig = extendedEditorProps.embedHandler?.issue;
      const searchCallback = issueConfig?.searchCallback;
      if (!searchCallback) return undefined;

      return IssueEmbedSuggestions.configure({
        suggestion: {
          render: WorkItemSuggestionsDropdownRenderer(searchCallback),
        },
      });
    },
  },
  {
    // Collaboration cursor extension (edit-only, requires provider)
    isEnabled: (disabledExtensions) => !disabledExtensions.includes("collaboration-caret"),
    getExtension: ({ isEditable, provider, userDetails }) => {
      if (!isEditable || !provider) return undefined;

      return CustomCollaborationCaret({
        provider,
        userDetails,
      });
    },
  },
  {
    // Page embed extension (returns read-only variant when not editable)
    isEnabled: (disabledExtensions) => !disabledExtensions.includes("nested-pages"),
    getExtension: ({ isEditable, extendedEditorProps }) => {
      const pageConfig = extendedEditorProps.embedHandler?.page;
      if (!pageConfig?.widgetCallback) return undefined;

      if (!isEditable) {
        return PageEmbedReadOnlyExtension({
          widgetCallback: pageConfig.widgetCallback,
        });
      }

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
    // Comments extension (hides comments in read-only/diff mode)
    isEnabled: (disabledExtensions) => !disabledExtensions.includes("comments"),
    getExtension: ({ isEditable, extendedEditorProps, flaggedExtensions }) => {
      const { onClick, onDelete, onRestore, onResolve, onUnresolve, shouldHideComment } =
        extendedEditorProps.commentConfig ?? {};

      return CommentsExtension({
        isFlagged: flaggedExtensions.includes("comments"),
        onCommentClick: isEditable ? onClick : undefined,
        onCommentDelete: isEditable ? onDelete : undefined,
        onCommentRestore: isEditable ? onRestore : undefined,
        onCommentResolve: isEditable ? onResolve : undefined,
        onCommentUnresolve: isEditable ? onUnresolve : undefined,
        shouldHideComment: !isEditable || !!shouldHideComment,
      });
    },
  },
  {
    // Draw.io extension (works in both modes, onClick only in edit mode)
    isEnabled: (disabledExtensions) => !disabledExtensions.includes("drawio"),
    getExtension: ({ isEditable, flaggedExtensions, fileHandler, extendedEditorProps }) => {
      const { extensionOptions } = extendedEditorProps ?? {};
      const { onClick } = extensionOptions?.[ADDITIONAL_EXTENSIONS.DRAWIO] ?? {};

      return DrawioExtension({
        isFlagged: flaggedExtensions.includes("drawio"),
        fileHandler,
        onClick: isEditable ? onClick : undefined,
        logoSpinner: extendedEditorProps?.logoSpinner,
      });
    },
  },
  {
    // AI block extension (edit-only)
    isEnabled: (disabledExtensions) => !disabledExtensions.includes("ai-block"),
    getExtension: ({ flaggedExtensions, extendedEditorProps }) =>
      CustomAIBlockExtension({
        aiBlockHandlers: extendedEditorProps?.aiBlockHandlers,
        aiBlockWidgetCallback: extendedEditorProps?.aiBlockWidgetCallback,
        isFlagged: flaggedExtensions.includes("ai-block"),
      }),
  },
  {
    // PI utility embed extension (only for page documents)
    isEnabled: (disabledExtensions) => !disabledExtensions.includes("pi-utility-embed"),
    getExtension: ({ extendedEditorProps }) =>
      PiUtilityEmbedExtension({
        widgetCallback: extendedEditorProps?.embedHandler?.piUtilityEmbed?.widgetCallback,
      }),
  },
];

/**
 * Returns all enabled extensions for the document editor.
 * Pass `isEditable: false` for read-only mode (e.g., version diff editor).
 */
export function DocumentEditorAdditionalExtensions(props: TDocumentEditorAdditionalExtensionsProps) {
  const { disabledExtensions, flaggedExtensions } = props;

  const documentExtensions: Extensions = extensionRegistry
    .filter((config) => config.isEnabled(disabledExtensions, flaggedExtensions))
    .map((config) => config.getExtension(props))
    .filter((extension): extension is AnyExtension => extension !== undefined);

  return documentExtensions;
}
