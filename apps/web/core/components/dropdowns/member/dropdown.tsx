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
import type { LucideIcon } from "lucide-react";
// hooks
import { useMember } from "@/hooks/store/use-member";
// local imports
import { MemberDropdownBase } from "./base";
import type { MemberDropdownProps } from "./types";

type TMemberDropdownProps = {
  icon?: LucideIcon;
  iconSize?: "sm" | "md" | "base" | "lg" | number;
  memberIds?: string[];
  onClose?: () => void;
  optionsClassName?: string;
  projectId?: string;
  renderByDefault?: boolean;
} & MemberDropdownProps;

export const MemberDropdown = observer(function MemberDropdown(props: TMemberDropdownProps) {
  const { memberIds: propsMemberIds, projectId } = props;
  // router params
  const { workspaceSlug } = useParams();
  // store hooks
  const {
    getUserDetails,
    project: { getProjectMemberIds, fetchProjectMembers },
    workspace: { workspaceMemberIds },
  } = useMember();

  const memberIds = propsMemberIds
    ? propsMemberIds
    : projectId
      ? getProjectMemberIds(projectId, false)
      : workspaceMemberIds;

  const onDropdownOpen = () => {
    if (!memberIds && projectId && workspaceSlug) fetchProjectMembers(workspaceSlug.toString(), projectId);
  };

  return (
    <MemberDropdownBase
      {...props}
      getUserDetails={getUserDetails}
      memberIds={memberIds ?? []}
      onDropdownOpen={onDropdownOpen}
    />
  );
});
