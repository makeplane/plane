import React from "react";
import Image from "next/image";
// image
import HtmlFileIcon from "@/app/assets/attachment/html-icon.png";
// type
import type { ImageIconPros } from "../types";

export const HtmlIcon: React.FC<ImageIconPros> = ({ width, height }) => (
  <Image src={HtmlFileIcon} height={height} width={width} alt="HtmlFileIcon" />
);
