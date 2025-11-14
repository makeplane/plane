import React from "react";
// image
import ImgFileIcon from "@/app/assets/attachment/img-icon.png?url";
// type
import type { ImageIconPros } from "../types";

export const ImgIcon: React.FC<ImageIconPros> = ({ width, height }) => (
  <img src={ImgFileIcon} width={width} height={height} alt="ImgFileIcon" />
);
