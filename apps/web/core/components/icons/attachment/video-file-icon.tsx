/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
// image
import VideoFileIcon from "@/app/assets/attachment/video-icon.png?url";
// type
import type { ImageIconPros } from "../types";

export function VideoIcon({ width, height }: ImageIconPros) {
  return <img src={VideoFileIcon} width={width} height={height} alt="VideoFileIcon" />;
}
