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

import type { TWorkItemType } from "@plane/types";

// Actions the modal needs from the parent
export type WorkItemTypeCreateUpdateActions = {
  create: (data: Partial<TWorkItemType>) => Promise<void>;
  update: (typeId: string, data: Partial<TWorkItemType>) => Promise<void>;
};

// Permissions the parent resolves before opening the modal
export type WorkItemTypeCreateUpdatePermissions = {
  canChangeIcon: boolean;
  canChangeName: boolean;
};
