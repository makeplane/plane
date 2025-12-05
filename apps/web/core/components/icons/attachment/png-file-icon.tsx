import React from "react";
// image
import PngFileIcon from "@/app/assets/attachment/png-icon.png?url";
// type
import type { ImageIconPros } from "../types";

export function PngIcon({ width, height }: ImageIconPros) {
  return <img src={PngFileIcon} width={width} height={height} alt="PngFileIcon" />;
}
