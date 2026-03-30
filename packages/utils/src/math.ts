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

export const getProgress = (completed: number | undefined, total: number | undefined, cancelled?: number) => {
  const adjustedTotal = Math.max((total ?? 0) - (cancelled ?? 0), 0);
  return adjustedTotal > 0 ? Math.round(((completed ?? 0) / adjustedTotal) * 100) : 0;
};

export const getClosedIssuesLabel = (
  completed: number | undefined,
  total: number | undefined,
  cancelled?: number
): string => {
  const adjustedTotal = Math.max((total ?? 0) - (cancelled ?? 0), 0);
  return `${completed ?? 0}/${adjustedTotal}`;
};
