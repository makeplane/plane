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

import type { IIssueType } from "../work-item-types-legacy/work-item-types";
import type { TIssueIdentifierProps, TIssueTypeIdentifier as TIssueTypeIdentifierBase } from "./issue-identifier";
import type { EWorkItemTypeEntity } from "../work-item-types";

export type TIssueTypeIdentifierExtended = TIssueTypeIdentifierBase & {
  getWorkItemTypeById?: (workItemTypeId: string) => IIssueType | undefined;
};

export type TIssueIdentifierPropsExtended = TIssueIdentifierProps & {
  getWorkItemTypeById?: (workItemTypeId: string) => IIssueType | undefined;
  isWorkItemTypeEntityEnabled?: (workspaceSlug: string, projectId: string, entityType: EWorkItemTypeEntity) => boolean;
};
