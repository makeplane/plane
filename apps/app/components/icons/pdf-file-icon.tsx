import React from "react";
import Image from "next/image";

import type { Props } from "./types";
import PDFFileIcon from "public/attachment/pdf-icon.png";

export const PdfIcon: React.FC<Props> = ({ width , height  }) => (
  <Image src={PDFFileIcon} height={height} width={width} alt="PDFFileIcon" />
);
