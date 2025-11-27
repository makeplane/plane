import React from "react";
// image
import DefaultFileIcon from "@/app/assets/attachment/default-icon.png?url";
// type
import type { ImageIconPros } from "../types";

export function DefaultIcon({ width, height }: ImageIconPros) {
  return <img src={DefaultFileIcon} width={width} height={height} alt="DefaultFileIcon" />;
}
