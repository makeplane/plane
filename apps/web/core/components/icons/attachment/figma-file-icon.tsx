import React from "react";
// image
import FigmaFileIcon from "@/app/assets/attachment/figma-icon.png?url";
// type
import type { ImageIconPros } from "../types";

export const FigmaIcon: React.FC<ImageIconPros> = ({ width, height }) => (
  <img src={FigmaFileIcon} width={width} height={height} className="h-full w-full object-contain" alt="FigmaFileIcon" />
);
