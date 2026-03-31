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

export enum ETriggerNodeHandlerName {
  RECORD_CREATED = "record_created",
  RECORD_UPDATED = "record_updated",
  STATE_CHANGED = "state_changed",
  ASSIGNEE_CHANGED = "assignee_changed",
  COMMENT_CREATED = "comment_created",
  /** Time-based trigger (fixed schedule or cron); API `handler_name` is `scheduled`. */
  SCHEDULED = "scheduled",
}
export type TTriggerNodeHandlerName = ETriggerNodeHandlerName;
