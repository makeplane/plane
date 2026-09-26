/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { createContext, useContext } from "react";

/** Current-item state survives app wrappers between the trail and its rendered control. */
export const BreadcrumbItemContext = createContext(false);

export function useBreadcrumbCurrent(isLast?: boolean) {
  const current = useContext(BreadcrumbItemContext);
  return isLast ?? current;
}
