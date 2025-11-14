import React from "react";
// image
import PDFFileIcon from "@/app/assets/attachment/pdf-icon.png?url";
// type
import type { ImageIconPros } from "../types";

export const PdfIcon: React.FC<ImageIconPros> = ({ width, height }) => (
  <img src={PDFFileIcon} width={width} height={height} className="h-full w-full object-contain" alt="PDFFileIcon" />
);
