/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import type { JSONContent } from "@tiptap/core";
import { generateHTML } from "@tiptap/html";
import { describe, expect, it } from "vitest";
import { COLORS_LIST } from "@/constants/common";
import { isValidCssColor } from "@/helpers/common";
import { CoreEditorExtensionsWithoutProps } from "../core-without-props";

describe("isValidCssColor", () => {
  it("accepts the values the color pickers write and plain CSS colors", () => {
    const valid = [
      ...COLORS_LIST.flatMap((color) => [color.textColor, color.backgroundColor]),
      "#fff",
      "#FFFA",
      "#D9E4FF",
      "#5c5e6326",
      "rgb(23, 23, 23)",
      "rgba(23, 23, 23, 0.5)",
      "rgb(23 23 23 / 50%)",
      "hsl(210, 50%, 40%)",
      "hsla(210, 50%, 40%, 0.5)",
    ];
    valid.forEach((color) => expect(isValidCssColor(color), color).toBe(true));
  });

  it("rejects anything that is not a single plain color value", () => {
    const invalid = [
      null,
      undefined,
      "",
      "none",
      "#12",
      "#12345",
      "#ggg",
      "#fff ",
      "#fff; display: none",
      "rgb(0, 0, 0); display: none",
      "var(--a); display: none",
      "var(--a, #fff)",
      "rgb(var(--a))",
      "url(https://example.com/a.png)",
    ];
    invalid.forEach((color) => expect(isValidCssColor(color), String(color)).toBe(false));
  });
});

const paragraph = (text: string, marks?: JSONContent["marks"]): JSONContent => ({
  type: "paragraph",
  content: [{ type: "text", text, ...(marks && { marks }) }],
});

describe("color attributes in rendered HTML", () => {
  // inline style of each element that carries color attributes, in document order
  const renderedStyles = (colors: { background: string; text: string }) => {
    const html = generateHTML(
      {
        type: "doc",
        content: [
          paragraph("text", [
            { type: "customColor", attrs: { color: colors.text, backgroundColor: colors.background } },
          ]),
          {
            type: "table",
            content: [
              {
                type: "tableRow",
                attrs: { background: colors.background, textColor: colors.text },
                content: [
                  { type: "tableHeader", attrs: { background: colors.background }, content: [paragraph("header")] },
                  {
                    type: "tableCell",
                    attrs: { background: colors.background, textColor: colors.text },
                    content: [paragraph("cell")],
                  },
                ],
              },
            ],
          },
        ],
      },
      CoreEditorExtensionsWithoutProps
    );
    return [...new DOMParser().parseFromString(html, "text/html").querySelectorAll("span, tr, th, td")].map((element) =>
      (element.getAttribute("style") ?? "").replace(/;$/, "")
    );
  };

  it("keeps valid colors in the inline styles", () => {
    expect(renderedStyles({ background: "var(--editor-colors-gray-background)", text: "#171717" })).toEqual([
      "color: #171717; background-color: var(--editor-colors-gray-background)",
      "background-color: var(--editor-colors-gray-background); color: #171717",
      "background-color: var(--editor-colors-gray-background)",
      "background-color: var(--editor-colors-gray-background); color: #171717",
    ]);
  });

  it("writes no declaration for a value that is not a plain color", () => {
    expect(renderedStyles({ background: "#fff; display: none", text: "#000; display: none" })).toEqual([
      "",
      "",
      "",
      "",
    ]);
  });
});
