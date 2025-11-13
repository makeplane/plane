import React from "react";
// image
import HtmlFileIcon from "@/app/assets/attachment/html-icon.png?url";
// type
import type { ImageIconPros } from "../types";

export const HtmlIcon: React.FC<ImageIconPros> = ({ width, height }) => (
  <img src={HtmlFileIcon} width={width} height={height} className="h-full w-full object-contain" alt="HtmlFileIcon" />
);
