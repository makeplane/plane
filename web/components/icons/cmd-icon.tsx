import React from "react";
import Image from "next/image";
// image
import CMDIcon from "public/mac-command.svg";
// type
import type { ImageIconPros } from "./types";

export const MacCommandIcon: React.FC<ImageIconPros> = ({ width = 14, height = 14 }) => (
  <Image src={CMDIcon} height={height} width={width} alt="CMDIcon" />
);

export default MacCommandIcon;
