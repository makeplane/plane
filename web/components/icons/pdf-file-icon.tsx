import React from "react";
import Image from "next/image";
// image
import PDFFileIcon from "public/attachment/pdf-icon.png";
// type
import type { ImageIconPros } from "./types";

export const PdfIcon: React.FC<ImageIconPros> = ({ width, height }) => (
  <Image src={PDFFileIcon} height={height} width={width} alt="PDFFileIcon" />
);
