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

import type { Editor, Range } from "@tiptap/core";
// plane editor extensions
import type { InsertAttachmentComponentProps } from "@/plane-editor/extensions/attachments/types";
import { EExternalEmbedAttributeNames } from "@/plane-editor/types/external-embed";

export const insertAttachment = ({
  editor,
  event,
  pos,
  file,
  range,
  preview,
  acceptedFileType,
}: {
  editor: Editor;
  event: "insert" | "drop";
  pos?: number | null;
  file?: File;
  range?: Range;
  preview?: boolean;
  acceptedFileType?: string | null;
}) => {
  if (range) editor.chain().focus().deleteRange(range).run();

  const attachmentOptions: InsertAttachmentComponentProps = { event };
  if (pos) attachmentOptions.pos = pos;
  if (file) attachmentOptions.file = file;
  if (preview !== undefined) attachmentOptions.preview = preview;
  if (acceptedFileType !== undefined && acceptedFileType !== null) {
    attachmentOptions.acceptedFileType = acceptedFileType;
  }
  return editor?.chain().focus().insertAttachmentComponent(attachmentOptions).run();
};

export const insertBlockMath = ({ editor, range, latex }: { editor: Editor; range?: Range; latex: string }) => {
  if (range) editor.chain().focus().deleteRange(range).setBlockMath({ latex, pos: range.from }).run();
  else editor.chain().focus().setBlockMath({ latex }).run();
};

export const insertInlineMath = ({ editor, range, latex }: { editor: Editor; range?: Range; latex: string }) => {
  if (range) editor.chain().focus().deleteRange(range).setInlineMath({ latex, pos: range.from }).run();
  else editor.chain().focus().setInlineMath({ latex }).run();
};

export const insertExternalEmbed = ({
  editor,
  range,
  [EExternalEmbedAttributeNames.IS_RICH_CARD]: isRichCard,
  src,
}: {
  editor: Editor;
  range?: Range;
  [EExternalEmbedAttributeNames.IS_RICH_CARD]: boolean;
  src?: string;
}) => {
  if (range) {
    return editor
      .chain()
      .focus()
      .deleteRange(range)
      .insertExternalEmbed({
        [EExternalEmbedAttributeNames.IS_RICH_CARD]: isRichCard,
        pos: range.from,
        [EExternalEmbedAttributeNames.SOURCE]: src,
      })
      .run();
  } else {
    return editor
      .chain()
      .focus()
      .insertExternalEmbed({
        [EExternalEmbedAttributeNames.IS_RICH_CARD]: isRichCard,
        [EExternalEmbedAttributeNames.SOURCE]: src,
      })
      .run();
  }
};

export const insertAIBlock = (editor: Editor, range?: Range) => {
  if (range) editor.chain().focus().deleteRange(range).insertAIBlock().run();
  else editor.chain().focus().insertAIBlock().run();
};

export const findColumnAncestor = (node: Node | null): HTMLElement | null => {
  while (node !== null) {
    if (node instanceof HTMLElement && node.classList?.contains("editor-column")) {
      return node;
    }
    node = node.parentNode;
  }
  return null;
};

export const insertColumnListCommand = (editor: Editor, range?: Range, columns: number = 2) => {
  if (typeof window !== "undefined") {
    const selection = window.getSelection();
    if (selection) {
      if (selection.rangeCount !== 0) {
        const selectionRange = selection.getRangeAt(0);
        if (findColumnAncestor(selectionRange.startContainer)) {
          return;
        }
      }
    }
  }
  if (range) {
    editor.chain().focus().deleteRange(range).run();
  }
  editor.chain().focus().insertColumnList({ columns }).run();
};
