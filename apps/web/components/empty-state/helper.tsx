/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export const getEmptyStateImagePath = (category: string, type: string, isLightMode: boolean) =>
  `/empty-state/${category}/${type}-${isLightMode ? "light" : "dark"}.webp`;
