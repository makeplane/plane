import React from "react";
// image
import HtmlFileIcon from "@/app/assets/attachment/html-icon.png?url";
// type
import type { ImageIconPros } from "../types";

export function HtmlIcon({ width, height }: ImageIconPros) {
  return <img src={HtmlFileIcon} width={width} height={height} alt="HtmlFileIcon" />;
}
