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
import { Avatar, CustomSearchSelect } from "@plane/ui";
// helpers
import { getFileURL } from "@plane/utils";
// hooks
import { useMember } from "@/hooks/store/use-member";
import { useWorkspaceWorklogs } from "@/plane-web/hooks/store";

type TWorkspaceWorklogFilterUsers = {
  workspaceSlug: string;
  workspaceId: string;
  projectId?: string;
};

export const WorkspaceWorklogFilterUsers = observer(function WorkspaceWorklogFilterUsers(
  props: TWorkspaceWorklogFilterUsers
) {
  const { workspaceSlug, projectId } = props;
  // hooks
  const {
    workspace: { workspaceMemberIds, getWorkspaceMemberDetails },
    project: { getProjectMemberDetails, getProjectMemberIds },
  } = useMember();
  const { filters, updateFilters } = useWorkspaceWorklogs();

  // derived values
  const selectedIds = filters.logged_by;
  const memberIds = projectId ? getProjectMemberIds(projectId, false) : workspaceMemberIds;

  const dropdownLabel = () =>
    selectedIds.length === 1
      ? memberIds
          ?.filter((p) => selectedIds.includes(p))
          .map((p) =>
            projectId
              ? getProjectMemberDetails(p, projectId)?.member?.display_name
              : getWorkspaceMemberDetails(p)?.member?.display_name
          )
          .join(", ")
      : selectedIds.length > 1
        ? `${selectedIds?.length} Users`
        : "Users";

  const dropdownOptions = memberIds?.map((userId) => {
    const userDetails = projectId ? getProjectMemberDetails(userId, projectId) : getWorkspaceMemberDetails(userId);
    return {
      value: userDetails?.member?.id,
      query: `${userDetails?.member?.first_name} ${userDetails?.member?.last_name} ${userDetails?.member?.display_name} `,
      content: (
        <div className="flex items-center gap-2">
          <Avatar
            name={userDetails?.member?.display_name}
            src={getFileURL(userDetails?.member?.avatar_url ?? "")}
            shape="circle"
            size="sm"
            showTooltip={false}
          />
          <span className="flex-grow truncate">{userDetails?.member?.display_name}</span>
        </div>
      ),
    };
  });

  const handleSelectedOptions = (updatedIds: string[]) => updateFilters(workspaceSlug, "logged_by", updatedIds);

  return (
    <CustomSearchSelect
      value={selectedIds}
      onChange={handleSelectedOptions}
      options={dropdownOptions}
      label={dropdownLabel()}
      multiple
    />
  );
});
