import React from "react";
import Image from "next/image";

import type { Props } from "./types";
import VideoFileIcon from "public/attachment/video-icon.png";

export const VideoIcon: React.FC<Props> = ({ width, height }) => (
  <Image src={VideoFileIcon} height={height} width={width} alt="VideoFileIcon" />
);
