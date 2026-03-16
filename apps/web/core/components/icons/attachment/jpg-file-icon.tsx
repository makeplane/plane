/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
// image
import JpgFileIcon from "@/app/assets/attachment/jpg-icon.png?url";
// type
import type { ImageIconPros } from "../types";

export function JpgIcon({ width, height }: ImageIconPros) {
  return <img src={JpgFileIcon} width={width} height={height} alt="JpgFileIcon" />;
}
