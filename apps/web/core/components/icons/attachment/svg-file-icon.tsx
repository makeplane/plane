import React from "react";
// image
import SvgFileIcon from "@/app/assets/attachment/svg-icon.png?url";
// type
import type { ImageIconPros } from "../types";

export const SvgIcon: React.FC<ImageIconPros> = ({ width, height }) => (
  <img src={SvgFileIcon} width={width} height={height} className="h-full w-full object-contain" alt="SvgFileIcon" />
);
