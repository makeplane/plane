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
import { CJK_CHAR_REGEX } from "@plane/constants";
import { logger } from "@plane/logger";
import { annotateCodeBlocksForPdf } from "./code-highlighter";
import { hasLocalEmojiAssetSupport, resolveEmojiAssetSource } from "./emoji-assets";
import { CJK_FONT_FAMILY, INTER_FONT_FAMILY, getFontStyle } from "./fonts";
import { createKeyGenerator, renderNode } from "./node-renderers";
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

// Register Inter eagerly — it's the default font set on every page style, so it
// must be available before any render. Registering at module load is cheap.
Font.register({
  family: INTER_FONT_FAMILY,
  fonts: [
    { src: path.join(fontsDir, "inter-latin-400-normal.woff"), fontWeight: 400 },
    { src: path.join(fontsDir, "inter-latin-400-italic.woff"), fontWeight: 400, fontStyle: "italic" },
    { src: path.join(fontsDir, "inter-latin-600-normal.woff"), fontWeight: 600 },
    { src: path.join(fontsDir, "inter-latin-600-italic.woff"), fontWeight: 600, fontStyle: "italic" },
    { src: path.join(fontsDir, "inter-latin-700-normal.woff"), fontWeight: 700 },
    { src: path.join(fontsDir, "inter-latin-700-italic.woff"), fontWeight: 700, fontStyle: "italic" },
  ],
});

// Lazy CJK font registration. Noto Sans CJK (~32MB) is very CPU-heavy to subset
// during `pdf.toBlob()` and dominates render time on CPU-throttled pods.
// Only register when the document actually contains CJK characters. Note:
// Font.register() only records the path — fontkit.open() parses the 32MB OTF
// lazily on first render and memoizes, so subsequent CJK renders are cheap.
let cjkFontsRegistered = false;
const ensureCjkFontsRegistered = (): void => {
  if (cjkFontsRegistered) return;
  cjkFontsRegistered = true;
  logger.info(`PDF: registering ${CJK_FONT_FAMILY} font family (~32MB, parsed on first CJK render)`);
  Font.register({
    family: CJK_FONT_FAMILY,
    fonts: [
      { src: path.join(fontsDir, "NotoSansCJKsc-Regular.otf"), fontWeight: 400 },
      { src: path.join(fontsDir, "NotoSansCJKsc-Regular.otf"), fontWeight: 400, fontStyle: "italic" },
      { src: path.join(fontsDir, "NotoSansCJKsc-Bold.otf"), fontWeight: 600 },
      { src: path.join(fontsDir, "NotoSansCJKsc-Bold.otf"), fontWeight: 600, fontStyle: "italic" },
      { src: path.join(fontsDir, "NotoSansCJKsc-Bold.otf"), fontWeight: 700 },
      { src: path.join(fontsDir, "NotoSansCJKsc-Bold.otf"), fontWeight: 700, fontStyle: "italic" },
    ],
  });
};

const documentContainsCjk = (doc: TipTapDocument, title?: string): boolean => {
  if (title && CJK_CHAR_REGEX.test(title)) return true;
  const walk = (node: { text?: unknown; content?: unknown }): boolean => {
    if (typeof node.text === "string" && CJK_CHAR_REGEX.test(node.text)) return true;
    if (Array.isArray(node.content)) {
      for (const child of node.content) {
        if (child && typeof child === "object" && walk(child as { text?: unknown; content?: unknown })) return true;
      }
    }
    return false;
  };
  return walk(doc as unknown as { text?: unknown; content?: unknown });
};

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
        {/* Page-number footer intentionally omitted. `<Text fixed render={...} />`
            triggers a @react-pdf/renderer 4.3.2 pagination bug on long documents
            (~11+ pages): yoga's box.height for the dynamic text balloons to
            ~2.76e19 and accumulates across per-page relayouts until pdfkit's
            PDFObject.number guard (`|n| < 1e21`) trips with
            `unsupported number: -1.5519118618817368e+21`. Wrapping the Text in a
            <View fixed> just moves the throw. Dropping page numbers is the
            simplest working fix until upstream ships a pagination-stable API. */}
      </Page>
    </Document>
  );
};

const resolveCjkDecision = (
  preparedDoc: TipTapDocument,
  options: PDFExportOptions
): { needsCjk: boolean; source: "client-hint" | "server-scan" } => {
  if (typeof options.containsCjk === "boolean") {
    return { needsCjk: options.containsCjk, source: "client-hint" };
  }
  return { needsCjk: documentContainsCjk(preparedDoc, options.title), source: "server-scan" };
};

export const renderPlaneDocToPdfBuffer = async (
  doc: TipTapDocument,
  options: PDFExportOptions = {}
): Promise<Buffer> => {
  const preparedDoc = await annotateCodeBlocksForPdf(doc);
  const { needsCjk, source } = resolveCjkDecision(preparedDoc, options);
  logger.info("PDF: CJK decision", { needsCjk, source, alreadyRegistered: cjkFontsRegistered });
  if (needsCjk) ensureCjkFontsRegistered();
  const pdfDocument = createPdfDocument(preparedDoc, options);
  const pdfInstance = pdf(pdfDocument);
  const blob = await pdfInstance.toBlob();
  const arrayBuffer = await blob.arrayBuffer();
  return Buffer.from(arrayBuffer);
};

export const renderPlaneDocToPdfBlob = async (doc: TipTapDocument, options: PDFExportOptions = {}): Promise<Blob> => {
  const preparedDoc = await annotateCodeBlocksForPdf(doc);
  const { needsCjk, source } = resolveCjkDecision(preparedDoc, options);
  logger.info("PDF: CJK decision", { needsCjk, source, alreadyRegistered: cjkFontsRegistered });
  if (needsCjk) ensureCjkFontsRegistered();
  const pdfDocument = createPdfDocument(preparedDoc, options);
  const pdfInstance = pdf(pdfDocument);
  return await pdfInstance.toBlob();
};
