import React from "react";
import Image from "next/image";

import type { Props } from "./types";
import DocFileIcon from "public/attachment/doc-icon.png";

export const DocIcon: React.FC<Props> = ({ width, height }) => (
  <Image src={DocFileIcon} height={height} width={width} alt="DocFileIcon" />
);
