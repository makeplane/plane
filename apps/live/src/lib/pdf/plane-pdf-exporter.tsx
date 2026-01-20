import { createRequire } from "module";
import path from "path";
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
      src: path.join(interFontDir, "files/inter-latin-400-normal.woff2"),
      fontWeight: 400,
    },
    {
      src: path.join(interFontDir, "files/inter-latin-400-italic.woff2"),
      fontWeight: 400,
      fontStyle: "italic",
    },
    {
      src: path.join(interFontDir, "files/inter-latin-600-normal.woff2"),
      fontWeight: 600,
    },
    {
      src: path.join(interFontDir, "files/inter-latin-600-italic.woff2"),
      fontWeight: 600,
      fontStyle: "italic",
    },
    {
      src: path.join(interFontDir, "files/inter-latin-700-normal.woff2"),
      fontWeight: 700,
    },
    {
      src: path.join(interFontDir, "files/inter-latin-700-italic.woff2"),
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
        {title && <Text style={pdfStyles.title}>{title}</Text>}
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
