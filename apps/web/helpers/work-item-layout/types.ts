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

import type { GroupByColumnTypes } from "@plane/types";

export type GroupDropLocation = {
  columnId: string;
  groupId: string;
  subGroupId?: string;
  id: string | undefined;
  canAddIssueBelow?: boolean;
};

export type IssueUpdates = {
  [groupKey: string]: {
    ADD: string[];
    REMOVE: string[];
  };
};

export type TGetGroupByColumns = {
  groupBy: GroupByColumnTypes | null;
  includeNone: boolean;
  isWorkspaceLevel: boolean;
  isEpic?: boolean;
  projectId?: string;
};
