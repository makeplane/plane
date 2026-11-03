/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Editor } from "@tiptap/react";
import { StarterKit } from "@tiptap/starter-kit";
import { afterEach, describe, expect, it, vi } from "vitest";
import { scrollSummary } from "../../helpers/scroll-to-node";
import { HeadingListExtension } from "../headings-list";

let editor: Editor;

function createEditor(content: string) {
  editor = new Editor({
    element: document.createElement("div"),
    extensions: [StarterKit, HeadingListExtension],
  });
  editor.commands.setContent(content);
  return editor;
}

afterEach(() => {
  editor?.destroy();
  vi.restoreAllMocks();
});

describe("HeadingListExtension outline navigation", () => {
  it.each([4, 5, 6])("keeps H3 outline links on their own headings after an H%i", (level) => {
    createEditor(
      `<h3>Section A</h3><p>Content A</p><h${level}>Subsection A.1</h${level}>` +
        "<p>Detail</p><h3>Section B</h3><p>Content B</p><h3>Section C</h3><p>Content C</p>"
    );
    const scrolledTo: string[] = [];
    vi.spyOn(HTMLElement.prototype, "scrollIntoView").mockImplementation(function (this: HTMLElement) {
      scrolledTo.push(this.textContent ?? "");
    });

    for (const text of ["Section B", "Section C"]) {
      const marking = editor.storage.headingsList.headings.find((heading) => heading.text === text)!;
      scrollSummary(editor, marking);
    }

    expect(scrolledTo).toEqual(["Section B", "Section C"]);
  });

  it("numbers each heading level independently while preserving document order", () => {
    const levels = [1, 2, 3, 4, 5, 6, 4, 1, 6, 3, 5, 2];
    createEditor(levels.map((level, index) => `<h${level}>Heading ${index}</h${level}>`).join(""));

    expect(editor.storage.headingsList.headings.map(({ level }) => level)).toEqual(levels);
    for (const level of [1, 2, 3, 4, 5, 6]) {
      expect(
        editor.storage.headingsList.headings
          .filter((heading) => heading.level === level)
          .map((heading) => heading.sequence)
      ).toEqual([1, 2]);
    }
  });

  it("recalculates sequences after inserting and removing a deeper heading", () => {
    createEditor("<h3>Section A</h3><h3>Section B</h3>");
    const insertAt = editor.state.doc.firstChild!.nodeSize;
    editor.commands.insertContentAt(insertAt, "<h4>Inserted detail</h4>");

    expect(editor.storage.headingsList.headings.find(({ text }) => text === "Section B")?.sequence).toBe(2);

    const insertedSize = editor.state.doc.nodeAt(insertAt)!.nodeSize;
    editor.commands.deleteRange({ from: insertAt, to: insertAt + insertedSize });

    expect(editor.storage.headingsList.headings.map(({ text, sequence }) => ({ text, sequence }))).toEqual([
      { text: "Section A", sequence: 1 },
      { text: "Section B", sequence: 2 },
    ]);
  });
});
