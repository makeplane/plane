/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
// image
import FigmaFileIcon from "@/app/assets/attachment/figma-icon.png?url";
// type
import type { ImageIconPros } from "../types";

export function FigmaIcon({ width, height }: ImageIconPros) {
  return <img src={FigmaFileIcon} width={width} height={height} alt="FigmaFileIcon" />;
}
