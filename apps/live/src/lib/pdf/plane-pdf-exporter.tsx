/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import { fileURLToPath } from "url";
import path from "path";
import { Document, Font, Page, pdf, Text } from "@react-pdf/renderer";
import { createKeyGenerator, getFontStyle, renderNode } from "./node-renderers";
import { pdfStyles } from "./styles";
import type { PDFExportOptions, TipTapDocument } from "./types";

// Resolve fonts directory relative to this module (works in both dev and bundled prod)
// In dev: resolves to apps/live/src/lib/pdf -> ../../assets/fonts
// In prod (bundled): resolves to apps/live/dist -> ./fonts (copied by tsdown)
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Fonts are copied to dist/assets/fonts by tsdown's copy option (from assets/fonts)
// In development, fonts are in assets/fonts at the app root
const getFontsDir = (): string => {
  // Production: fonts are in dist/assets/fonts (tsdown copies assets/ to dist/assets/)
  const prodFontsDir = path.join(__dirname, "assets/fonts");
  // Development: fonts are in assets/fonts relative to src/lib/pdf (3 levels up)
  const devFontsDir = path.resolve(__dirname, "../../../assets/fonts");

  // Check if running from bundled dist
  if (__dirname.includes("/dist")) {
    return prodFontsDir;
  }
  return devFontsDir;
};

const fontsDir = getFontsDir();

Font.register({
  family: "Noto Sans CJK",
  fonts: [
    {
      src: path.join(fontsDir, "NotoSansCJKsc-Regular.otf"),
      fontWeight: 400,
    },
    {
      src: path.join(fontsDir, "NotoSansCJKsc-Regular.otf"),
      fontWeight: 400,
      fontStyle: "italic",
    },
    {
      src: path.join(fontsDir, "NotoSansCJKsc-Bold.otf"),
      fontWeight: 600,
    },
    {
      src: path.join(fontsDir, "NotoSansCJKsc-Bold.otf"),
      fontWeight: 600,
      fontStyle: "italic",
    },
    {
      src: path.join(fontsDir, "NotoSansCJKsc-Bold.otf"),
      fontWeight: 700,
    },
    {
      src: path.join(fontsDir, "NotoSansCJKsc-Bold.otf"),
      fontWeight: 700,
      fontStyle: "italic",
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

  return (
    <Document title={title} author={author} subject={subject}>
      <Page size={pageSize} orientation={pageOrientation} style={pdfStyles.page}>
        {title && <Text style={[pdfStyles.title, getFontStyle(title)]}>{title}</Text>}
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
