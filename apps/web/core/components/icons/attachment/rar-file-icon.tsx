import React from "react";
// image
import RarFileIcon from "@/app/assets/attachment/rar-icon.png?url";
// type
import type { ImageIconPros } from "../types";

export function RarIcon({ width, height }: ImageIconPros) {
  return <img src={RarFileIcon} width={width} height={height} alt="RarFileIcon" />;
}
