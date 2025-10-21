import React from "react";
import Image from "next/image";
// image
import SheetFileIcon from "@/app/assets/attachment/excel-icon.png";
// type
import type { ImageIconPros } from "../types";

export const SheetIcon: React.FC<ImageIconPros> = ({ width, height }) => (
  <Image src={SheetFileIcon} height={height} width={width} alt="SheetFileIcon" />
);
