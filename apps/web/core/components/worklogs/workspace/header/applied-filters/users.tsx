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
// plane ui
import { Avatar } from "@plane/ui";
// helpers
import { getFileURL } from "@plane/utils";
// hooks
import { useMember } from "@/hooks/store/use-member";
// plane web components
import { AppliedFilterGroup, AppliedFilterGroupItem } from "@/components/worklogs";
// plane web hooks
import { useWorkspaceWorklogs } from "@/plane-web/hooks/store";

type TWorkspaceWorklogAppliedFilterUsers = {
  workspaceSlug: string;
  workspaceId: string;
  projectId?: string;
};

export const WorkspaceWorklogAppliedFilterUsers = observer(function WorkspaceWorklogAppliedFilterUsers(
  props: TWorkspaceWorklogAppliedFilterUsers
) {
  const { workspaceSlug, projectId } = props;
  // hooks
  const {
    workspace: { getWorkspaceMemberDetails },
    project: { getProjectMemberDetails },
  } = useMember();
  const { filters, updateFilters } = useWorkspaceWorklogs();

  // derived values
  const selectedIds = filters.logged_by;

  if (selectedIds.length <= 0) return <></>;

  const handleSelectedOptions = (userSelectId: string | "clear" | undefined) => {
    if (!userSelectId) return;
    updateFilters(
      workspaceSlug,
      "logged_by",
      userSelectId === "clear" ? [] : selectedIds.filter((id) => id !== userSelectId)
    );
  };

  const appliedFiltersData = selectedIds?.map((userId) => {
    const userDetails = projectId ? getProjectMemberDetails(userId, projectId) : getWorkspaceMemberDetails(userId);
    return {
      value: userDetails?.member?.id,
      onClick: selectedIds.length === 1 ? undefined : () => handleSelectedOptions(userDetails?.member?.id),
      content: (
        <div className="flex items-center gap-1">
          <Avatar
            name={userDetails?.member?.display_name}
            src={getFileURL(userDetails?.member?.avatar_url ?? "")}
            shape="circle"
            size="sm"
            showTooltip={false}
          />
          <div className="flex-grow truncate text-11">{userDetails?.member?.display_name}</div>
        </div>
      ),
    };
  });

  return (
    <AppliedFilterGroup groupTitle="Users" onClear={() => handleSelectedOptions("clear")}>
      {appliedFiltersData.map((item) => (
        <AppliedFilterGroupItem key={item.value} onClear={item.onClick}>
          {item.content}
        </AppliedFilterGroupItem>
      ))}
    </AppliedFilterGroup>
  );
});
