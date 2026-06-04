/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

/**
 * Decides whether changing a work item's due date must capture a reason.
 *
 * A reason is required only when an editor moves an already-set due date to a
 * different, non-empty date. First-time set, clearing, and reverting to the
 * original value carry no reason — mirroring the detail sidebar, spreadsheet,
 * and inline list/kanban due-date flows.
 */
export const dueDateChangeRequiresReason = (
  originalDate: string | null | undefined,
  newDate: string | null | undefined,
  isEditMode: boolean
): boolean => isEditMode && !!originalDate && !!newDate && newDate !== originalDate;
