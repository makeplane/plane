import React from "react";
import Image from "next/image";

import type { Props } from "./types";
import ImgFileIcon from "public/attachment/img-icon.png";

export const ImgIcon: React.FC<Props> = ({ width, height }) => (
  <Image src={ImgFileIcon} height={height} width={width} alt="ImgFileIcon" />
);
