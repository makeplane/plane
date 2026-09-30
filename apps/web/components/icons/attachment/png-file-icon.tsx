/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
// image
import PngFileIcon from "@/app/assets/attachment/png-icon.png?url";
// type
import type { ImageIconPros } from "../types";

export function PngIcon({ width, height }: ImageIconPros) {
  return <img src={PngFileIcon} width={width} height={height} alt="PngFileIcon" />;
}
