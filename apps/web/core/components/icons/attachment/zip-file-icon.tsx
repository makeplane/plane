/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
// image
import ZipFileIcon from "@/app/assets/attachment/zip-icon.png?url";
// type
import type { ImageIconPros } from "../types";

export function ZipIcon({ width, height }: ImageIconPros) {
  return <img src={ZipFileIcon} width={width} height={height} alt="ZipFileIcon" />;
}
