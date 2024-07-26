import React from "react";
import Image from "next/image";
// image
import ImgFileIcon from "@/public/attachment/img-icon.png";
// type
import type { ImageIconPros } from "../types";

export const ImgIcon: React.FC<ImageIconPros> = ({ width, height }) => (
  <Image src={ImgFileIcon} height={height} width={width} alt="ImgFileIcon" />
);
