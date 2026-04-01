/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Integration tests for DOCX rendering - verifies actual DOCX output
 */

import { describe, it, expect } from "vitest";
import JSZip from "jszip";
import { renderPlaneDocToDocxBuffer } from "@/lib/docx";
import type { TipTapDocument, TipTapNode } from "@/lib/export-core";
import type { DocxExportMetadata } from "@/lib/docx";

const DOCX_MAGIC = "PK"; // ZIP signature

async function extractDocumentXml(buffer: Buffer): Promise<string> {
  const zip = await JSZip.loadAsync(buffer);
  const docXml = zip.file("word/document.xml");
  if (!docXml) throw new Error("No word/document.xml found in DOCX");
  return docXml.async("string");
}

async function extractStylesXml(buffer: Buffer): Promise<string> {
  const zip = await JSZip.loadAsync(buffer);
  const stylesXml = zip.file("word/styles.xml");
  if (!stylesXml) throw new Error("No word/styles.xml found in DOCX");
  return stylesXml.async("string");
}

async function extractNumberingXml(buffer: Buffer): Promise<string | null> {
  const zip = await JSZip.loadAsync(buffer);
  const numXml = zip.file("word/numbering.xml");
  if (!numXml) return null;
  return numXml.async("string");
}

describe("DOCX Rendering Integration", () => {
  describe("renderPlaneDocToDocxBuffer", () => {
    it("should render empty document to valid DOCX", async () => {
      const doc: TipTapDocument = { type: "doc", content: [] };
      const buffer = await renderPlaneDocToDocxBuffer(doc);

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
      expect(buffer.toString("ascii", 0, 2)).toBe(DOCX_MAGIC);

      const xml = await extractDocumentXml(buffer);
      expect(xml).toContain("w:document");
      expect(xml).toContain("w:body");
    });

    it("should render document with title", async () => {
      const doc: TipTapDocument = {
        type: "doc",
        content: [{ type: "paragraph", content: [{ type: "text", text: "Hello World" }] }],
      };

      const buffer = await renderPlaneDocToDocxBuffer(doc, { title: "Test Title" });
      const xml = await extractDocumentXml(buffer);

      expect(xml).toContain("Test Title");
      expect(xml).toContain("Hello World");
    });

    it("should include styles.xml with heading and code styles", async () => {
      const doc: TipTapDocument = { type: "doc", content: [] };
      const buffer = await renderPlaneDocToDocxBuffer(doc);
      const stylesXml = await extractStylesXml(buffer);

      expect(stylesXml).toContain("Heading1");
      expect(stylesXml).toContain("SourceCode");
      expect(stylesXml).toContain("BlockQuote");
      expect(stylesXml).toContain("VerbatimChar");
      expect(stylesXml).toContain("Hyperlink");
      expect(stylesXml).toContain("Inter");
    });
  });

  describe("paragraph", () => {
    it("should render a basic paragraph", async () => {
      const doc: TipTapDocument = {
        type: "doc",
        content: [{ type: "paragraph", content: [{ type: "text", text: "Simple paragraph text" }] }],
      };

      const buffer = await renderPlaneDocToDocxBuffer(doc);
      const xml = await extractDocumentXml(buffer);
      expect(xml).toContain("Simple paragraph text");
    });

    it("should render paragraph with text alignment", async () => {
      const doc: TipTapDocument = {
        type: "doc",
        content: [
          {
            type: "paragraph",
            attrs: { textAlign: "center" },
            content: [{ type: "text", text: "Centered text" }],
          },
        ],
      };

      const buffer = await renderPlaneDocToDocxBuffer(doc);
      const xml = await extractDocumentXml(buffer);
      expect(xml).toContain("Centered text");
      expect(xml).toContain("w:jc");
      expect(xml).toContain("center");
    });

    it("should render empty paragraph without crashing", async () => {
      const doc: TipTapDocument = {
        type: "doc",
        content: [{ type: "paragraph" }],
      };

      const buffer = await renderPlaneDocToDocxBuffer(doc);
      expect(buffer.length).toBeGreaterThan(0);
    });
  });

  describe("headings", () => {
    it("should render all heading levels (1-6)", async () => {
      const doc: TipTapDocument = {
        type: "doc",
        content: [1, 2, 3, 4, 5, 6].map((level) => ({
          type: "heading",
          attrs: { level },
          content: [{ type: "text", text: `Heading Level ${level}` }],
        })),
      };

      const buffer = await renderPlaneDocToDocxBuffer(doc);
      const xml = await extractDocumentXml(buffer);

      for (let i = 1; i <= 6; i++) {
        expect(xml).toContain(`Heading Level ${i}`);
      }
      expect(xml).toContain("w:pStyle");
    });
  });

  describe("inline marks", () => {
    it("should render bold text", async () => {
      const doc: TipTapDocument = {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "Bold text", marks: [{ type: "bold" }] }],
          },
        ],
      };

      const buffer = await renderPlaneDocToDocxBuffer(doc);
      const xml = await extractDocumentXml(buffer);
      expect(xml).toContain("Bold text");
      expect(xml).toContain("<w:b/>");
    });

    it("should render italic text", async () => {
      const doc: TipTapDocument = {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "Italic text", marks: [{ type: "italic" }] }],
          },
        ],
      };

      const buffer = await renderPlaneDocToDocxBuffer(doc);
      const xml = await extractDocumentXml(buffer);
      expect(xml).toContain("Italic text");
      expect(xml).toContain("<w:i/>");
    });

    it("should render underline text", async () => {
      const doc: TipTapDocument = {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "Underlined", marks: [{ type: "underline" }] }],
          },
        ],
      };

      const buffer = await renderPlaneDocToDocxBuffer(doc);
      const xml = await extractDocumentXml(buffer);
      expect(xml).toContain("Underlined");
      expect(xml).toContain("w:u");
    });

    it("should render strikethrough text", async () => {
      const doc: TipTapDocument = {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "Struck", marks: [{ type: "strike" }] }],
          },
        ],
      };

      const buffer = await renderPlaneDocToDocxBuffer(doc);
      const xml = await extractDocumentXml(buffer);
      expect(xml).toContain("Struck");
      expect(xml).toContain("<w:strike/>");
    });

    it("should render inline code", async () => {
      const doc: TipTapDocument = {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "const x = 1", marks: [{ type: "code" }] }],
          },
        ],
      };

      const buffer = await renderPlaneDocToDocxBuffer(doc);
      const xml = await extractDocumentXml(buffer);
      expect(xml).toContain("const x = 1");
      expect(xml).toContain("Courier New");
    });

    it("should render link as ExternalHyperlink", async () => {
      const doc: TipTapDocument = {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Click here",
                marks: [{ type: "link", attrs: { href: "https://example.com" } }],
              },
            ],
          },
        ],
      };

      const buffer = await renderPlaneDocToDocxBuffer(doc);
      const xml = await extractDocumentXml(buffer);
      expect(xml).toContain("Click here");
      expect(xml).toContain("w:hyperlink");
    });

    it("should render combined marks (bold + italic)", async () => {
      const doc: TipTapDocument = {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Bold and italic",
                marks: [{ type: "bold" }, { type: "italic" }],
              },
            ],
          },
        ],
      };

      const buffer = await renderPlaneDocToDocxBuffer(doc);
      const xml = await extractDocumentXml(buffer);
      expect(xml).toContain("Bold and italic");
      expect(xml).toContain("<w:b/>");
      expect(xml).toContain("<w:i/>");
    });

    it("should render subscript and superscript", async () => {
      const doc: TipTapDocument = {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              { type: "text", text: "H" },
              { type: "text", text: "2", marks: [{ type: "subscript" }] },
              { type: "text", text: "O and x" },
              { type: "text", text: "2", marks: [{ type: "superscript" }] },
            ],
          },
        ],
      };

      const buffer = await renderPlaneDocToDocxBuffer(doc);
      const xml = await extractDocumentXml(buffer);
      expect(xml).toContain("w:vertAlign");
    });

    it("should render highlight mark", async () => {
      const doc: TipTapDocument = {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Highlighted",
                marks: [{ type: "highlight", attrs: { color: "#fef08a" } }],
              },
            ],
          },
        ],
      };

      const buffer = await renderPlaneDocToDocxBuffer(doc);
      const xml = await extractDocumentXml(buffer);
      expect(xml).toContain("Highlighted");
      expect(xml).toContain("w:shd");
    });

    it("should render customColor mark with text and background color", async () => {
      const doc: TipTapDocument = {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "Colored text",
                marks: [{ type: "customColor", attrs: { color: "#ff0000", backgroundColor: "#00ff00" } }],
              },
            ],
          },
        ],
      };

      const buffer = await renderPlaneDocToDocxBuffer(doc);
      const xml = await extractDocumentXml(buffer);
      expect(xml).toContain("Colored text");
      expect(xml).toContain("w:color");
      expect(xml).toContain("w:shd");
    });
  });

  describe("blockquote", () => {
    it("should render blockquote with BlockQuote style", async () => {
      const doc: TipTapDocument = {
        type: "doc",
        content: [
          {
            type: "blockquote",
            content: [{ type: "paragraph", content: [{ type: "text", text: "Quoted text" }] }],
          },
        ],
      };

      const buffer = await renderPlaneDocToDocxBuffer(doc);
      const xml = await extractDocumentXml(buffer);
      expect(xml).toContain("Quoted text");
      expect(xml).toContain("BlockQuote");
    });
  });

  describe("codeBlock", () => {
    it("should render code block with monospace font", async () => {
      const doc: TipTapDocument = {
        type: "doc",
        content: [
          {
            type: "codeBlock",
            attrs: { language: "javascript" },
            content: [{ type: "text", text: "function hello() {\n  return 'world';\n}" }],
          },
        ],
      };

      const buffer = await renderPlaneDocToDocxBuffer(doc);
      const xml = await extractDocumentXml(buffer);
      expect(xml).toContain("function hello()");
      expect(xml).toContain("return");
      expect(xml).toContain("Courier New");
      expect(xml).toContain("SourceCode");
    });
  });

  describe("bulletList", () => {
    it("should render bullet list items", async () => {
      const doc: TipTapDocument = {
        type: "doc",
        content: [
          {
            type: "bulletList",
            content: [
              {
                type: "listItem",
                content: [{ type: "paragraph", content: [{ type: "text", text: "Bullet item 1" }] }],
              },
              {
                type: "listItem",
                content: [{ type: "paragraph", content: [{ type: "text", text: "Bullet item 2" }] }],
              },
            ],
          },
        ],
      };

      const buffer = await renderPlaneDocToDocxBuffer(doc);
      const xml = await extractDocumentXml(buffer);
      expect(xml).toContain("Bullet item 1");
      expect(xml).toContain("Bullet item 2");
      expect(xml).toContain("w:numPr");
      expect(xml).toContain("w:numId");

      const numXml = await extractNumberingXml(buffer);
      expect(numXml).not.toBeNull();
      expect(numXml!).toContain("w:numFmt");
      expect(numXml!).toContain("bullet");
    });
  });

  describe("orderedList", () => {
    it("should render ordered list items", async () => {
      const doc: TipTapDocument = {
        type: "doc",
        content: [
          {
            type: "orderedList",
            content: [
              {
                type: "listItem",
                content: [{ type: "paragraph", content: [{ type: "text", text: "Step one" }] }],
              },
              {
                type: "listItem",
                content: [{ type: "paragraph", content: [{ type: "text", text: "Step two" }] }],
              },
            ],
          },
        ],
      };

      const buffer = await renderPlaneDocToDocxBuffer(doc);
      const xml = await extractDocumentXml(buffer);
      expect(xml).toContain("Step one");
      expect(xml).toContain("Step two");
      expect(xml).toContain("w:numPr");

      const numXml = await extractNumberingXml(buffer);
      expect(numXml).not.toBeNull();
      expect(numXml!).toContain("w:numFmt");
      expect(numXml!).toContain("decimal");
    });
  });

  describe("nested lists", () => {
    it("should render nested bullet list with correct nesting levels", async () => {
      const doc: TipTapDocument = {
        type: "doc",
        content: [
          {
            type: "bulletList",
            content: [
              {
                type: "listItem",
                content: [
                  { type: "paragraph", content: [{ type: "text", text: "Parent item" }] },
                  {
                    type: "bulletList",
                    content: [
                      {
                        type: "listItem",
                        content: [{ type: "paragraph", content: [{ type: "text", text: "Nested child" }] }],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };

      const buffer = await renderPlaneDocToDocxBuffer(doc);
      const xml = await extractDocumentXml(buffer);
      expect(xml).toContain("Parent item");
      expect(xml).toContain("Nested child");

      const numXml = await extractNumberingXml(buffer);
      expect(numXml).not.toBeNull();
    });
  });

  describe("taskList", () => {
    it("should render task items with check indicators", async () => {
      const doc: TipTapDocument = {
        type: "doc",
        content: [
          {
            type: "taskList",
            content: [
              {
                type: "taskItem",
                attrs: { checked: true },
                content: [{ type: "paragraph", content: [{ type: "text", text: "Done task" }] }],
              },
              {
                type: "taskItem",
                attrs: { checked: false },
                content: [{ type: "paragraph", content: [{ type: "text", text: "Pending task" }] }],
              },
            ],
          },
        ],
      };

      const buffer = await renderPlaneDocToDocxBuffer(doc);
      const xml = await extractDocumentXml(buffer);
      expect(xml).toContain("Done task");
      expect(xml).toContain("Pending task");
      // Should use proper OOXML checkbox SDT, not unicode characters
      expect(xml).toContain("w:sdt");
      expect(xml).toContain("w14:checkbox");
      expect(xml).not.toContain("☑");
      expect(xml).not.toContain("☐");
      // Checked items should use checkmark symbol (2611) and have strikethrough
      expect(xml).toContain("2611");
      expect(xml).toContain("w:strike");
    });

    it("should render nested task list with indentation", async () => {
      const doc: TipTapDocument = {
        type: "doc",
        content: [
          {
            type: "taskList",
            content: [
              {
                type: "taskItem",
                attrs: { checked: true },
                content: [
                  { type: "paragraph", content: [{ type: "text", text: "Parent task" }] },
                  {
                    type: "taskList",
                    content: [
                      {
                        type: "taskItem",
                        attrs: { checked: false },
                        content: [{ type: "paragraph", content: [{ type: "text", text: "Nested child" }] }],
                      },
                    ],
                  },
                ],
              },
              {
                type: "taskItem",
                attrs: { checked: false },
                content: [{ type: "paragraph", content: [{ type: "text", text: "Sibling task" }] }],
              },
            ],
          },
        ],
      };

      const buffer = await renderPlaneDocToDocxBuffer(doc);
      const xml = await extractDocumentXml(buffer);
      expect(xml).toContain("Parent task");
      expect(xml).toContain("Nested child");
      expect(xml).toContain("Sibling task");
      // Nested child should have indent
      expect(xml).toContain("w:ind");
    });
  });

  describe("table", () => {
    it("should render a basic table with header and data rows", async () => {
      const doc: TipTapDocument = {
        type: "doc",
        content: [
          {
            type: "table",
            content: [
              {
                type: "tableRow",
                content: [
                  {
                    type: "tableHeader",
                    attrs: { colwidth: [200] },
                    content: [{ type: "paragraph", content: [{ type: "text", text: "Name" }] }],
                  },
                  {
                    type: "tableHeader",
                    attrs: { colwidth: [200] },
                    content: [{ type: "paragraph", content: [{ type: "text", text: "Value" }] }],
                  },
                ],
              },
              {
                type: "tableRow",
                content: [
                  {
                    type: "tableCell",
                    attrs: { colwidth: [200] },
                    content: [{ type: "paragraph", content: [{ type: "text", text: "Foo" }] }],
                  },
                  {
                    type: "tableCell",
                    attrs: { colwidth: [200] },
                    content: [{ type: "paragraph", content: [{ type: "text", text: "Bar" }] }],
                  },
                ],
              },
            ],
          },
        ],
      };

      const buffer = await renderPlaneDocToDocxBuffer(doc);
      const xml = await extractDocumentXml(buffer);
      expect(xml).toContain("w:tbl");
      expect(xml).toContain("w:tr");
      expect(xml).toContain("w:tc");
      expect(xml).toContain("Name");
      expect(xml).toContain("Value");
      expect(xml).toContain("Foo");
      expect(xml).toContain("Bar");
    });

    it("should render table cell with background color", async () => {
      const doc: TipTapDocument = {
        type: "doc",
        content: [
          {
            type: "table",
            content: [
              {
                type: "tableRow",
                content: [
                  {
                    type: "tableCell",
                    attrs: { colwidth: [200], background: "#fef08a" },
                    content: [{ type: "paragraph", content: [{ type: "text", text: "Colored cell" }] }],
                  },
                ],
              },
            ],
          },
        ],
      };

      const buffer = await renderPlaneDocToDocxBuffer(doc);
      const xml = await extractDocumentXml(buffer);
      expect(xml).toContain("Colored cell");
      expect(xml).toContain("w:shd");
    });
  });

  describe("horizontalRule", () => {
    it("should render horizontal rule as paragraph with border", async () => {
      const doc: TipTapDocument = {
        type: "doc",
        content: [
          { type: "paragraph", content: [{ type: "text", text: "Before rule" }] },
          { type: "horizontalRule" },
          { type: "paragraph", content: [{ type: "text", text: "After rule" }] },
        ],
      };

      const buffer = await renderPlaneDocToDocxBuffer(doc);
      const xml = await extractDocumentXml(buffer);
      expect(xml).toContain("Before rule");
      expect(xml).toContain("After rule");
      expect(xml).toContain("w:pBdr");
    });
  });

  describe("hardBreak", () => {
    it("should render hard break as line break", async () => {
      const doc: TipTapDocument = {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "Line one" }, { type: "hardBreak" }, { type: "text", text: "Line two" }],
          },
        ],
      };

      const buffer = await renderPlaneDocToDocxBuffer(doc);
      const xml = await extractDocumentXml(buffer);
      expect(xml).toContain("Line one");
      expect(xml).toContain("Line two");
      expect(xml).toContain("w:br");
    });
  });

  describe("image", () => {
    it("should render inline PNG data image", async () => {
      const tinyPngBase64 =
        "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO5X2foAAAAASUVORK5CYII=";
      const doc: TipTapDocument = {
        type: "doc",
        content: [
          {
            type: "image",
            attrs: { src: `data:image/png;base64,${tinyPngBase64}` },
          },
        ],
      };

      const buffer = await renderPlaneDocToDocxBuffer(doc);
      const xml = await extractDocumentXml(buffer);
      expect(xml).toContain("w:drawing");
      expect(xml).not.toContain("[Image:");
    });

    it("should render image placeholder when no data available", async () => {
      const doc: TipTapDocument = {
        type: "doc",
        content: [
          {
            type: "image",
            attrs: { src: "https://example.com/photo.jpg" },
          },
        ],
      };

      const buffer = await renderPlaneDocToDocxBuffer(doc);
      const xml = await extractDocumentXml(buffer);
      expect(xml).toContain("[Image:");
    });

    it("should skip images when noAssets is set", async () => {
      const doc: TipTapDocument = {
        type: "doc",
        content: [
          {
            type: "image",
            attrs: { src: "https://example.com/photo.jpg" },
          },
          { type: "paragraph", content: [{ type: "text", text: "After image" }] },
        ],
      };

      const buffer = await renderPlaneDocToDocxBuffer(doc, { noAssets: true });
      const xml = await extractDocumentXml(buffer);
      expect(xml).not.toContain("[Image:");
      expect(xml).toContain("After image");
    });
  });

  describe("imageComponent", () => {
    it("should render imageComponent placeholder when no resolved URL", async () => {
      const doc: TipTapDocument = {
        type: "doc",
        content: [
          {
            type: "imageComponent",
            attrs: { src: "asset-uuid-123" },
          },
        ],
      };

      const buffer = await renderPlaneDocToDocxBuffer(doc);
      const xml = await extractDocumentXml(buffer);
      expect(xml).toContain("[Image:");
    });
  });

  describe("calloutComponent", () => {
    it("should render callout as a table with icon and content", async () => {
      const doc: TipTapDocument = {
        type: "doc",
        content: [
          {
            type: "calloutComponent",
            attrs: { "data-background": "blue" },
            content: [{ type: "paragraph", content: [{ type: "text", text: "Important note" }] }],
          },
        ],
      };

      const buffer = await renderPlaneDocToDocxBuffer(doc);
      const xml = await extractDocumentXml(buffer);
      expect(xml).toContain("w:tbl");
      expect(xml).toContain("Important note");
    });
  });

  describe("mention", () => {
    it("should render user mention with display name from metadata", async () => {
      const doc: TipTapDocument = {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              { type: "text", text: "Hello " },
              {
                type: "mention",
                attrs: {
                  id: "user-1",
                  entity_name: "user_mention",
                  entity_identifier: "user-1",
                },
              },
            ],
          },
        ],
      };

      const metadata: DocxExportMetadata = {
        baseUrl: "https://app.plane.so",
        workspaceSlug: "test-ws",
        userMentions: [{ id: "user-1", display_name: "Alice" }],
      };

      const buffer = await renderPlaneDocToDocxBuffer(doc, { metadata });
      const xml = await extractDocumentXml(buffer);
      expect(xml).toContain("@Alice");
      expect(xml).toContain("w:hyperlink");
    });

    it("should render mention without metadata as plain text", async () => {
      const doc: TipTapDocument = {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "mention",
                attrs: { id: "user-1", entity_name: "user_mention" },
              },
            ],
          },
        ],
      };

      const buffer = await renderPlaneDocToDocxBuffer(doc);
      const xml = await extractDocumentXml(buffer);
      expect(xml).toContain("@user_mention");
    });
  });

  describe("issue-embed-component", () => {
    it("should render work item embed with metadata", async () => {
      const doc: TipTapDocument = {
        type: "doc",
        content: [
          {
            type: "issue-embed-component",
            attrs: {
              id: "wi-1",
              entity_identifier: "wi-1",
              project_identifier: "PROJ",
              entity_name: "Bug fix",
            },
          },
        ],
      };

      const metadata: DocxExportMetadata = {
        baseUrl: "https://app.plane.so",
        workspaceSlug: "test-ws",
        workItemEmbeds: [
          {
            id: "wi-1",
            name: "Fix login bug",
            sequence_id: 42,
            project_id: "proj-1",
            project__identifier: "PROJ",
          },
        ],
      };

      const buffer = await renderPlaneDocToDocxBuffer(doc, { metadata });
      const xml = await extractDocumentXml(buffer);
      expect(xml).toContain("PROJ-42");
      expect(xml).toContain("Fix login bug");
    });

    it("should render work item embed without metadata using fallback", async () => {
      const doc: TipTapDocument = {
        type: "doc",
        content: [
          {
            type: "issue-embed-component",
            attrs: {
              id: "wi-1",
              project_identifier: "PROJ",
              entity_identifier: "123",
              entity_name: "",
            },
          },
        ],
      };

      const buffer = await renderPlaneDocToDocxBuffer(doc);
      const xml = await extractDocumentXml(buffer);
      expect(xml).toContain("PROJ-123");
    });
  });

  describe("pageEmbedComponent", () => {
    it("should render page embed with metadata and link", async () => {
      const doc: TipTapDocument = {
        type: "doc",
        content: [
          {
            type: "pageEmbedComponent",
            attrs: { entity_identifier: "page-1" },
          },
        ],
      };

      const metadata: DocxExportMetadata = {
        baseUrl: "https://app.plane.so",
        workspaceSlug: "test-ws",
        pageEmbeds: [{ id: "page-1", name: "Design Spec", project_id: "proj-1" }],
      };

      const buffer = await renderPlaneDocToDocxBuffer(doc, { metadata });
      const xml = await extractDocumentXml(buffer);
      expect(xml).toContain("Design Spec");
      expect(xml).toContain("w:hyperlink");
    });

    it("should render page embed without metadata as plain text", async () => {
      const doc: TipTapDocument = {
        type: "doc",
        content: [
          {
            type: "pageEmbedComponent",
            attrs: { entity_identifier: "page-abc" },
          },
        ],
      };

      const buffer = await renderPlaneDocToDocxBuffer(doc);
      const xml = await extractDocumentXml(buffer);
      expect(xml).toContain("page-abc");
    });
  });

  describe("pageLinkComponent", () => {
    it("should render page link as hyperlink when project_id present", async () => {
      const doc: TipTapDocument = {
        type: "doc",
        content: [
          {
            type: "pageLinkComponent",
            attrs: {
              entity_name: "page_link",
              entity_identifier: "page-2",
              project_id: "proj-1",
            },
          },
        ],
      };

      const metadata: DocxExportMetadata = {
        baseUrl: "https://app.plane.so",
        workspaceSlug: "test-ws",
      };

      const buffer = await renderPlaneDocToDocxBuffer(doc, { metadata });
      const xml = await extractDocumentXml(buffer);
      expect(xml).toContain("page-2");
      expect(xml).toContain("w:hyperlink");
    });
  });

  describe("attachmentComponent", () => {
    it("should render attachment with file name and size", async () => {
      const doc: TipTapDocument = {
        type: "doc",
        content: [
          {
            type: "attachmentComponent",
            attrs: {
              id: "attach-1",
              "data-name": "report.pdf",
              "data-file-size": 1048576,
            },
          },
        ],
      };

      const buffer = await renderPlaneDocToDocxBuffer(doc);
      const xml = await extractDocumentXml(buffer);
      expect(xml).toContain("report.pdf");
      expect(xml).toContain("1.0 MB");
    });

    it("should render attachment as hyperlink when URL is resolved", async () => {
      const doc: TipTapDocument = {
        type: "doc",
        content: [
          {
            type: "attachmentComponent",
            attrs: {
              id: "attach-1",
              "data-name": "doc.pdf",
              "data-file-size": 512,
            },
          },
        ],
      };

      const metadata: DocxExportMetadata = {
        resolvedImageUrls: { "attach-1": "https://cdn.example.com/doc.pdf" },
      };

      const buffer = await renderPlaneDocToDocxBuffer(doc, { metadata });
      const xml = await extractDocumentXml(buffer);
      expect(xml).toContain("doc.pdf");
      expect(xml).toContain("w:hyperlink");
    });
  });

  describe("externalEmbedComponent", () => {
    it("should render external embed as hyperlink", async () => {
      const doc: TipTapDocument = {
        type: "doc",
        content: [
          {
            type: "externalEmbedComponent",
            attrs: {
              src: "https://www.youtube.com/watch?v=abc",
              "data-entity-name": "YouTube Video",
            },
          },
        ],
      };

      const buffer = await renderPlaneDocToDocxBuffer(doc);
      const xml = await extractDocumentXml(buffer);
      expect(xml).toContain("YouTube Video");
      expect(xml).toContain("https://www.youtube.com/watch?v=abc");
      expect(xml).toContain("w:hyperlink");
    });
  });

  describe("blockMath", () => {
    it("should render block math as OMML math equation", async () => {
      const doc: TipTapDocument = {
        type: "doc",
        content: [
          {
            type: "blockMath",
            attrs: { latex: "E = mc^2" },
          },
        ],
      };

      const buffer = await renderPlaneDocToDocxBuffer(doc);
      const xml = await extractDocumentXml(buffer);
      expect(xml).toContain("m:oMath");
      expect(xml).toContain("center");
    });
  });

  describe("inlineMath", () => {
    it("should render inline math as OMML math equation", async () => {
      const doc: TipTapDocument = {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              { type: "text", text: "The formula " },
              { type: "inlineMath", attrs: { latex: "x^2 + y^2 = z^2" } },
              { type: "text", text: " is Pythagorean." },
            ],
          },
        ],
      };

      const buffer = await renderPlaneDocToDocxBuffer(doc);
      const xml = await extractDocumentXml(buffer);
      expect(xml).toContain("m:oMath");
    });
  });

  describe("drawIoComponent", () => {
    it("should render drawio diagram placeholder", async () => {
      const doc: TipTapDocument = {
        type: "doc",
        content: [
          {
            type: "drawIoComponent",
            attrs: { "data-mode": "diagram" },
          },
        ],
      };

      const buffer = await renderPlaneDocToDocxBuffer(doc);
      const xml = await extractDocumentXml(buffer);
      expect(xml).toContain("[Diagram]");
    });

    it("should render drawio whiteboard placeholder", async () => {
      const doc: TipTapDocument = {
        type: "doc",
        content: [
          {
            type: "drawIoComponent",
            attrs: { "data-mode": "board" },
          },
        ],
      };

      const buffer = await renderPlaneDocToDocxBuffer(doc);
      const xml = await extractDocumentXml(buffer);
      expect(xml).toContain("[Whiteboard]");
    });
  });

  describe("edge cases", () => {
    it("should handle deeply nested lists (9 levels)", async () => {
      const buildNestedList = (depth: number, current = 0): TipTapNode => {
        const content: TipTapNode[] = [{ type: "paragraph", content: [{ type: "text", text: `Level ${current}` }] }];
        if (current < depth - 1) {
          content.push({
            type: "bulletList",
            content: [buildNestedList(depth, current + 1)],
          });
        }
        return { type: "listItem", content } as TipTapNode;
      };

      const doc: TipTapDocument = {
        type: "doc",
        content: [
          {
            type: "bulletList",
            content: [buildNestedList(9)],
          },
        ],
      };

      const buffer = await renderPlaneDocToDocxBuffer(doc);
      const xml = await extractDocumentXml(buffer);
      expect(xml).toContain("Level 0");
      expect(xml).toContain("Level 8");
      expect(xml).toContain("w:numPr");
    });

    it("should handle a large document with 200 paragraphs", async () => {
      const doc: TipTapDocument = {
        type: "doc",
        content: Array.from({ length: 200 }, (_, i) => ({
          type: "paragraph" as const,
          content: [{ type: "text" as const, text: `Paragraph number ${i + 1}` }],
        })),
      };

      const buffer = await renderPlaneDocToDocxBuffer(doc);
      expect(buffer.length).toBeGreaterThan(0);
      const xml = await extractDocumentXml(buffer);
      expect(xml).toContain("Paragraph number 1");
      expect(xml).toContain("Paragraph number 200");
    });

    it("should handle table with empty cells", async () => {
      const doc: TipTapDocument = {
        type: "doc",
        content: [
          {
            type: "table",
            content: [
              {
                type: "tableRow",
                content: [
                  { type: "tableCell", attrs: { colwidth: [100] }, content: [] },
                  {
                    type: "tableCell",
                    attrs: { colwidth: [100] },
                    content: [{ type: "paragraph", content: [{ type: "text", text: "Data" }] }],
                  },
                ],
              },
            ],
          },
        ],
      };

      const buffer = await renderPlaneDocToDocxBuffer(doc);
      const xml = await extractDocumentXml(buffer);
      expect(xml).toContain("w:tbl");
      expect(xml).toContain("Data");
    });

    it("should handle a table with many rows (50 rows)", async () => {
      const doc: TipTapDocument = {
        type: "doc",
        content: [
          {
            type: "table",
            content: Array.from({ length: 50 }, (_, i) => ({
              type: "tableRow" as const,
              content: [
                {
                  type: "tableCell" as const,
                  attrs: { colwidth: [200] },
                  content: [{ type: "paragraph" as const, content: [{ type: "text" as const, text: `Row ${i + 1}` }] }],
                },
              ],
            })),
          },
        ],
      };

      const buffer = await renderPlaneDocToDocxBuffer(doc);
      const xml = await extractDocumentXml(buffer);
      expect(xml).toContain("Row 1");
      expect(xml).toContain("Row 50");
    });

    it("should handle paragraphs with all marks combined", async () => {
      const doc: TipTapDocument = {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: "All marks",
                marks: [
                  { type: "bold" },
                  { type: "italic" },
                  { type: "underline" },
                  { type: "strike" },
                  { type: "highlight", attrs: { color: "#fef08a" } },
                  { type: "subscript" },
                ],
              },
            ],
          },
        ],
      };

      const buffer = await renderPlaneDocToDocxBuffer(doc);
      const xml = await extractDocumentXml(buffer);
      expect(xml).toContain("All marks");
      expect(xml).toContain("<w:b/>");
      expect(xml).toContain("<w:i/>");
      expect(xml).toContain("w:u");
      expect(xml).toContain("<w:strike/>");
      expect(xml).toContain("w:shd");
    });

    it("should handle unknown node types gracefully via fallback", async () => {
      const doc: TipTapDocument = {
        type: "doc",
        content: [
          { type: "paragraph", content: [{ type: "text", text: "Before unknown" }] },
          { type: "unknownCustomNode" as string, content: [] },
          { type: "paragraph", content: [{ type: "text", text: "After unknown" }] },
        ],
      };

      const buffer = await renderPlaneDocToDocxBuffer(doc);
      const xml = await extractDocumentXml(buffer);
      expect(xml).toContain("Before unknown");
      expect(xml).toContain("After unknown");
    });

    it("should handle code block with very long single line", async () => {
      const longLine = "x".repeat(5000);
      const doc: TipTapDocument = {
        type: "doc",
        content: [
          {
            type: "codeBlock",
            content: [{ type: "text", text: longLine }],
          },
        ],
      };

      const buffer = await renderPlaneDocToDocxBuffer(doc);
      const xml = await extractDocumentXml(buffer);
      expect(xml).toContain("xxxxx");
    });

    it("should handle mixed list types (bullet inside ordered)", async () => {
      const doc: TipTapDocument = {
        type: "doc",
        content: [
          {
            type: "orderedList",
            content: [
              {
                type: "listItem",
                content: [
                  { type: "paragraph", content: [{ type: "text", text: "Ordered item" }] },
                  {
                    type: "bulletList",
                    content: [
                      {
                        type: "listItem",
                        content: [{ type: "paragraph", content: [{ type: "text", text: "Nested bullet" }] }],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };

      const buffer = await renderPlaneDocToDocxBuffer(doc);
      const xml = await extractDocumentXml(buffer);
      expect(xml).toContain("Ordered item");
      expect(xml).toContain("Nested bullet");
      expect(xml).toContain("w:numPr");
    });
  });

  describe("comprehensive document", () => {
    it("should render a document with all node types without crashing", async () => {
      const doc: TipTapDocument = {
        type: "doc",
        content: [
          { type: "heading", attrs: { level: 1 }, content: [{ type: "text", text: "Full Test Document" }] },
          {
            type: "paragraph",
            content: [
              { type: "text", text: "Normal " },
              { type: "text", text: "bold", marks: [{ type: "bold" }] },
              { type: "text", text: " " },
              { type: "text", text: "italic", marks: [{ type: "italic" }] },
              { type: "text", text: " " },
              { type: "text", text: "underline", marks: [{ type: "underline" }] },
              { type: "text", text: " " },
              { type: "text", text: "strike", marks: [{ type: "strike" }] },
              { type: "text", text: " " },
              { type: "text", text: "code", marks: [{ type: "code" }] },
              { type: "text", text: " " },
              { type: "text", text: "link", marks: [{ type: "link", attrs: { href: "https://plane.so" } }] },
            ],
          },
          { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Blockquote" }] },
          {
            type: "blockquote",
            content: [{ type: "paragraph", content: [{ type: "text", text: "A wise quote" }] }],
          },
          { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Code Block" }] },
          {
            type: "codeBlock",
            attrs: { language: "typescript" },
            content: [{ type: "text", text: "const x: number = 42;\nconsole.log(x);" }],
          },
          { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Lists" }] },
          {
            type: "bulletList",
            content: [
              { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Bullet A" }] }] },
              { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Bullet B" }] }] },
            ],
          },
          {
            type: "orderedList",
            content: [
              { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Number 1" }] }] },
              { type: "listItem", content: [{ type: "paragraph", content: [{ type: "text", text: "Number 2" }] }] },
            ],
          },
          {
            type: "taskList",
            content: [
              {
                type: "taskItem",
                attrs: { checked: true },
                content: [{ type: "paragraph", content: [{ type: "text", text: "Complete" }] }],
              },
              {
                type: "taskItem",
                attrs: { checked: false },
                content: [{ type: "paragraph", content: [{ type: "text", text: "Incomplete" }] }],
              },
            ],
          },
          { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Table" }] },
          {
            type: "table",
            content: [
              {
                type: "tableRow",
                content: [
                  {
                    type: "tableHeader",
                    attrs: { colwidth: [150] },
                    content: [{ type: "paragraph", content: [{ type: "text", text: "Col A" }] }],
                  },
                  {
                    type: "tableHeader",
                    attrs: { colwidth: [150] },
                    content: [{ type: "paragraph", content: [{ type: "text", text: "Col B" }] }],
                  },
                ],
              },
              {
                type: "tableRow",
                content: [
                  {
                    type: "tableCell",
                    attrs: { colwidth: [150] },
                    content: [{ type: "paragraph", content: [{ type: "text", text: "R1C1" }] }],
                  },
                  {
                    type: "tableCell",
                    attrs: { colwidth: [150] },
                    content: [{ type: "paragraph", content: [{ type: "text", text: "R1C2" }] }],
                  },
                ],
              },
            ],
          },
          { type: "horizontalRule" },
          { type: "heading", attrs: { level: 2 }, content: [{ type: "text", text: "Embeds & Components" }] },
          {
            type: "calloutComponent",
            attrs: { "data-background": "blue" },
            content: [{ type: "paragraph", content: [{ type: "text", text: "Callout content here" }] }],
          },
          {
            type: "mention",
            attrs: { id: "user-x", entity_name: "user_mention", entity_identifier: "user-x" },
          },
          {
            type: "issue-embed-component",
            attrs: { id: "issue-1", project_identifier: "PROJ", entity_identifier: "99", entity_name: "" },
          },
          {
            type: "pageEmbedComponent",
            attrs: { entity_identifier: "page-embed-1" },
          },
          {
            type: "pageLinkComponent",
            attrs: { entity_name: "page_link", entity_identifier: "page-link-1", project_id: "proj-1" },
          },
          {
            type: "attachmentComponent",
            attrs: { id: "att-1", "data-name": "file.zip", "data-file-size": 2048 },
          },
          {
            type: "externalEmbedComponent",
            attrs: { src: "https://figma.com/file/abc", "data-entity-name": "Figma" },
          },
          { type: "blockMath", attrs: { latex: "\\sum_{i=1}^{n} i = \\frac{n(n+1)}{2}" } },
          {
            type: "paragraph",
            content: [
              { type: "text", text: "Inline: " },
              { type: "inlineMath", attrs: { latex: "a^2 + b^2" } },
            ],
          },
          { type: "drawIoComponent", attrs: { "data-mode": "diagram" } },
          { type: "image", attrs: { src: "https://example.com/test.png" } },
        ],
      };

      const metadata: DocxExportMetadata = {
        baseUrl: "https://app.plane.so",
        workspaceSlug: "test-ws",
        userMentions: [{ id: "user-x", display_name: "Bob" }],
        workItemEmbeds: [
          {
            id: "issue-1",
            name: "Setup CI pipeline",
            sequence_id: 99,
            project_id: "proj-1",
            project__identifier: "PROJ",
          },
        ],
        pageEmbeds: [{ id: "page-embed-1", name: "Architecture Doc", project_id: "proj-1" }],
      };

      const buffer = await renderPlaneDocToDocxBuffer(doc, {
        title: "Comprehensive Test",
        author: "Plane Test",
        metadata,
      });

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.toString("ascii", 0, 2)).toBe(DOCX_MAGIC);

      const xml = await extractDocumentXml(buffer);

      // Verify all content rendered
      expect(xml).toContain("Full Test Document");
      expect(xml).toContain("A wise quote");
      expect(xml).toContain("const x: number = 42;");
      expect(xml).toContain("Bullet A");
      expect(xml).toContain("Number 1");
      expect(xml).toContain("Complete");
      expect(xml).toContain("Col A");
      expect(xml).toContain("R1C1");
      expect(xml).toContain("Callout content here");
      expect(xml).toContain("@Bob");
      expect(xml).toContain("PROJ-99");
      expect(xml).toContain("Setup CI pipeline");
      expect(xml).toContain("Architecture Doc");
      expect(xml).toContain("page-link-1");
      expect(xml).toContain("file.zip");
      expect(xml).toContain("Figma");
      expect(xml).toContain("m:oMath");
      expect(xml).toContain("[Diagram]");
      expect(xml).toContain("[Image:");

      // Verify DOCX structure
      expect(xml).toContain("w:tbl"); // table
      expect(xml).toContain("w:hyperlink"); // links
      expect(xml).toContain("w:pBdr"); // horizontal rule border
      expect(xml).toContain("w:numPr"); // list numbering present
      expect(xml).toContain("BlockQuote");
      expect(xml).toContain("SourceCode");
    });
  });
});
