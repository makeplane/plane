/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import * as React from "react";
import type { ISvgIcons } from "../type";
import { TFCLockup } from "./tfc-lockup";

export function PlaneLockup(props: ISvgIcons) {
  return <TFCLockup {...props} />;
}
