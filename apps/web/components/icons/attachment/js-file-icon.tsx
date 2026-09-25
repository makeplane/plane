/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import React from "react";
// image
import JsFileIcon from "@/app/assets/attachment/js-icon.png?url";
// type
import type { ImageIconPros } from "../types";

export function JavaScriptIcon({ width, height }: ImageIconPros) {
  return <img src={JsFileIcon} width={width} height={height} alt="JsFileIcon" />;
}
