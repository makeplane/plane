import React from "react";
// image
import DocFileIcon from "@/app/assets/attachment/doc-icon.png?url";
// type
import type { ImageIconPros } from "../types";

export function DocIcon({ width, height }: ImageIconPros) {
  return <img src={DocFileIcon} width={width} height={height} alt="DocFileIcon" />;
}
