import React from "react";
import Image from "next/image";

import type { Props } from "./types";
import SvgFileIcon from "public/attachment/svg-icon.png";

export const SvgIcon: React.FC<Props> = ({ width, height  }) => (
  <Image src={SvgFileIcon} height={height} width={width} alt="SvgFileIcon" />
);
