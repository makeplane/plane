import React from "react";
// image
import TxtFileIcon from "@/app/assets/attachment/txt-icon.png?url";
// type
import type { ImageIconPros } from "../types";

export const TxtIcon: React.FC<ImageIconPros> = ({ width, height }) => (
  <img src={TxtFileIcon} width={width} height={height} className="h-full w-full object-contain" alt="TxtFileIcon" />
);
