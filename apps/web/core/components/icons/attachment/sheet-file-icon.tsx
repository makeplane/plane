/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
// image
import SheetFileIcon from "@/app/assets/attachment/excel-icon.png?url";
// type
import type { ImageIconPros } from "../types";

export function SheetIcon({ width, height }: ImageIconPros) {
  return <img src={SheetFileIcon} width={width} height={height} alt="SheetFileIcon" />;
}
