/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
// image
import DocFileIcon from "@/app/assets/attachment/doc-icon.png?url";
// type
import type { ImageIconPros } from "../types";

export function DocIcon({ width, height }: ImageIconPros) {
  return <img src={DocFileIcon} width={width} height={height} alt="DocFileIcon" />;
}
