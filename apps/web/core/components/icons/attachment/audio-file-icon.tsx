import React from "react";
// image
import AudioFileIcon from "@/app/assets/attachment/audio-icon.png?url";

export type AudioIconProps = {
  width?: number;
  height?: number;
};

export const AudioIcon: React.FC<AudioIconProps> = ({ width, height }) => (
  <img src={AudioFileIcon} width={width} height={height} className="h-full w-full object-contain" alt="AudioFileIcon" />
);
