import React from "react";
// image
import FigmaFileIcon from "@/app/assets/attachment/figma-icon.png?url";
// type
import type { ImageIconPros } from "../types";

export function FigmaIcon({ width, height }: ImageIconPros) {
  return <img src={FigmaFileIcon} width={width} height={height} alt="FigmaFileIcon" />;
}
