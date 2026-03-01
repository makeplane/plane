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

import type { Extensions } from "@tiptap/core";
import TaskItem from "@tiptap/extension-task-item";
import TaskList from "@tiptap/extension-task-list";
import { TextStyle } from "@tiptap/extension-text-style";
import { Underline } from "@tiptap/extension-underline";
// plane editor extensions
import {
  CoreEditorAdditionalExtensionsWithoutProps,
  DocumentEditorAdditionalExtensionsWithoutProps,
} from "@/plane-editor/extensions/core/without-props";
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

export const CoreEditorExtensionsWithoutProps: Extensions = [
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
  TaskList.configure({
    HTMLAttributes: {
      class: "not-prose pl-2 space-y-2",
    },
  }),
  TaskItem.configure({
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
  ...CoreEditorAdditionalExtensionsWithoutProps,
];

export const DocumentEditorExtensionsWithoutProps: Extensions = [
  WorkItemEmbedExtensionConfig,
  ...DocumentEditorAdditionalExtensionsWithoutProps,
];
