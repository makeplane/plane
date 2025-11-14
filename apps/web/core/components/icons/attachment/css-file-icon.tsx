import React from "react";
// image
import CssFileIcon from "@/app/assets/attachment/css-icon.png?url";
// type
import type { ImageIconPros } from "../types";

export const CssIcon: React.FC<ImageIconPros> = ({ width, height }) => (
  <img src={CssFileIcon} width={width} height={height} alt="CssFileIcon" />
);
