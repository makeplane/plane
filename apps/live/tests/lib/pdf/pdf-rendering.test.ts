/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { describe, it, expect } from "vitest";
import { PDFParse } from "pdf-parse";
import { renderPlaneDocToPdfBuffer } from "@/lib/pdf";
import type { TipTapDocument, PDFExportMetadata } from "@/lib/pdf";

const PDF_HEADER = "%PDF-";

/**
 * Helper to extract text content from a PDF buffer
 */
async function extractPdfText(buffer: Buffer): Promise<string> {
  const uint8 = new Uint8Array(buffer);
  const parser = new PDFParse(uint8);
  const result = await parser.getText();
  return result.pages.map((p) => p.text).join("\n");
}

describe("PDF Rendering Integration", () => {
  describe("renderPlaneDocToPdfBuffer", () => {
    it("should render empty document to valid PDF", async () => {
      const doc: TipTapDocument = {
        type: "doc",
        content: [],
      };

      const buffer = await renderPlaneDocToPdfBuffer(doc);

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.length).toBeGreaterThan(0);
      expect(buffer.toString("ascii", 0, 5)).toBe(PDF_HEADER);
    });

    it("should render document with title and verify content", async () => {
      const doc: TipTapDocument = {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "Hello World" }],
          },
        ],
      };

      const buffer = await renderPlaneDocToPdfBuffer(doc, {
        title: "Test Document",
      });

      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.toString("ascii", 0, 5)).toBe(PDF_HEADER);

      const text = await extractPdfText(buffer);
      expect(text).toContain("Hello World");
      // Title is rendered in PDF content when provided
      expect(text).toContain("Test Document");
    });

    it("should render heading nodes and verify text", async () => {
      const doc: TipTapDocument = {
        type: "doc",
        content: [
          {
            type: "heading",
            attrs: { level: 1 },
            content: [{ type: "text", text: "Main Heading" }],
          },
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "Subheading" }],
          },
        ],
      };

      const buffer = await renderPlaneDocToPdfBuffer(doc);
      const text = await extractPdfText(buffer);

      expect(text).toContain("Main Heading");
      expect(text).toContain("Subheading");
    });

    it("should render paragraph with text and verify content", async () => {
      const doc: TipTapDocument = {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "This is a test paragraph with some content." }],
          },
        ],
      };

      const buffer = await renderPlaneDocToPdfBuffer(doc);
      const text = await extractPdfText(buffer);

      expect(text).toContain("This is a test paragraph with some content.");
    });

    it("should render bullet list with all items", async () => {
      const doc: TipTapDocument = {
        type: "doc",
        content: [
          {
            type: "bulletList",
            content: [
              {
                type: "listItem",
                content: [
                  {
                    type: "paragraph",
                    content: [{ type: "text", text: "First item" }],
                  },
                ],
              },
              {
                type: "listItem",
                content: [
                  {
                    type: "paragraph",
                    content: [{ type: "text", text: "Second item" }],
                  },
                ],
              },
              {
                type: "listItem",
                content: [
                  {
                    type: "paragraph",
                    content: [{ type: "text", text: "Third item" }],
                  },
                ],
              },
            ],
          },
        ],
      };

      const buffer = await renderPlaneDocToPdfBuffer(doc);
      const text = await extractPdfText(buffer);

      expect(text).toContain("First item");
      expect(text).toContain("Second item");
      expect(text).toContain("Third item");
      // Bullet points should be present
      expect(text).toContain("•");
    });

    it("should render ordered list with numbers", async () => {
      const doc: TipTapDocument = {
        type: "doc",
        content: [
          {
            type: "orderedList",
            content: [
              {
                type: "listItem",
                content: [
                  {
                    type: "paragraph",
                    content: [{ type: "text", text: "Step one" }],
                  },
                ],
              },
              {
                type: "listItem",
                content: [
                  {
                    type: "paragraph",
                    content: [{ type: "text", text: "Step two" }],
                  },
                ],
              },
            ],
          },
        ],
      };

      const buffer = await renderPlaneDocToPdfBuffer(doc);
      const text = await extractPdfText(buffer);

      expect(text).toContain("Step one");
      expect(text).toContain("Step two");
      // Numbers should be present
      expect(text).toMatch(/1\./);
      expect(text).toMatch(/2\./);
    });

    it("should render task list with task text", async () => {
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
                  {
                    type: "paragraph",
                    content: [{ type: "text", text: "Completed task" }],
                  },
                ],
              },
              {
                type: "taskItem",
                attrs: { checked: false },
                content: [
                  {
                    type: "paragraph",
                    content: [{ type: "text", text: "Pending task" }],
                  },
                ],
              },
            ],
          },
        ],
      };

      const buffer = await renderPlaneDocToPdfBuffer(doc);
      const text = await extractPdfText(buffer);

      expect(text).toContain("Completed task");
      expect(text).toContain("Pending task");
    });

    it("should render code block with code content", async () => {
      const doc: TipTapDocument = {
        type: "doc",
        content: [
          {
            type: "codeBlock",
            content: [
              { type: "text", text: "const greeting = 'Hello';\n" },
              { type: "text", text: "console.log(greeting);" },
            ],
          },
        ],
      };

      const buffer = await renderPlaneDocToPdfBuffer(doc);
      const text = await extractPdfText(buffer);

      expect(text).toContain("const greeting");
      expect(text).toContain("console.log");
    });

    it("should render blockquote with quoted text", async () => {
      const doc: TipTapDocument = {
        type: "doc",
        content: [
          {
            type: "blockquote",
            content: [
              {
                type: "paragraph",
                content: [{ type: "text", text: "This is a quoted text." }],
              },
            ],
          },
        ],
      };

      const buffer = await renderPlaneDocToPdfBuffer(doc);
      const text = await extractPdfText(buffer);

      expect(text).toContain("This is a quoted text.");
    });

    it("should render table with all cell content", async () => {
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
                    content: [
                      {
                        type: "paragraph",
                        content: [{ type: "text", text: "Header 1" }],
                      },
                    ],
                  },
                  {
                    type: "tableHeader",
                    content: [
                      {
                        type: "paragraph",
                        content: [{ type: "text", text: "Header 2" }],
                      },
                    ],
                  },
                ],
              },
              {
                type: "tableRow",
                content: [
                  {
                    type: "tableCell",
                    content: [
                      {
                        type: "paragraph",
                        content: [{ type: "text", text: "Cell 1" }],
                      },
                    ],
                  },
                  {
                    type: "tableCell",
                    content: [
                      {
                        type: "paragraph",
                        content: [{ type: "text", text: "Cell 2" }],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };

      const buffer = await renderPlaneDocToPdfBuffer(doc);
      const text = await extractPdfText(buffer);

      expect(text).toContain("Header 1");
      expect(text).toContain("Header 2");
      expect(text).toContain("Cell 1");
      expect(text).toContain("Cell 2");
    });

    it("should render horizontal rule with surrounding text", async () => {
      const doc: TipTapDocument = {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "Before rule" }],
          },
          { type: "horizontalRule" },
          {
            type: "paragraph",
            content: [{ type: "text", text: "After rule" }],
          },
        ],
      };

      const buffer = await renderPlaneDocToPdfBuffer(doc);
      const text = await extractPdfText(buffer);

      expect(text).toContain("Before rule");
      expect(text).toContain("After rule");
    });

    it("should render text with marks (bold, italic) preserving content", async () => {
      const doc: TipTapDocument = {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              { type: "text", text: "Normal " },
              {
                type: "text",
                text: "bold",
                marks: [{ type: "bold" }],
              },
              { type: "text", text: " and " },
              {
                type: "text",
                text: "italic",
                marks: [{ type: "italic" }],
              },
              { type: "text", text: " text." },
            ],
          },
        ],
      };

      const buffer = await renderPlaneDocToPdfBuffer(doc);
      const text = await extractPdfText(buffer);

      expect(text).toContain("Normal");
      expect(text).toContain("bold");
      expect(text).toContain("italic");
      expect(text).toContain("text.");
    });

    it("should render link marks with link text", async () => {
      const doc: TipTapDocument = {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [
              { type: "text", text: "Click " },
              {
                type: "text",
                text: "here",
                marks: [{ type: "link", attrs: { href: "https://example.com" } }],
              },
              { type: "text", text: " to visit." },
            ],
          },
        ],
      };

      const buffer = await renderPlaneDocToPdfBuffer(doc);
      const text = await extractPdfText(buffer);

      expect(text).toContain("Click");
      expect(text).toContain("here");
      expect(text).toContain("to visit");
    });
  });

  describe("page options", () => {
    it("should support different page sizes and verify content renders", async () => {
      const doc: TipTapDocument = {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "Page size test content" }],
          },
        ],
      };

      const a4Buffer = await renderPlaneDocToPdfBuffer(doc, { pageSize: "A4" });
      const letterBuffer = await renderPlaneDocToPdfBuffer(doc, { pageSize: "LETTER" });

      const a4Text = await extractPdfText(a4Buffer);
      const letterText = await extractPdfText(letterBuffer);

      expect(a4Text).toContain("Page size test content");
      expect(letterText).toContain("Page size test content");
      // Different page sizes should produce different PDF sizes
      expect(a4Buffer.length).not.toBe(letterBuffer.length);
    });

    it("should support landscape orientation and verify content", async () => {
      const doc: TipTapDocument = {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "Landscape content here" }],
          },
        ],
      };

      const portraitBuffer = await renderPlaneDocToPdfBuffer(doc, { pageOrientation: "portrait" });
      const landscapeBuffer = await renderPlaneDocToPdfBuffer(doc, { pageOrientation: "landscape" });

      const portraitText = await extractPdfText(portraitBuffer);
      const landscapeText = await extractPdfText(landscapeBuffer);

      expect(portraitText).toContain("Landscape content here");
      expect(landscapeText).toContain("Landscape content here");
      expect(portraitBuffer.length).not.toBe(landscapeBuffer.length);
    });

    it("should include author metadata in PDF", async () => {
      const doc: TipTapDocument = {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "Document content" }],
          },
        ],
      };

      const buffer = await renderPlaneDocToPdfBuffer(doc, {
        author: "Test Author",
      });

      // Verify PDF is valid and contains content
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.toString("ascii", 0, 5)).toBe(PDF_HEADER);
      // Author metadata is embedded in PDF info dict (checked via raw bytes)
      const pdfString = buffer.toString("latin1");
      expect(pdfString).toContain("/Author");
    });

    it("should include subject metadata in PDF", async () => {
      const doc: TipTapDocument = {
        type: "doc",
        content: [
          {
            type: "paragraph",
            content: [{ type: "text", text: "Document content" }],
          },
        ],
      };

      const buffer = await renderPlaneDocToPdfBuffer(doc, {
        subject: "Technical Documentation",
      });

      // Verify PDF is valid
      expect(buffer).toBeInstanceOf(Buffer);
      expect(buffer.toString("ascii", 0, 5)).toBe(PDF_HEADER);
      // Subject metadata is embedded in PDF info dict
      const pdfString = buffer.toString("latin1");
      expect(pdfString).toContain("/Subject");
    });
  });

  describe("metadata rendering", () => {
    it("should render user mentions with resolved display name", async () => {
      const metadata: PDFExportMetadata = {
        userMentions: [{ id: "user-123", display_name: "John Doe" }],
      };

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
                  entity_name: "user_mention",
                  entity_identifier: "user-123",
                },
              },
            ],
          },
        ],
      };

      const buffer = await renderPlaneDocToPdfBuffer(doc, { metadata });
      const text = await extractPdfText(buffer);

      expect(text).toContain("Hello");
      expect(text).toContain("John Doe");
    });
  });

  describe("complex documents", () => {
    it("should render a full document with mixed content and verify all sections", async () => {
      const doc: TipTapDocument = {
        type: "doc",
        content: [
          {
            type: "heading",
            attrs: { level: 1 },
            content: [{ type: "text", text: "Project Overview" }],
          },
          {
            type: "paragraph",
            content: [
              { type: "text", text: "This document describes the " },
              { type: "text", text: "key features", marks: [{ type: "bold" }] },
              { type: "text", text: " of the project." },
            ],
          },
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "Features" }],
          },
          {
            type: "bulletList",
            content: [
              {
                type: "listItem",
                content: [
                  {
                    type: "paragraph",
                    content: [{ type: "text", text: "Feature A - Core functionality" }],
                  },
                ],
              },
              {
                type: "listItem",
                content: [
                  {
                    type: "paragraph",
                    content: [{ type: "text", text: "Feature B - Advanced options" }],
                  },
                ],
              },
            ],
          },
          {
            type: "heading",
            attrs: { level: 2 },
            content: [{ type: "text", text: "Code Example" }],
          },
          {
            type: "codeBlock",
            content: [{ type: "text", text: "function hello() {\n  return 'world';\n}" }],
          },
          {
            type: "blockquote",
            content: [
              {
                type: "paragraph",
                content: [{ type: "text", text: "Important: Review before deployment." }],
              },
            ],
          },
          { type: "horizontalRule" },
          {
            type: "paragraph",
            content: [{ type: "text", text: "End of document." }],
          },
        ],
      };

      const buffer = await renderPlaneDocToPdfBuffer(doc, {
        title: "Project Overview",
        author: "Development Team",
        subject: "Technical Documentation",
      });

      const text = await extractPdfText(buffer);

      // Verify metadata is embedded in PDF
      const pdfString = buffer.toString("latin1");
      expect(pdfString).toContain("/Title");
      expect(pdfString).toContain("/Author");
      expect(pdfString).toContain("/Subject");

      // Verify all content sections are present
      expect(text).toContain("Project Overview");
      expect(text).toContain("This document describes the");
      expect(text).toContain("key features");
      expect(text).toContain("Features");
      expect(text).toContain("Feature A - Core functionality");
      expect(text).toContain("Feature B - Advanced options");
      expect(text).toContain("Code Example");
      expect(text).toContain("function hello");
      expect(text).toContain("Important: Review before deployment");
      expect(text).toContain("End of document");
    });

    it("should render deeply nested lists with all levels", async () => {
      const doc: TipTapDocument = {
        type: "doc",
        content: [
          {
            type: "bulletList",
            content: [
              {
                type: "listItem",
                content: [
                  {
                    type: "paragraph",
                    content: [{ type: "text", text: "Level 1" }],
                  },
                  {
                    type: "bulletList",
                    content: [
                      {
                        type: "listItem",
                        content: [
                          {
                            type: "paragraph",
                            content: [{ type: "text", text: "Level 2" }],
                          },
                          {
                            type: "bulletList",
                            content: [
                              {
                                type: "listItem",
                                content: [
                                  {
                                    type: "paragraph",
                                    content: [{ type: "text", text: "Level 3" }],
                                  },
                                ],
                              },
                            ],
                          },
                        ],
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      };

      const buffer = await renderPlaneDocToPdfBuffer(doc);
      const text = await extractPdfText(buffer);

      expect(text).toContain("Level 1");
      expect(text).toContain("Level 2");
      expect(text).toContain("Level 3");
    });
  });

  describe("noAssets option", () => {
    it("should render text but skip images when noAssets is true", async () => {
      const doc: TipTapDocument = {
        type: "doc",
        content: [
          {
            type: "image",
            attrs: { src: "https://example.com/image.png" },
          },
          {
            type: "paragraph",
            content: [{ type: "text", text: "Text after image" }],
          },
        ],
      };

      const buffer = await renderPlaneDocToPdfBuffer(doc, { noAssets: true });
      const text = await extractPdfText(buffer);

      expect(text).toContain("Text after image");
    });

  });
});
