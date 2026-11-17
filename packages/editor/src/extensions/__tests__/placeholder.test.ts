/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Editor } from "@tiptap/core";
import { StarterKit } from "@tiptap/starter-kit";
import { afterEach, describe, expect, it } from "vitest";
import { CustomPlaceholderExtension } from "../placeholder";

let editor: Editor;
const createEditor = (content: string, showPlaceholderOnEmpty = false) => {
  editor = new Editor({
    element: document.createElement("div"),
    content,
    extensions: [StarterKit, CustomPlaceholderExtension({ placeholder: "Add comment", showPlaceholderOnEmpty })],
  });
  return editor;
};
const placeholders = () =>
  [...editor.view.dom.querySelectorAll("[data-placeholder]")].map((element) =>
    element.getAttribute("data-placeholder")
  );

afterEach(() => editor.destroy());

describe("CustomPlaceholderExtension", () => {
  it("shows the placeholder again once typed text is deleted", () => {
    createEditor("<p></p>", true);
    editor.commands.insertContentAt(1, "abc");
    expect(placeholders()).toEqual([]);
    editor.commands.deleteRange({ from: 1, to: 4 });
    expect(placeholders()).toEqual(["Add comment"]);
  });

  it("clears the placeholder from an empty line the caret has left", () => {
    createEditor("<p>first</p><p></p><p>third</p>");
    editor.commands.setTextSelection(8);
    expect(placeholders()).toEqual(["Add comment"]);
    editor.commands.setTextSelection(2);
    expect(placeholders()).toEqual([]);
  });

  it("labels an empty heading with its level", () => {
    createEditor("<h2></h2>");
    editor.commands.setTextSelection(1);
    expect(placeholders()).toEqual(["Heading 2"]);
  });
});
