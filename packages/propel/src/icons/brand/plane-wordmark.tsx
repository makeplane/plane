/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import * as React from "react";
import type { ISvgIcons } from "../type";
import { TFCWordmark } from "./tfc-wordmark";

export function PlaneWordmark(props: ISvgIcons) {
  return <TFCWordmark {...props} />;
}
