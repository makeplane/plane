/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

// plane imports
import type { ETabIndices } from "@plane/constants";
import { TAB_INDEX_MAP } from "@plane/constants";

export const getTabIndex = (type?: ETabIndices, isMobile: boolean = false) => {
  const getIndex = (key: string) =>
    isMobile ? undefined : type && TAB_INDEX_MAP[type].findIndex((tabIndex) => tabIndex === key) + 1;

  const baseTabIndex = isMobile ? -1 : 1;

  return { getIndex, baseTabIndex };
};
