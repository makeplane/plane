/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
// image
import CssFileIcon from "@/app/assets/attachment/css-icon.png?url";
// type
import type { ImageIconPros } from "../types";

export function CssIcon({ width, height }: ImageIconPros) {
  return <img src={CssFileIcon} width={width} height={height} alt="CssFileIcon" />;
}
