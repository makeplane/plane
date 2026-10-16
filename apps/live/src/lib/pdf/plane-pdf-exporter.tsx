/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { createRequire } from "module";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Document, Font, Page, pdf, Text } from "@react-pdf/renderer";
import { createKeyGenerator, renderNode } from "./node-renderers";
import { pdfStyles } from "./styles";
import type { PDFExportOptions, TipTapDocument } from "./types";

// Use createRequire for ESM compatibility to resolve font file paths
const require = createRequire(import.meta.url);

// Resolve local font file paths from @fontsource/inter package
const interFontDir = path.dirname(require.resolve("@fontsource/inter/package.json"));

Font.register({
  family: "Inter",
  fonts: [
    {
      src: path.join(interFontDir, "files/inter-latin-400-normal.woff"),
      fontWeight: 400,
    },
    {
      src: path.join(interFontDir, "files/inter-latin-400-italic.woff"),
      fontWeight: 400,
      fontStyle: "italic",
    },
    {
      src: path.join(interFontDir, "files/inter-latin-600-normal.woff"),
      fontWeight: 600,
    },
    {
      src: path.join(interFontDir, "files/inter-latin-600-italic.woff"),
      fontWeight: 600,
      fontStyle: "italic",
    },
    {
      src: path.join(interFontDir, "files/inter-latin-700-normal.woff"),
      fontWeight: 700,
    },
    {
      src: path.join(interFontDir, "files/inter-latin-700-italic.woff"),
      fontWeight: 700,
      fontStyle: "italic",
    },
  ],
});

// Resolve Vazirmatn font files for Persian / Arabic RTL content in PDF exports
const vazirmatnCandidates = [
  path.resolve(process.cwd(), "apps/live/fonts/vazirmatn"),
  path.resolve(process.cwd(), "fonts/vazirmatn"),
  path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../fonts/vazirmatn"),
];
const vazirmatnFontDir = vazirmatnCandidates.find((dir) => fs.existsSync(dir)) || vazirmatnCandidates[0];

Font.register({
  family: "Vazirmatn",
  fonts: [
    {
      src: fs.existsSync(path.join(vazirmatnFontDir, "vazirmatn-regular.woff"))
        ? path.join(vazirmatnFontDir, "vazirmatn-regular.woff")
        : path.join(vazirmatnFontDir, "vazirmatn-regular.ttf"),
      fontWeight: 400,
    },
    {
      src: fs.existsSync(path.join(vazirmatnFontDir, "vazirmatn-bold.woff"))
        ? path.join(vazirmatnFontDir, "vazirmatn-bold.woff")
        : path.join(vazirmatnFontDir, "vazirmatn-bold.ttf"),
      fontWeight: 700,
    },
  ],
});

export const createPdfDocument = (doc: TipTapDocument, options: PDFExportOptions = {}) => {
  const { title, author, subject, pageSize = "A4", pageOrientation = "portrait", metadata, noAssets } = options;

  // Merge noAssets into metadata for use in node renderers
  const mergedMetadata = { ...metadata, noAssets };

  const content = doc.content || [];
  const getKey = createKeyGenerator();
  const renderedContent = content.map((node, index) => renderNode(node, "doc", index, mergedMetadata, getKey));

  const isTitleRtl = title
    ? /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(title)
    : false;
  const titleStyle = [pdfStyles.title, isTitleRtl ? ({ fontFamily: "Vazirmatn", textAlign: "right" as const }) : {}];

  return (
    <Document title={title} author={author} subject={subject}>
      <Page size={pageSize} orientation={pageOrientation} style={pdfStyles.page}>
        {title && <Text style={titleStyle}>{title}</Text>}
        {renderedContent}
      </Page>
    </Document>
  );
};

export const renderPlaneDocToPdfBuffer = async (
  doc: TipTapDocument,
  options: PDFExportOptions = {}
): Promise<Buffer> => {
  const pdfDocument = createPdfDocument(doc, options);
  const pdfInstance = pdf(pdfDocument);
  const blob = await pdfInstance.toBlob();
  const arrayBuffer = await blob.arrayBuffer();
  return Buffer.from(arrayBuffer);
};

export const renderPlaneDocToPdfBlob = async (doc: TipTapDocument, options: PDFExportOptions = {}): Promise<Blob> => {
  const pdfDocument = createPdfDocument(doc, options);
  const pdfInstance = pdf(pdfDocument);
  return await pdfInstance.toBlob();
};
