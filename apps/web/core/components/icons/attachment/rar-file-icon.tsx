import React from "react";
import Image from "next/image";
// image
import RarFileIcon from "@/public/attachment/rar-icon.png";
// type
import type { ImageIconPros } from "../types";

export const RarIcon: React.FC<ImageIconPros> = ({ width, height }) => (
  <Image src={RarFileIcon} height={height} width={width} alt="RarFileIcon" />
);
