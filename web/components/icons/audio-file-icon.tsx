import React from "react";
import Image from "next/image";

import type { Props } from "./types";
import AudioFileIcon from "public/attachment/audio-icon.png";

export const AudioIcon: React.FC<Props> = ({ width, height }) => (
  <Image src={AudioFileIcon} height={height} width={width} alt="AudioFileIcon" />
);
