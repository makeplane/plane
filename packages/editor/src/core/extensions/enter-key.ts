/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { Editor } from "@tiptap/core";
import { Extension } from "@tiptap/core";
// plane imports
import type { CommentSubmitShortcut } from "@plane/types";
// constants
import { CORE_EXTENSIONS } from "@/constants/extension";

type EnterKeyExtensionArgs = {
  onEnterKeyPress?: () => void;
  submitShortcut?: CommentSubmitShortcut;
};

export const EnterKeyExtension = ({ onEnterKeyPress, submitShortcut = "enter" }: EnterKeyExtensionArgs) => {
  const newLine = ({ editor }: { editor: Editor }) =>
    editor.commands.first(({ commands }) => [
      () => commands.newlineInCode(),
      () => commands.splitListItem(CORE_EXTENSIONS.LIST_ITEM),
      () => commands.splitListItem(CORE_EXTENSIONS.TASK_ITEM),
      () => commands.createParagraphNear(),
      () => commands.liftEmptyBlock(),
      () => commands.splitBlock(),
    ]);

  const submit = (editor: Editor) => {
    const activeDropbarExtensions = editor.storage.utility?.activeDropbarExtensions ?? [];
    if (activeDropbarExtensions.length === 0) {
      onEnterKeyPress?.();
      return true;
    }
    return false;
  };

  return Extension.create({
    name: CORE_EXTENSIONS.ENTER_KEY,

    addKeyboardShortcuts(this) {
      if (submitShortcut === "enter") {
        return {
          // Shift+Enter always inserts a new line (its default behavior)
          "Shift-Enter": newLine,
          // Enter submits
          Enter: () => submit(this.editor),
          // Mod+Enter always inserts a line-break (its default behavior)
          "Mod-Enter": () => false,
        };
      } else {
        return {
          // Shift+Enter always inserts a line-break (its default behavior)
          "Shift-Enter": () => false,
          // Enter always inserts a new line (its default behavior)
          Enter: () => false,
          // Mod+Enter submits
          "Mod-Enter": () => submit(this.editor),
        };
      }
    },
  });
};
