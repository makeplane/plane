import React from "react";
// image
import DefaultFileIcon from "@/app/assets/attachment/default-icon.png?url";
// type
import type { ImageIconPros } from "../types";

export const DefaultIcon: React.FC<ImageIconPros> = ({ width, height }) => (
  <img src={DefaultFileIcon} width={width} height={height} alt="DefaultFileIcon" />
);
