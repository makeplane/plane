import React from "react";
import Image from "next/image";

import type { Props } from "./types";
import PngFileIcon from "public/attachment/png-icon.png";

export const PngIcon: React.FC<Props> = ({ width, height }) => (
  <Image src={PngFileIcon} height={height} width={width} alt="PngFileIcon" />
);
