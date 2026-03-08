/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
// image
import ImgFileIcon from "@/app/assets/attachment/img-icon.png?url";
// type
import type { ImageIconPros } from "../types";

export function ImgIcon({ width, height }: ImageIconPros) {
  return <img src={ImgFileIcon} width={width} height={height} alt="ImgFileIcon" />;
}
