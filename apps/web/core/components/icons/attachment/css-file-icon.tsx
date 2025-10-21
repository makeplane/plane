import React from "react";
import Image from "next/image";
// image
import CssFileIcon from "@/app/assets/attachment/css-icon.png";
// type
import type { ImageIconPros } from "../types";

export const CssIcon: React.FC<ImageIconPros> = ({ width, height }) => (
  <Image src={CssFileIcon} height={height} width={width} alt="CssFileIcon" />
);
