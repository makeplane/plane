"use client";

import { Document, Font, Page, PageProps } from "@react-pdf/renderer";
import { Html } from "react-pdf-html";
// constants
import { EDITOR_PDF_DOCUMENT_STYLESHEET } from "@/constants/editor";

Font.register({
  family: "Inter",
  fonts: [
    { src: "/fonts/inter/thin.ttf", fontWeight: "thin" },
    { src: "/fonts/inter/thin.ttf", fontWeight: "thin", fontStyle: "italic" },
    { src: "/fonts/inter/ultralight.ttf", fontWeight: "ultralight" },
    { src: "/fonts/inter/ultralight.ttf", fontWeight: "ultralight", fontStyle: "italic" },
    { src: "/fonts/inter/light.ttf", fontWeight: "light" },
    { src: "/fonts/inter/light.ttf", fontWeight: "light", fontStyle: "italic" },
    { src: "/fonts/inter/regular.ttf", fontWeight: "normal" },
    { src: "/fonts/inter/regular.ttf", fontWeight: "normal", fontStyle: "italic" },
    { src: "/fonts/inter/medium.ttf", fontWeight: "medium" },
    { src: "/fonts/inter/medium.ttf", fontWeight: "medium", fontStyle: "italic" },
    { src: "/fonts/inter/semibold.ttf", fontWeight: "semibold" },
    { src: "/fonts/inter/semibold.ttf", fontWeight: "semibold", fontStyle: "italic" },
    { src: "/fonts/inter/bold.ttf", fontWeight: "bold" },
    { src: "/fonts/inter/bold.ttf", fontWeight: "bold", fontStyle: "italic" },
    { src: "/fonts/inter/extrabold.ttf", fontWeight: "ultrabold" },
    { src: "/fonts/inter/extrabold.ttf", fontWeight: "ultrabold", fontStyle: "italic" },
    { src: "/fonts/inter/heavy.ttf", fontWeight: "heavy" },
    { src: "/fonts/inter/heavy.ttf", fontWeight: "heavy", fontStyle: "italic" },
  ],
});

type Props = {
  content: string;
  pageFormat: PageProps["size"];
};

export const PDFDocument: React.FC<Props> = (props) => {
  const { content, pageFormat } = props;

  return (
    <Document>
      <Page
        size={pageFormat}
        style={{
          backgroundColor: "#ffffff",
          padding: 64,
        }}
      >
        <Html stylesheet={EDITOR_PDF_DOCUMENT_STYLESHEET}>{content}</Html>
      </Page>
    </Document>
  );
};
