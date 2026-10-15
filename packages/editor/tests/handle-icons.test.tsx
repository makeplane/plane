/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Editor } from "@tiptap/core";
import { StarterKit } from "@tiptap/starter-kit";
import { act, render } from "@testing-library/react";
import { useEffect, useRef } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SideMenuExtension } from "../src/extensions/side-menu";

const editors = new Set<Editor>();
const containers = new Set<HTMLElement>();

const createEditor = (element: HTMLElement, handles = { aiEnabled: true, dragDropEnabled: true }) => {
  const editor = new Editor({
    element,
    extensions: [StarterKit, SideMenuExtension(handles)],
    content: "<p>Existing editor content</p>",
  });
  editors.add(editor);
  return editor;
};

const createContainer = () => {
  const container = document.createElement("div");
  document.body.appendChild(container);
  containers.add(container);
  return container;
};

afterEach(async () => {
  await act(async () => {
    editors.forEach((editor) => {
      if (!editor.isDestroyed) editor.destroy();
    });
    await Promise.resolve();
  });
  editors.clear();
  containers.forEach((container) => container.remove());
  containers.clear();
  vi.restoreAllMocks();
});

describe("native editor handle icons", () => {
  it("preserves native controls and both 14px drag columns", async () => {
    const container = createContainer();
    await act(async () => {
      createEditor(container);
    });

    const aiHandle = container.querySelector<HTMLButtonElement>("#ai-handle");
    const dragHandle = container.querySelector<HTMLButtonElement>("#drag-handle");
    expect(aiHandle?.type).toBe("button");
    expect(aiHandle?.classList.contains("size-5")).toBe(true);
    expect(aiHandle?.querySelectorAll("svg")).toHaveLength(1);
    expect(dragHandle?.type).toBe("button");
    expect(dragHandle?.draggable).toBe(true);
    expect(dragHandle?.hasAttribute("data-drag-handle")).toBe(true);
    expect(dragHandle?.classList.contains("size-5")).toBe(true);
    expect(dragHandle?.children).toHaveLength(2);
    expect(dragHandle?.lastElementChild?.classList.contains("-ml-2.5")).toBe(true);
    expect(dragHandle?.querySelectorAll("svg")).toHaveLength(2);

    const glyphs = container.querySelectorAll("#editor-side-menu svg");
    expect(glyphs).toHaveLength(3);
    glyphs.forEach((glyph) => {
      expect(glyph.getAttribute("width")).toBe("14");
      expect(glyph.getAttribute("height")).toBe("14");
      expect(glyph.getAttribute("viewBox")).toBe("0 0 16 16");
      expect(glyph.getAttribute("aria-hidden")).toBe("true");
      expect(glyph.querySelector('[fill="currentColor"]')).not.toBeNull();
    });
    expect(container.querySelector(".lucide")).toBeNull();
  });

  it("releases mounted glyphs and handle listeners when the editor is destroyed and recreated", async () => {
    const container = createContainer();
    const removeWindowListener = vi.spyOn(window, "removeEventListener");
    const removeDocumentListener = vi.spyOn(document, "removeEventListener");
    let editor: Editor;
    await act(async () => {
      editor = createEditor(container);
    });
    const oldMenu = container.querySelector("#editor-side-menu")!;
    const oldIconContainers = [...oldMenu.querySelectorAll("span")];

    await act(async () => {
      editor.destroy();
      await Promise.resolve();
    });

    expect(oldMenu.isConnected).toBe(false);
    expect(container.querySelector("#editor-side-menu")).toBeNull();
    oldIconContainers.forEach((iconContainer) => expect(iconContainer.childElementCount).toBe(0));
    expect(removeWindowListener).toHaveBeenCalledWith("dragleave", expect.any(Function));
    expect(removeWindowListener).toHaveBeenCalledWith("dragenter", expect.any(Function));
    expect(removeDocumentListener).toHaveBeenCalledWith("dragover", expect.any(Function));
    expect(removeDocumentListener).toHaveBeenCalledWith("mousemove", expect.any(Function));

    await act(async () => {
      createEditor(container);
    });
    expect(container.querySelectorAll("#editor-side-menu")).toHaveLength(1);
    expect(container.querySelectorAll("#editor-side-menu svg")).toHaveLength(3);
  });

  it("keeps existing handle configuration", async () => {
    const container = createContainer();
    await act(async () => {
      createEditor(container, { aiEnabled: false, dragDropEnabled: true });
    });
    expect(container.querySelector("#ai-handle")).toBeNull();
    expect(container.querySelectorAll("#drag-handle svg")).toHaveLength(2);
  });

  it("tears down safely during a containing React tree's unmount", async () => {
    const errors = vi.spyOn(console, "error");
    function EditorHost() {
      const element = useRef<HTMLDivElement>(null);
      useEffect(() => {
        const editor = createEditor(element.current!);
        return () => editor.destroy();
      }, []);
      return <div ref={element} />;
    }

    const result = render(<EditorHost />);
    await act(async () => {});
    const menu = result.container.querySelector("#editor-side-menu")!;
    const iconContainers = [...menu.querySelectorAll("span")];
    expect(menu.querySelectorAll("svg")).toHaveLength(3);

    await act(async () => {
      result.unmount();
      await Promise.resolve();
    });

    iconContainers.forEach((iconContainer) => expect(iconContainer.childElementCount).toBe(0));
    expect(errors).not.toHaveBeenCalled();
  });
});
