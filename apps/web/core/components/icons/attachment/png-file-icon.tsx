import React from "react";
// image
import PngFileIcon from "@/app/assets/attachment/png-icon.png?url";
// type
import type { ImageIconPros } from "../types";

export const PngIcon: React.FC<ImageIconPros> = ({ width, height }) => (
  <img src={PngFileIcon} width={width} height={height} alt="PngFileIcon" />
);
