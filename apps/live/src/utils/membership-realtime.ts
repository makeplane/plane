/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

export const MEMBERSHIP_REALTIME_CHANNEL_PREFIX = "plane:membership:";

export const getMembershipRealtimeChannel = (userId: string) => `${MEMBERSHIP_REALTIME_CHANNEL_PREFIX}${userId}`;

export const shouldForwardMembershipEventToUser = ({
  eventUserId,
  socketUserId,
}: {
  eventUserId?: string;
  socketUserId?: string;
}) => Boolean(eventUserId && socketUserId && eventUserId === socketUserId);
