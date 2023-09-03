import React from "react";
import Image from "next/image";

import type { Props } from "./types";
import DefaultFileIcon from "public/attachment/default-icon.png";

export const DefaultIcon: React.FC<Props> = ({ width, height }) => (
  <Image src={DefaultFileIcon} height={height} width={width} alt="DefaultFileIcon" />
);
