import React from "react";
import Image from "next/image";
// image
import AudioFileIcon from "public/attachment/audio-icon.png";

export type AudioIconProps = {
  width?: number;
  height?: number;
};

export const AudioIcon: React.FC<AudioIconProps> = ({ width, height }) => (
  <Image src={AudioFileIcon} height={height} width={width} alt="AudioFileIcon" />
);
