import React from "react";
import Image from "next/image";
// image
import VideoFileIcon from "public/attachment/video-icon.png";
// type
import type { ImageIconPros } from "./types";

export const VideoIcon: React.FC<ImageIconPros> = ({ width, height }) => (
  <Image src={VideoFileIcon} height={height} width={width} alt="VideoFileIcon" />
);
