/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { Editor } from "@tiptap/core";
import { StarterKit } from "@tiptap/starter-kit";
import { afterEach, describe, expect, it, vi } from "vitest";
import { CustomLinkExtension, isDangerousHref } from "../custom-link";

describe("isDangerousHref", () => {
  it("detects a blocked scheme the way the browser's URL parser reads it", () => {
    const blocked = [
      "javascript:void(0)",
      "JavaScript:void(0)",
      " javascript:void(0)",
      "\tjavascript:void(0)",
      "\u0001javascript:void(0)",
      "java\tscript:void(0)",
      "java\nscript:void(0)",
      "java\rscript\t:void(0)",
      "data:text/plain,x",
      "vbscript:x",
    ];
    blocked.forEach((href) => expect(isDangerousHref(href), JSON.stringify(href)).toBe(true));
  });

  it("allows ordinary links", () => {
    const allowed = ["https://example.com/a?b=c#d", "http://example.com", "mailto:user@example.com", "/a/b", "#a", ""];
    allowed.forEach((href) => expect(isDangerousHref(href), JSON.stringify(href)).toBe(false));
  });
});

describe("CustomLinkExtension click handler", () => {
  let editor: Editor;
  const open = vi.spyOn(window, "open").mockImplementation(() => null);

  const createEditor = (content: string) => {
    editor = new Editor({
      element: document.createElement("div"),
      content,
      extensions: [StarterKit.configure({ link: false }), CustomLinkExtension],
    });
    return editor;
  };
  const click = (target: Element) => {
    const event = new MouseEvent("click", { button: 0 });
    Object.defineProperty(event, "target", { value: target });
    return editor.view.someProp("handleClick", (handler) => handler(editor.view, 0, event));
  };

  afterEach(() => {
    editor.destroy();
    open.mockClear();
  });

  it("opens the anchor's own resolved URL in a new, opener-less tab when a nested element is clicked", () => {
    createEditor(`<p><a href="https://example.com/page" target="named-window"><strong>link</strong></a></p>`);
    const anchor = editor.view.dom.querySelector("a") as HTMLAnchorElement;
    const nested = anchor.querySelector("strong") as HTMLElement;
    // a real click moves the selection into the link before the handler runs
    editor.commands.setTextSelection(2);

    expect(click(nested)).toBe(true);
    expect(open).toHaveBeenCalledTimes(1);
    expect(open).toHaveBeenCalledWith(anchor.href, "_blank", "noopener,noreferrer");
  });

  it("does nothing for a click outside a link", () => {
    createEditor(`<p>text <a href="https://example.com/page">link</a></p>`);

    expect(click(editor.view.dom.querySelector("p") as HTMLElement)).toBeFalsy();
    expect(open).not.toHaveBeenCalled();
  });
});
