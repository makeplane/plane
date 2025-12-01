import React from "react";
// image
import JpgFileIcon from "@/app/assets/attachment/jpg-icon.png?url";
// type
import type { ImageIconPros } from "../types";

export function JpgIcon({ width, height }: ImageIconPros) {
  return <img src={JpgFileIcon} width={width} height={height} alt="JpgFileIcon" />;
}
