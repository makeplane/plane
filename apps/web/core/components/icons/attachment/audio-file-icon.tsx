import React from "react";
// image
import AudioFileIcon from "@/app/assets/attachment/audio-icon.png?url";

export type AudioIconProps = {
  width?: number;
  height?: number;
};

export function AudioIcon({ width, height }: AudioIconProps) {
  return <img src={AudioFileIcon} width={width} height={height} alt="AudioFileIcon" />;
}
