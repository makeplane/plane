import React from "react";
// image
import SvgFileIcon from "@/app/assets/attachment/svg-icon.png?url";
// type
import type { ImageIconPros } from "../types";

export function SvgIcon({ width, height }: ImageIconPros) {
  return <img src={SvgFileIcon} width={width} height={height} alt="SvgFileIcon" />;
}
