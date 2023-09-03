import React from "react";
import Image from "next/image";

import type { Props } from "./types";
import HtmlFileIcon from "public/attachment/html-icon.png";

export const HtmlIcon: React.FC<Props> = ({ width, height }) => (
  <Image src={HtmlFileIcon} height={height} width={width} alt="HtmlFileIcon" />
);
