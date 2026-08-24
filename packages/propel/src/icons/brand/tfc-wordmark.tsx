/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import * as React from "react";
import type { ISvgIcons } from "../type";
import { TFCLogo } from "./tfc-logo";

export function TFCWordmark(props: ISvgIcons) {
  return <TFCLogo {...props} />;
}
