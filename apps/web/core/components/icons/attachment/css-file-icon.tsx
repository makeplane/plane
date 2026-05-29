import React from "react";
// image
import CssFileIcon from "@/app/assets/attachment/css-icon.png?url";
// type
import type { ImageIconPros } from "../types";

export function CssIcon({ width, height }: ImageIconPros) {
  return <img src={CssFileIcon} width={width} height={height} alt="CssFileIcon" />;
}
