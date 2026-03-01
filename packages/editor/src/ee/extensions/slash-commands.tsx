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

import type { Editor } from "@tiptap/core";
// extensions
import { Columns2, Columns3, Columns4, FileCode2, Paperclip, Sigma, SquareRadical, Workflow } from "lucide-react";
import { VideoIcon } from "@plane/propel/icons";
import type { TSlashCommandAdditionalOption } from "@/extensions";
// types
import { EExternalEmbedAttributeNames } from "@/plane-editor/types/external-embed";
import type { CommandProps, IEditorProps, TExtensions } from "@/types";
import type { TExtendedEditorCommands } from "@/plane-editor/types";
// multi-column utils
import { findColumnList } from "@/plane-editor/extensions/multi-column/utils";
// plane editor
import { ProBadge } from "../components/badges/pro-badge";
import {
  insertAttachment,
  insertBlockMath,
  insertExternalEmbed,
  insertInlineMath,
  insertColumnListCommand,
} from "../helpers/editor-commands";
import { EMBED_SEARCH_TERMS } from "./external-embed/constants";

type Props = Pick<IEditorProps, "disabledExtensions" | "flaggedExtensions"> & {
  editor: Editor;
};

// Column configurations
const COLUMN_CONFIGS = [
  {
    count: 2,
    key: "two-columns",
    title: "2 Columns",
    icon: Columns2,
    searchTerms: ["column", "columns", "2", "two", "layout", "side"],
  },
  {
    count: 3,
    key: "three-columns",
    title: "3 Columns",
    icon: Columns3,
    searchTerms: ["column", "columns", "3", "three", "layout", "side"],
  },
  {
    count: 4,
    key: "four-columns",
    title: "4 Columns",
    icon: Columns4,
    searchTerms: ["column", "columns", "4", "four", "layout", "side"],
  },
];

const coreSlashCommandRegistry: {
  isEnabled: (disabledExtensions: TExtensions[], flaggedExtensions: TExtensions[]) => boolean;
  getOptions: (props: Props) => TSlashCommandAdditionalOption[];
}[] = [
  {
    isEnabled: (disabledExtensions, flaggedExtensions) =>
      !disabledExtensions.includes("attachments") && !flaggedExtensions.includes("attachments"),
    getOptions: () => [
      {
        commandKey: "attachment",
        key: "attachment",
        title: "Attachment",
        description: "Insert a file",
        searchTerms: ["image", "photo", "picture", "pdf", "media", "upload", "audio", "video", "file", "attachment"],
        icon: <Paperclip className="size-3.5" />,
        command: ({ editor, range }) => insertAttachment({ editor, event: "insert", range, acceptedFileType: "all" }),
        section: "general",
        pushAfter: "image",
      },
    ],
  },
  {
    // Block equation slash command
    isEnabled: (disabledExtensions, flaggedExtensions) =>
      !flaggedExtensions?.includes("mathematics") && !disabledExtensions?.includes("mathematics"),
    getOptions: ({ flaggedExtensions }) => [
      {
        commandKey: "block-equation",
        key: "block-equation",
        title: "Block equation",
        description: "Insert block equation",
        searchTerms: ["math", "equation", "latex", "formula", "block"],
        icon: <Sigma className="size-3.5" />,
        command: ({ editor, range }) => {
          insertBlockMath({ editor, range, latex: "" });
        },
        section: "general",
        pushAfter: "attachment",
        badge: flaggedExtensions?.includes("mathematics") ? <ProBadge /> : undefined,
      },
    ],
  },
  {
    // Inline equation slash command
    isEnabled: (disabledExtensions, flaggedExtensions) =>
      !flaggedExtensions?.includes("mathematics") && !disabledExtensions?.includes("mathematics"),
    getOptions: ({ flaggedExtensions }) => [
      {
        commandKey: "inline-equation",
        key: "inline-equation",
        title: "Inline equation",
        description: "Insert inline equation",
        searchTerms: ["math", "equation", "latex", "formula", "inline"],
        icon: <SquareRadical className="size-3.5" />,
        command: ({ editor, range }) => {
          insertInlineMath({ editor, range, latex: "" });
        },
        section: "general",
        pushAfter: "block-equation",
        badge: flaggedExtensions?.includes("mathematics") ? <ProBadge /> : undefined,
      },
    ],
  },
  {
    // Mermaid diagram slash command
    isEnabled: (disabledExtensions, flaggedExtensions) =>
      !flaggedExtensions?.includes("mermaid-diagrams") && !disabledExtensions?.includes("mermaid-diagrams"),
    getOptions: () => [
      {
        commandKey: "code",
        key: "mermaid-diagram",
        title: "Mermaid diagram",
        description: "Insert a Mermaid diagram code block.",
        searchTerms: ["mermaid", "diagram", "flowchart", "sequence", "graph"],
        icon: <Workflow className="size-3.5" />,
        command: ({ editor, range }) => {
          editor.chain().focus().deleteRange(range).setCodeBlock({ language: "mermaid" }).run();
        },
        section: "general",
        pushAfter: "code",
      },
    ],
  },
  {
    // External embed slash command
    isEnabled: (disabledExtensions, flaggedExtensions) =>
      !flaggedExtensions?.includes("external-embed") && !disabledExtensions?.includes("external-embed"),
    getOptions: ({ flaggedExtensions }) => [
      {
        commandKey: "external-embed",
        key: "embed",
        title: "Embed",
        icon: <FileCode2 className="size-3.5" />,
        description: "Insert an Embed",
        searchTerms: EMBED_SEARCH_TERMS,
        command: ({ editor, range }: CommandProps) =>
          insertExternalEmbed({ editor, range, [EExternalEmbedAttributeNames.IS_RICH_CARD]: false }),
        badge: flaggedExtensions?.includes("external-embed") ? <ProBadge /> : undefined,
        section: "general",
        pushAfter: "code",
      },
    ],
  },
  {
    // Video attachment slash command
    isEnabled: (disabledExtensions, flaggedExtensions) =>
      !flaggedExtensions?.includes("video-attachments") && !disabledExtensions?.includes("attachments"),
    getOptions: ({ flaggedExtensions }) => [
      {
        commandKey: "attachment",
        key: "video",
        title: "Video",
        icon: <VideoIcon className="size-3.5" />,
        description: "Insert a video",
        searchTerms: ["video", "mp4", "mov", "media", "clip"],
        command: ({ editor, range }: CommandProps) =>
          insertAttachment({
            editor,
            range,
            event: "insert",
            preview: true,
            acceptedFileType: "video",
          }),
        badge: flaggedExtensions?.includes("video-attachments") ? <ProBadge /> : undefined,
        section: "general",
        pushAfter: "attachment",
      },
    ],
  },
  {
    isEnabled: (disabledExtensions, flaggedExtensions) =>
      !disabledExtensions.includes("multi-column") && !flaggedExtensions.includes("multi-column"),
    getOptions: () =>
      COLUMN_CONFIGS.map((config, index) => ({
        commandKey: "multi-column",
        key: config.key,
        title: config.title,
        icon: <config.icon className="size-3.5" />,
        description: `Create a ${config.count}-column layout`,
        searchTerms: config.searchTerms,
        command: ({ editor, range }: CommandProps) => insertColumnListCommand(editor, range, config.count),
        section: "general" as const,
        pushAfter: (index === 0 ? "attachment" : COLUMN_CONFIGS[index - 1].key) as TExtendedEditorCommands,
      })),
  },
];

export const coreEditorAdditionalSlashCommandOptions = (props: Props): TSlashCommandAdditionalOption[] => {
  const { disabledExtensions = [], flaggedExtensions = [], editor } = props;

  // Filter enabled slash command options from the registry and flatten the arrays
  const options = coreSlashCommandRegistry
    .filter((command) => command.isEnabled(disabledExtensions, flaggedExtensions))
    .flatMap((command) => command.getOptions(props));

  // Filter out column options when inside a column
  if (editor) {
    const isInsideColumn = findColumnList(editor.state, editor.state.selection.from) !== null;

    if (isInsideColumn) {
      const COLUMN_COMMAND_KEYS = COLUMN_CONFIGS.map((config) => config.key);
      return options.filter((option) => !COLUMN_COMMAND_KEYS.includes(option.commandKey));
    }
  }

  return options;
};
