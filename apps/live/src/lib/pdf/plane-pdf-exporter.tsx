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
import { Document, Font, Page, pdf, Text, View } from "@react-pdf/renderer";
import type { Style } from "@react-pdf/types";
import { annotateCodeBlocksForPdf } from "./code-highlighter";
import { hasLocalEmojiAssetSupport, resolveEmojiAssetSource } from "./emoji-assets";
import { createKeyGenerator, getFontStyle, renderNode } from "./node-renderers";
import { pdfStyles } from "./styles";
import type { PDFExportOptions, TipTapDocument } from "./types";

const PDF_PAGE_DIMENSIONS = {
  A4: { width: 595.28, height: 841.89 },
  A3: { width: 841.89, height: 1190.55 },
  A2: { width: 1190.55, height: 1683.78 },
  LETTER: { width: 612, height: 792 },
  LEGAL: { width: 612, height: 1008 },
  TABLOID: { width: 792, height: 1224 },
} as const;

const PAGE_HORIZONTAL_PADDING = 144;

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

if (hasLocalEmojiAssetSupport) {
  // Keep inline emojis airgapped-safe by resolving them from bundled local assets.
  Font.registerEmojiSource({
    builder: (code) => resolveEmojiAssetSource(code) || resolveEmojiAssetSource("1f4a1") || "",
  });
}

Font.registerHyphenationCallback((word) => [word]);

const normalizePdfTitle = (title: string | undefined): string => title?.replace(/\s+/g, " ").trim() ?? "";

const getPdfTitleStyle = (title: string): Style => {
  if (title.length >= 140) {
    return pdfStyles.titleCompact;
  }

  if (title.length >= 90) {
    return pdfStyles.titleMedium;
  }

  return {};
};

const getPageContentWidth = (
  pageSize: NonNullable<PDFExportOptions["pageSize"]>,
  pageOrientation: NonNullable<PDFExportOptions["pageOrientation"]>
): number => {
  const pageDimensions = PDF_PAGE_DIMENSIONS[pageSize] ?? PDF_PAGE_DIMENSIONS.A4;
  const pageWidth = pageOrientation === "landscape" ? pageDimensions.height : pageDimensions.width;
  return Math.max(pageWidth - PAGE_HORIZONTAL_PADDING, 0);
};

export const createPdfDocument = (doc: TipTapDocument, options: PDFExportOptions = {}) => {
  const { title, author, subject, pageSize = "LETTER", pageOrientation = "portrait", metadata, noAssets } = options;

  // Merge noAssets into metadata for use in node renderers
  const mergedMetadata = {
    ...metadata,
    noAssets,
    pageContentWidth: getPageContentWidth(pageSize, pageOrientation),
  };
  const normalizedTitle = normalizePdfTitle(title);

  const content = doc.content || [];
  const getKey = createKeyGenerator();
  const renderedContent = content.map((node, index) => renderNode(node, "doc", index, mergedMetadata, getKey));

  return (
    <Document title={normalizedTitle || undefined} author={author} subject={subject}>
      <Page size={pageSize} orientation={pageOrientation} style={pdfStyles.page}>
        {normalizedTitle ? (
          <View style={pdfStyles.titleContainer}>
            <Text style={[pdfStyles.title, getPdfTitleStyle(normalizedTitle), getFontStyle(normalizedTitle)]}>
              {normalizedTitle}
            </Text>
          </View>
        ) : null}
        {renderedContent}
        {normalizedTitle ? (
          <Text fixed style={pdfStyles.footerTitle}>
            {normalizedTitle}
          </Text>
        ) : null}
        <Text fixed style={pdfStyles.footerPageNumber} render={({ pageNumber }) => `${pageNumber}`} />
      </Page>
    </Document>
  );
};

export const renderPlaneDocToPdfBuffer = async (
  doc: TipTapDocument,
  options: PDFExportOptions = {}
): Promise<Buffer> => {
  const preparedDoc = await annotateCodeBlocksForPdf(doc);
  const pdfDocument = createPdfDocument(preparedDoc, options);
  const pdfInstance = pdf(pdfDocument);
  const blob = await pdfInstance.toBlob();
  const arrayBuffer = await blob.arrayBuffer();
  return Buffer.from(arrayBuffer);
};

export const renderPlaneDocToPdfBlob = async (doc: TipTapDocument, options: PDFExportOptions = {}): Promise<Blob> => {
  const preparedDoc = await annotateCodeBlocksForPdf(doc);
  const pdfDocument = createPdfDocument(preparedDoc, options);
  const pdfInstance = pdf(pdfDocument);
  return await pdfInstance.toBlob();
};
