import React from "react";
import Image from "next/image";
// image
import SvgFileIcon from "public/attachment/svg-icon.png";
// type
import type { ImageIconPros } from "./types";

export const SvgIcon: React.FC<ImageIconPros> = ({ width, height }) => (
  <Image src={SvgFileIcon} height={height} width={width} alt="SvgFileIcon" />
);
