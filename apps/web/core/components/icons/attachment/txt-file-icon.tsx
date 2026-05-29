import React from "react";
// image
import TxtFileIcon from "@/app/assets/attachment/txt-icon.png?url";
// type
import type { ImageIconPros } from "../types";

export function TxtIcon({ width, height }: ImageIconPros) {
  return <img src={TxtFileIcon} width={width} height={height} alt="TxtFileIcon" />;
}
