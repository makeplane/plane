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

/**
 * Default permissions object returned when a work item has no project_id
 * or when permissions cannot be determined.
 */
export const DEFAULT_WORK_ITEM_PERMISSIONS = {
  canEditProperty: () => false,
  canDragAndDrop: false,
};

/**
 * Default quick action permissions object used when a work item has no project_id
 * or when permissions cannot be determined for QuickActions components.
 * Includes all possible quick action permission fields.
 */
export const DEFAULT_QUICK_ACTION_PERMISSIONS = {
  canEdit: false,
  canDelete: false,
  canArchive: false,
  canRestore: false,
  canDuplicate: false,
  canRemoveFromView: false,
};
