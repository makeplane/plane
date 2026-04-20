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

import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Link } from "react-router";
// plane imports
import { Popover } from "@plane/propel/popover";
import { Avatar } from "@plane/propel/avatar";
import { cn, getFileURL } from "@plane/utils";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { useRoleManagement } from "@/hooks/store/use-role-management";
import { useUser } from "@/hooks/store/user";

type Props = {
  id: string;
};

export const EditorUserMention = observer(function EditorUserMention(props: Props) {
  const { id } = props;
  // router
  const { projectId } = useParams();
  // params
  const { workspaceSlug } = useParams();
  // store hooks
  const { data: currentUser } = useUser();
  const {
    getUserDetails,
    project: { getProjectMemberDetails },
  } = useMember();
  const { getProjectRoleDetailsByRoleSlug } = useRoleManagement();
  // derived values
  const userDetails = getUserDetails(id);
  const memberRoleSlug = projectId ? getProjectMemberDetails(id, projectId)?.role_slug : null;
  const roleDetails =
    memberRoleSlug && workspaceSlug ? getProjectRoleDetailsByRoleSlug(workspaceSlug, memberRoleSlug) : undefined;
  const profileLink = `/${workspaceSlug}/profile/${id}`;

  if (!userDetails) {
    return (
      <div className="not-prose inline px-1 py-0.5 rounded-sm bg-layer-1 text-tertiary no-underline">
        @suspended user
      </div>
    );
  }

  return (
    <div
      className={cn(
        "not-prose inline px-1 py-0.5 rounded-sm bg-accent-subtle-active text-accent-primary no-underline",
        {
          "bg-label-yellow-bg text-label-yellow-text": id === currentUser?.id,
        }
      )}
    >
      <Popover>
        <Popover.Trigger delay={100} openOnHover>
          <Link to={profileLink}>@{userDetails?.display_name}</Link>
        </Popover.Trigger>
        <Popover.Content side="bottom" align="start">
          <div className="w-60 bg-surface-1 shadow-raised-200 rounded-lg p-3 border-[0.5px] border-strong">
            <div className="flex items-center gap-3">
              <div className="shrink-0 size-10 grid place-items-center">
                <Avatar
                  src={getFileURL(userDetails?.avatar_url ?? "")}
                  name={userDetails?.display_name}
                  size={40}
                  className="text-18"
                  showTooltip={false}
                />
              </div>
              <div>
                <Link to={profileLink} className="not-prose font-medium text-primary text-13 hover:underline">
                  {userDetails?.first_name} {userDetails?.last_name}
                </Link>
                {roleDetails && <p className="text-secondary text-11">{roleDetails.name}</p>}
              </div>
            </div>
          </div>
        </Popover.Content>
      </Popover>
    </div>
  );
});
