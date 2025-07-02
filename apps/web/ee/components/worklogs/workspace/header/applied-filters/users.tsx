"use client";

import { FC } from "react";
import { observer } from "mobx-react";
// plane ui
import { Avatar } from "@plane/ui";
// helpers
import { getFileURL  } from "@plane/utils";
// hooks
import { useMember } from "@/hooks/store";
// plane web components
import { AppliedFilterGroup, AppliedFilterGroupItem } from "@/plane-web/components/worklogs";
// plane web hooks
import { useWorkspaceWorklogs } from "@/plane-web/hooks/store";

type TWorkspaceWorklogAppliedFilterUsers = {
  workspaceSlug: string;
  workspaceId: string;
};

export const WorkspaceWorklogAppliedFilterUsers: FC<TWorkspaceWorklogAppliedFilterUsers> = observer((props) => {
  const { workspaceSlug } = props;
  // hooks
  const {
    workspace: { getWorkspaceMemberDetails },
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
    const userDetails = getWorkspaceMemberDetails(userId);
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
          <div className="flex-grow truncate text-xs">{userDetails?.member?.display_name}</div>
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
