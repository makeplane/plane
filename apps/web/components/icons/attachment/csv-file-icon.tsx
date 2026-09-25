/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
// image
import CSVFileIcon from "@/app/assets/attachment/csv-icon.png?url";
// type
import type { ImageIconPros } from "../types";

export function CsvIcon({ width, height }: ImageIconPros) {
  return <img src={CSVFileIcon} width={width} height={height} alt="CSVFileIcon" />;
}
