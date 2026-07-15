/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { CommentSubmitShortcut } from "@plane/types";

type IsCommentSubmissionValidArgs = {
  e: React.KeyboardEvent;
  shortcut: CommentSubmitShortcut;
  isEmpty: boolean;
  isSubmitting: boolean;
  isEditorReadyToDiscard: boolean;
};

/**
 * Returns true if the keyboard event matches the configured comment submit shortcut and-
 * - the comment is not empty,
 * - the editor is ready to discard,
 * - the form is not submitting.
 */
export const isCommentSubmissionValid = ({
  e,
  shortcut = "enter",
  isEmpty,
  isSubmitting,
  isEditorReadyToDiscard,
}: IsCommentSubmissionValidArgs): boolean => {
  if (e.key !== "Enter" || e.shiftKey) return false;
  const isShortcutValid = shortcut === "enter" ? !e.ctrlKey && !e.metaKey : e.ctrlKey || e.metaKey;
  return isShortcutValid && !isEmpty && !isSubmitting && isEditorReadyToDiscard;
};
