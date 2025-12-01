import React from "react";
// image
import ZipFileIcon from "@/app/assets/attachment/zip-icon.png?url";
// type
import type { ImageIconPros } from "../types";

export function ZipIcon({ width, height }: ImageIconPros) {
  return <img src={ZipFileIcon} width={width} height={height} alt="ZipFileIcon" />;
}
