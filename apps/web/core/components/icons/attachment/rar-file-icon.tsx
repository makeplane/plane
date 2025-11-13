import React from "react";
// image
import RarFileIcon from "@/app/assets/attachment/rar-icon.png?url";
// type
import type { ImageIconPros } from "../types";

export const RarIcon: React.FC<ImageIconPros> = ({ width, height }) => (
  <img src={RarFileIcon} width={width} height={height} className="h-full w-full object-contain" alt="RarFileIcon" />
);
