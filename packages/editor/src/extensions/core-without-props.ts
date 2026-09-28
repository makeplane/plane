/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import TaskItemExtension from "@tiptap/extension-task-item";
import TaskListExtension from "@tiptap/extension-task-list";
import { TextStyle } from "@tiptap/extension-text-style";
import { Underline } from "@tiptap/extension-underline";
// plane editor imports
import { CoreEditorAdditionalExtensionsWithoutProps } from "@/extensions/core/without-props";
// extensions
import { CustomCalloutExtensionConfig } from "./callout/extension-config";
import { CustomCodeBlockExtensionWithoutProps } from "./code/without-props";
import { CustomCodeInlineExtension } from "./code-inline";
import { CustomColorExtension } from "./custom-color";
import { CustomImageExtensionConfig } from "./custom-image/extension-config";
import { CustomLinkExtension } from "./custom-link";
import { EmojiExtension } from "./emoji/extension";
import { CustomHorizontalRule } from "./horizontal-rule";
import { ImageExtensionConfig } from "./image";
import { CustomMentionExtensionConfig } from "./mentions/extension-config";
import { CustomQuoteExtension } from "./quote";
import { CustomStarterKitExtension } from "./starter-kit";
import { TableHeader, TableCell, TableRow, Table } from "./table";
import { CustomTextAlignExtension } from "./text-align";
import { WorkItemEmbedExtensionConfig } from "./work-item-embed/extension-config";
import { EraserEmbedExtension } from "./eraser-embed/extension";

export const CoreEditorExtensionsWithoutProps = [
  CustomStarterKitExtension({
    enableHistory: true,
  }),
  EmojiExtension,
  CustomQuoteExtension,
  CustomHorizontalRule,
  CustomLinkExtension,
  ImageExtensionConfig,
  CustomImageExtensionConfig,
  Underline,
  TextStyle,
  TaskListExtension.configure({
    HTMLAttributes: {
      class: "not-prose pl-2 space-y-2",
    },
  }),
  TaskItemExtension.configure({
    HTMLAttributes: {
      class: "flex",
    },
    nested: true,
  }),
  CustomCodeInlineExtension,
  CustomCodeBlockExtensionWithoutProps,
  Table,
  TableHeader,
  TableCell,
  TableRow,
  CustomMentionExtensionConfig,
  CustomTextAlignExtension,
  CustomCalloutExtensionConfig,
  CustomColorExtension,
  EraserEmbedExtension,
  ...CoreEditorAdditionalExtensionsWithoutProps,
];

export const DocumentEditorExtensionsWithoutProps = [WorkItemEmbedExtensionConfig];
