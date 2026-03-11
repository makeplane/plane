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

import type { TIssueGroupByOptions } from "@plane/types";

export const getMemberLabel = (
  memberIds: string[],
  getUserName: (memberId: string) => string | undefined,
  allMembersLabel: string
): string => {
  if (memberIds.length === 0) return allMembersLabel;

  const displayNames = memberIds
    .map((memberId) => getUserName(memberId))
    .filter((displayName): displayName is string => Boolean(displayName));

  if (displayNames.length === 0) return allMembersLabel;
  if (displayNames.length === 1) return displayNames[0];
  if (displayNames.length === 2) return `${displayNames[0]} and ${displayNames[1]}`;

  const lastName = displayNames.pop();
  return `${displayNames.join(", ")} and ${lastName}`;
};
