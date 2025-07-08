import React from "react";
import Image from "next/image";
// image
import ZipFileIcon from "@/public/attachment/zip-icon.png";
// type
import type { ImageIconPros } from "../types";

export const ZipIcon: React.FC<ImageIconPros> = ({ width, height }) => (
  <Image src={ZipFileIcon} height={height} width={width} alt="ZipFileIcon" />
);
