import React from "react";
// image
import SheetFileIcon from "@/app/assets/attachment/excel-icon.png?url";
// type
import type { ImageIconPros } from "../types";

export const SheetIcon: React.FC<ImageIconPros> = ({ width, height }) => (
  <img src={SheetFileIcon} width={width} height={height} alt="SheetFileIcon" />
);
