/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

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
