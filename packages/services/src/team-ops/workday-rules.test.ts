/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { describe, expect, it } from "vitest";
import { MAX_FILES, fileLimitError, finishBlocker } from "./workday-rules";

const complete = {
  summary: "Fixed the redirect",
  documentText: "",
  noDocument: true,
  fileCount: 0,
  needsAttention: false,
  attentionMessage: "",
};

describe("finishBlocker", () => {
  it("lets complete work finish, with or without a document", () => {
    expect(finishBlocker(complete)).toBeNull();
    expect(finishBlocker({ ...complete, noDocument: false, documentText: "notes" })).toBeNull();
    expect(finishBlocker({ ...complete, noDocument: false, fileCount: 1 })).toBeNull();
  });

  it("requires the report", () => {
    expect(finishBlocker({ ...complete, summary: "   " })).toBe("Write what you did.");
  });

  it("requires a document or the explicit confirmation that there is none", () => {
    expect(finishBlocker({ ...complete, noDocument: false })).toBe("Add a document, or confirm that there is none.");
    expect(finishBlocker({ ...complete, noDocument: false, documentText: "  " })).toBe(
      "Add a document, or confirm that there is none."
    );
  });

  it("requires a message when others are asked to look", () => {
    expect(finishBlocker({ ...complete, needsAttention: true })).toBe("Say what needs attention.");
    expect(finishBlocker({ ...complete, needsAttention: true, attentionMessage: "Please test" })).toBeNull();
  });
});

describe("fileLimitError", () => {
  it("accepts a few small files", () => {
    expect(fileLimitError([{ size: 10 }, { size: 2048 }])).toBeNull();
  });

  it("refuses too many files and files over the size limit", () => {
    expect(fileLimitError(Array.from({ length: MAX_FILES + 1 }, () => ({ size: 1 })))).toMatch(/At most/);
    expect(fileLimitError([{ size: 21 * 1024 * 1024 }])).toMatch(/at most 20 MB/);
  });
});
