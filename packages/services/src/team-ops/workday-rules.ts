/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/** Mirrors the server limits so a bad file is caught before the timer is touched. */
export const MAX_FILES = 10;
export const MAX_FILE_MB = 20;
export const FILE_ACCEPT = ".png,.jpg,.jpeg,.gif,.webp,.pdf,.txt,.md,.csv,.docx,.xlsx,.pptx";

export type TFinishFormValues = {
  summary: string;
  documentText: string;
  noDocument: boolean;
  fileCount: number;
  needsAttention: boolean;
  attentionMessage: string;
};

/**
 * What still stops the person from finishing work, or `null` when the form is complete.
 * A report is always needed; so is a document (text or files) or the confirmation that there is none.
 */
export const finishBlocker = (values: TFinishFormValues): string | null => {
  if (!values.summary.trim()) return "Write what you did.";
  if (!values.documentText.trim() && values.fileCount === 0 && !values.noDocument) {
    return "Add a document, or confirm that there is none.";
  }
  if (values.needsAttention && !values.attentionMessage.trim()) return "Say what needs attention.";
  return null;
};

/** Checks files chosen for upload against the limits; returns the message to show, or `null` when they are fine. */
export const fileLimitError = (files: { size: number }[]): string | null => {
  if (files.length > MAX_FILES) return `At most ${MAX_FILES} files.`;
  if (files.some((file) => file.size > MAX_FILE_MB * 1024 * 1024)) return `A file can be at most ${MAX_FILE_MB} MB.`;
  return null;
};
