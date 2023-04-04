import React from "react";
import Image from "next/image";

import type { Props } from "./types";
import XLSXIcon from "public/attachment/xlsx-icon.png";

export const ExcelIcon: React.FC<Props> = ({ width, height  }) => (
  <Image src={XLSXIcon} height={height} width={width} alt="XLSXIcon" />
);
