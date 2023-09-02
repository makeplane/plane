import React from "react";
import Image from "next/image";

import type { Props } from "./types";
import SheetFileIcon from "public/attachment/excel-icon.png";

export const SheetIcon: React.FC<Props> = ({ width, height  }) => (
  <Image src={SheetFileIcon} height={height} width={width} alt="SheetFileIcon" />
);
