/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export const getProgress = (completed: number | undefined, total: number | undefined) =>
  total && total > 0 ? Math.round(((completed ?? 0) / total) * 100) : 0;
