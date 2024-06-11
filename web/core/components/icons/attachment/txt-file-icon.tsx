import React from "react";
import Image from "next/image";
// image
import TxtFileIcon from "@/public/attachment/txt-icon.png";
// type
import type { ImageIconPros } from "../types";

export const TxtIcon: React.FC<ImageIconPros> = ({ width, height }) => (
  <Image src={TxtFileIcon} height={height} width={width} alt="TxtFileIcon" />
);
