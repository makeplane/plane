"use client";

import { FC } from "react";
import { observer } from "mobx-react";
// plane ui
import { Avatar, CustomSearchSelect } from "@plane/ui";
// helpers
import { getFileURL } from "@/helpers/file.helper";
// hooks
import { useMember } from "@/hooks/store";
import { useWorkspaceWorklogs } from "@/plane-web/hooks/store";

type TWorkspaceWorklogFilterUsers = {
  workspaceSlug: string;
  workspaceId: string;
};

export const WorkspaceWorklogFilterUsers: FC<TWorkspaceWorklogFilterUsers> = observer((props) => {
  const { workspaceSlug } = props;
  // hooks
  const {
    workspace: { workspaceMemberIds, getWorkspaceMemberDetails },
  } = useMember();
  const { filters, updateFilters } = useWorkspaceWorklogs();

  // derived values
  const selectedIds = filters.logged_by;

  const dropdownLabel = () =>
    selectedIds.length === 1
      ? workspaceMemberIds
          ?.filter((p) => selectedIds.includes(p))
          .map((p) => getWorkspaceMemberDetails(p)?.member?.display_name)
          .join(", ")
      : selectedIds.length > 1
        ? `${selectedIds?.length} Users`
        : "Users";

  const dropdownOptions = workspaceMemberIds?.map((userId) => {
    const userDetails = getWorkspaceMemberDetails(userId);
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
