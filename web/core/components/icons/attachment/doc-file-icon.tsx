import React from "react";
import Image from "next/image";
// image
import DocFileIcon from "@/public/attachment/doc-icon.png";
// type
import type { ImageIconPros } from "../types";

export const DocIcon: React.FC<ImageIconPros> = ({ width, height }) => (
  <Image src={DocFileIcon} height={height} width={width} alt="DocFileIcon" />
);
