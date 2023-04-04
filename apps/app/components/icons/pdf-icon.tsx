import React from "react";
import Image from "next/image";

import type { Props } from "./types";
import PDFIcon from "public/attachment/pdf-icon.png";

export const PdfIcon: React.FC<Props> = ({ width , height  }) => (
  <Image src={PDFIcon} height={height} width={width} alt="PDFIcon" />
);
