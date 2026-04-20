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

// store
import { WorkItemCommentPermissionsInstance } from "@/store/work-items/permissions/comment";
import type {
  WorkItemCommentPermissions,
  WorkItemCommentPermissionsArgs,
} from "@/store/work-items/permissions/comment";

export type EpicCommentPermissions = WorkItemCommentPermissions;

type EpicCommentPermissionsArgs = WorkItemCommentPermissionsArgs;

export class EpicCommentPermissionsInstance extends WorkItemCommentPermissionsInstance {
  constructor(args: EpicCommentPermissionsArgs) {
    super(args);
  }
}
