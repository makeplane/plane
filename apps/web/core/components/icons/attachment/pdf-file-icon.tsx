/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
// image
import PDFFileIcon from "@/app/assets/attachment/pdf-icon.png?url";
// type
import type { ImageIconPros } from "../types";

export function PdfIcon({ width, height }: ImageIconPros) {
  return <img src={PDFFileIcon} width={width} height={height} alt="PDFFileIcon" />;
}
