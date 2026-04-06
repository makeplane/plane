/**
 * SPDX-FileCopyrightText: 2023-present Plane Software, Inc.
 * SPDX-License-Identifier: LicenseRef-Plane-Commercial
 *
 * Licensed under the Plane Commercial License (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * https://plane.so/legals/eula
 *
 * DO NOT remove or modify this notice.
 * NOTICE: Proprietary and confidential. Unauthorized use or distribution is prohibited.
 */

import type { ReactNode } from "react";
import type { PropertyValue } from "../types";

/**
 * Map old/new string values and an optional icon into PropertyValue objects
 * suitable for the TransitionRow component.
 */
export function mapActivityToPropertyValues(
  oldVal: string | undefined,
  newVal: string | undefined,
  icon?: ReactNode,
  oldBadge?: ReactNode,
  newBadge?: ReactNode,
  oldIcon?: ReactNode,
  newIcon?: ReactNode
): { oldValue: PropertyValue; newValue: PropertyValue } {
  const oldLabel = oldVal || "";
  const newLabel = newVal || "";
  return {
    oldValue: { icon: oldIcon ?? icon, label: oldLabel || "None", isEmpty: !oldLabel, badge: oldBadge },
    newValue: { icon: newIcon ?? icon, label: newLabel || "None", isEmpty: !newLabel, badge: newBadge },
  };
}
