import React from "react";
import Image from "next/image";

import type { Props } from "./types";
import FigmaFileIcon from "public/attachment/figma-icon.png";

export const FigmaIcon: React.FC<Props> = ({ width , height }) => (
  <Image src={FigmaFileIcon} height={height} width={width} alt="FigmaFileIcon" />
);
