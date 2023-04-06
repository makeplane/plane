import React from "react";
import Image from "next/image";

import type { Props } from "./types";
import JpgFileIcon from "public/attachment/jpg-icon.png";

export const JpgIcon: React.FC<Props> = ({ width, height  }) => (
  <Image src={JpgFileIcon} height={height} width={width} alt="JpgFileIcon" />
);
