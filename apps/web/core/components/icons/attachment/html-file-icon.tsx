/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
// image
import HtmlFileIcon from "@/app/assets/attachment/html-icon.png?url";
// type
import type { ImageIconPros } from "../types";

export function HtmlIcon({ width, height }: ImageIconPros) {
  return <img src={HtmlFileIcon} width={width} height={height} alt="HtmlFileIcon" />;
}
