import React from "react";
// image
import ImgFileIcon from "@/app/assets/attachment/img-icon.png?url";
// type
import type { ImageIconPros } from "../types";

export function ImgIcon({ width, height }: ImageIconPros) {
  return <img src={ImgFileIcon} width={width} height={height} alt="ImgFileIcon" />;
}
