import React from "react";
import Image from "next/image";

import type { Props } from "./types";
import CssFileIcon from "public/attachment/css-icon.png";

export const CssIcon: React.FC<Props> = ({ width, height }) => (
  <Image src={CssFileIcon} height={height} width={width} alt="CssFileIcon" />
);
