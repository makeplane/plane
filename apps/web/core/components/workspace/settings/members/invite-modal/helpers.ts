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

import type { TMemberInviteCheck } from "@plane/types";
import { isGuestRole } from "@plane/utils";

/**
 * Calculate counts of users to be invited, separated by role
 * @param memberDetails - array of email/role_slug pairs
 */
export const calculateInviteCounts = (memberDetails: Array<{ email: string; role_slug: string }> | undefined) => {
  if (!memberDetails) {
    return {
      totalUsers: 0,
      adminAndMemberCount: 0,
      guestCount: 0,
    };
  }

  const filledMembers = memberDetails.filter((member) => !!member.email);

  return {
    totalUsers: filledMembers.length,
    adminAndMemberCount: filledMembers.filter((member) => !isGuestRole(member.role_slug)).length,
    guestCount: filledMembers.filter((member) => isGuestRole(member.role_slug)).length,
  };
};

/**
 * Check if invitation limit has been reached based on plan type and available seats
 *
 * Enterprise plan: Checks total users against allowed_total_users
 * Pro/Business plans: Checks admin/member and guest seats separately
 */
export const checkInviteLimitReached = (
  counts: { totalUsers: number; adminAndMemberCount: number; guestCount: number },
  inviteCheckData: TMemberInviteCheck | null | undefined,
  isOnEnterprisePlan: boolean
): boolean => {
  if (!inviteCheckData) return false;

  // Backend indicates invites are not allowed
  if (!inviteCheckData.invite_allowed) return true;

  if (isOnEnterprisePlan) {
    // Enterprise plan: Check total users only
    const allowedTotalUsers = inviteCheckData.allowed_total_users ?? 0;
    return counts.totalUsers > allowedTotalUsers;
  } else {
    // Pro/Business plans: Check admin/member and guest seats separately
    const adminMemberExceeded = counts.adminAndMemberCount > inviteCheckData.allowed_admin_members;
    const guestExceeded = counts.guestCount > inviteCheckData.allowed_guests;
    return adminMemberExceeded || guestExceeded;
  }
};
