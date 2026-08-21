/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export const WORK_ITEM_REALTIME_CHANNEL_PREFIX = "plane:work-items:";

export const getWorkItemRealtimeChannel = (projectId: string) => `${WORK_ITEM_REALTIME_CHANNEL_PREFIX}${projectId}`;

export const shouldForwardWorkItemEventToUser = ({
  actorId,
  userId,
  createdBy,
  isGuest,
  guestCanViewAllWorkItems,
}: {
  actorId?: string;
  userId?: string;
  createdBy?: string;
  isGuest: boolean;
  guestCanViewAllWorkItems: boolean;
}) => {
  if (!userId) return false;
  if (actorId && actorId === userId) return false;
  if (isGuest && !guestCanViewAllWorkItems && createdBy && createdBy !== userId) return false;
  return true;
};
