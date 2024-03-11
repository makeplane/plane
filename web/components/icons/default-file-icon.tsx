import React from "react";
import Image from "next/image";
// image
import DefaultFileIcon from "public/attachment/default-icon.png";
// type
import type { ImageIconPros } from "./types";

export const DefaultIcon: React.FC<ImageIconPros> = ({ width, height }) => (
  <Image src={DefaultFileIcon} height={height} width={width} alt="DefaultFileIcon" />
);
