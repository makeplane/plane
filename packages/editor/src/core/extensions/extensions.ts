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

import type { HocuspocusProvider } from "@hocuspocus/provider";
import type { Extensions } from "@tiptap/core";
import { CharacterCount } from "@tiptap/extension-character-count";
import { TaskItem } from "@tiptap/extension-task-item";
import { TaskList } from "@tiptap/extension-task-list";
import { TextStyle } from "@tiptap/extension-text-style";
import { Underline } from "@tiptap/extension-underline";
import { Markdown } from "tiptap-markdown";
// extensions
import {
  CustomCalloutExtension,
  CustomCodeBlockExtension,
  CustomCodeInlineExtension,
  CustomColorExtension,
  CustomHorizontalRule,
  CustomKeymap,
  CustomLinkExtension,
  CustomMentionExtension,
  CustomQuoteExtension,
  CustomTextAlignExtension,
  CustomTypographyExtension,
  ImageExtension,
  ListKeymap,
  Table,
  TableCell,
  TableHeader,
  TableRow,
  UtilityExtension,
} from "@/extensions";
// plane editor extensions
import { CoreEditorAdditionalExtensions } from "@/plane-editor/extensions";
// types
import type { IEditorProps } from "@/types";
// local imports
import { CustomImageExtension } from "./custom-image/extension";
import { EmojiExtension } from "./emoji/extension";
import { CustomPlaceholderExtension } from "./placeholder";
import { CustomStarterKitExtension } from "./starter-kit";
import { UniqueID } from "./unique-id/extension";

type TArguments = Pick<
  IEditorProps,
  | "disabledExtensions"
  | "flaggedExtensions"
  | "fileHandler"
  | "getEditorMetaData"
  | "isTouchDevice"
  | "mentionHandler"
  | "placeholder"
  | "showPlaceholderOnEmpty"
  | "tabIndex"
  | "extendedEditorProps"
> & {
  enableHistory: boolean;
  editable: boolean;
  provider: HocuspocusProvider | undefined;
};

export const CoreEditorExtensions = (args: TArguments): Extensions => {
  const {
    disabledExtensions,
    enableHistory,
    fileHandler,
    flaggedExtensions,
    getEditorMetaData,
    isTouchDevice = false,
    mentionHandler,
    placeholder,
    showPlaceholderOnEmpty,
    tabIndex,
    editable,
    extendedEditorProps,
    provider,
  } = args;

  const extensions: Extensions = [
    CustomStarterKitExtension({
      enableHistory,
    }),
    EmojiExtension,
    CustomQuoteExtension,
    CustomHorizontalRule,
    CustomKeymap,
    ListKeymap({ tabIndex }),
    CustomLinkExtension,
    CustomTypographyExtension,
    Underline,
    TextStyle,
    TaskList.configure({
      HTMLAttributes: {
        class: "not-prose pl-2 space-y-2",
      },
    }),
    TaskItem.configure({
      HTMLAttributes: {
        class: "relative",
      },
      nested: true,
    }),
    CustomCodeBlockExtension.configure({
      enableMermaidPreview:
        !flaggedExtensions.includes("mermaid-diagrams") && !disabledExtensions?.includes("mermaid-diagrams"),
    }),
    CustomCodeInlineExtension,
    Markdown.configure({
      html: true,
      transformCopiedText: false,
      transformPastedText: true,
      breaks: true,
    }),
    Table,
    TableHeader,
    TableCell,
    TableRow,
    CustomMentionExtension(mentionHandler),
    CustomPlaceholderExtension({ placeholder, showPlaceholderOnEmpty }),
    CharacterCount,
    CustomColorExtension,
    CustomTextAlignExtension,
    CustomCalloutExtension,
    UtilityExtension({
      disabledExtensions,
      flaggedExtensions,
      fileHandler,
      getEditorMetaData,
      isEditable: editable,
      isTouchDevice,
    }),
    ...CoreEditorAdditionalExtensions({
      disabledExtensions,
      extendedEditorProps,
      flaggedExtensions,
      fileHandler,
      isEditable: editable,
      provider,
    }),
    UniqueID.configure({
      provider,
    }),
  ];

  if (!disabledExtensions.includes("image")) {
    extensions.push(
      ImageExtension({
        fileHandler,
      }),
      CustomImageExtension({
        fileHandler,
        isEditable: editable,
      })
    );
  }

  return extensions;
};
