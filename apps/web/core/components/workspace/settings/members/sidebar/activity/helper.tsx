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

import type { FC, ReactNode } from "react";
import { LogOut, MailCheck, Mails, UserCog, MailX, Users, UserX, UserPlus, UserMinus } from "lucide-react";
import type { TWorkspaceBaseActivity } from "@plane/types";

const WorkspaceMemberActivityTypes = {
  JOINED: "JOINED",
  REMOVED: "REMOVED",
  LEFT: "LEFT",
  ROLE_CHANGED: "ROLE_CHANGED",
  INVITED: "INVITED",
  INVITATION_DELETED: "INVITATION_DELETED",
  SEATS_ADDED: "SEATS_ADDED",
  SEATS_REMOVED: "SEATS_REMOVED",
} as const;

export type TWorkspaceMemberActivityType = keyof typeof WorkspaceMemberActivityTypes;

export type TWorkspaceMemberActivity = TWorkspaceBaseActivity & {
  type: TWorkspaceMemberActivityType;
  workspace_member: string | null;
};

const getUserName = (email: string = "") => (email && email.includes("@") ? email.split("@")[0] : email);

export const getWorkspaceMemberActivityDetails = (
  activity: TWorkspaceMemberActivity,
  memberName: string
): { icon: FC<{ className?: string }>; message: ReactNode } => {
  const activityType = activity.type;
  const subject = activity.new_value || activity.old_value;

  switch (activityType) {
    case WorkspaceMemberActivityTypes.INVITED: {
      const emailUsername = getUserName(subject);
      return {
        icon: Mails,
        message: (
          <>
            invited {emailUsername ? <span className="font-medium text-primary">{emailUsername}</span> : "a new member"}
            {" to the workspace."}
          </>
        ),
      };
    }
    case WorkspaceMemberActivityTypes.JOINED:
      return {
        icon: MailCheck,
        message: <>has accepted the invitation.</>,
      };
    case WorkspaceMemberActivityTypes.INVITATION_DELETED: {
      const emailUsername = getUserName(subject);
      return {
        icon: MailX,
        message: emailUsername ? (
          <>
            deleted the invitation for <span className="font-medium text-primary">{emailUsername}</span>.
          </>
        ) : (
          <>deleted the invitation.</>
        ),
      };
    }
    case WorkspaceMemberActivityTypes.REMOVED:
      return {
        icon: UserX,
        message: subject ? (
          <>
            removed <span className="font-medium text-primary">{subject}</span> from the workspace.
          </>
        ) : (
          <>removed a member from the workspace.</>
        ),
      };
    case WorkspaceMemberActivityTypes.LEFT:
      return {
        icon: LogOut,
        message: <>left the workspace.</>,
      };
    case WorkspaceMemberActivityTypes.ROLE_CHANGED: {
      const oldRole = activity.old_value || "Member";
      const newRole = activity.new_value || "Member";

      return {
        icon: UserCog,
        message: (
          <>
            changed {memberName ? <span className="font-medium text-primary">{memberName}</span> : "a member"}
            {"'s role from "}
            <span className="font-medium text-primary">{oldRole}</span>
            {" to "}
            <span className="font-medium text-primary">{newRole}</span>.
          </>
        ),
      };
    }
    case WorkspaceMemberActivityTypes.SEATS_ADDED: {
      // Calculate the difference between new_value and old_value
      const seatsAdded =
        activity.new_value && activity.old_value
          ? parseInt(activity.new_value, 10) - parseInt(activity.old_value, 10)
          : activity.new_value
            ? parseInt(activity.new_value, 10)
            : 0;
      return {
        icon: UserPlus,
        message: (
          <>
            added <span className="font-medium text-primary">{seatsAdded}</span> {seatsAdded === 1 ? "seat" : "seats"}{" "}
            to the workspace.
          </>
        ),
      };
    }
    case WorkspaceMemberActivityTypes.SEATS_REMOVED: {
      // old_value = purchased_seats, new_value = required_seats
      const seatsRemoved =
        activity.old_value && activity.new_value
          ? parseInt(activity.old_value, 10) - parseInt(activity.new_value, 10)
          : 0;
      return {
        icon: UserMinus,
        message: (
          <>
            removed <span className="font-medium text-primary">{seatsRemoved}</span>{" "}
            {seatsRemoved === 1 ? "seat" : "seats"} from the workspace.
          </>
        ),
      };
    }
    default:
      return {
        icon: Users,
        message: <>made a change</>,
      };
  }
};
