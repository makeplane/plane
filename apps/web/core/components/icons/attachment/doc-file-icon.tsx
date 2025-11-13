import React from "react";
// image
import DocFileIcon from "@/app/assets/attachment/doc-icon.png?url";
// type
import type { ImageIconPros } from "../types";

export const DocIcon: React.FC<ImageIconPros> = ({ width, height }) => (
  <img src={DocFileIcon} width={width} height={height} className="h-full w-full object-contain" alt="DocFileIcon" />
);
