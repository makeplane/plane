import React from "react";
import Image from "next/image";

import type { Props } from "./types";
import TxtFileIcon from "public/attachment/txt-icon.png";

export const TxtIcon: React.FC<Props> = ({ width, height }) => (
  <Image src={TxtFileIcon} height={height} width={width} alt="TxtFileIcon" />
);
