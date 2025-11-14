import React from "react";
// image
import ZipFileIcon from "@/app/assets/attachment/zip-icon.png?url";
// type
import type { ImageIconPros } from "../types";

export const ZipIcon: React.FC<ImageIconPros> = ({ width, height }) => (
  <img src={ZipFileIcon} width={width} height={height} alt="ZipFileIcon" />
);
