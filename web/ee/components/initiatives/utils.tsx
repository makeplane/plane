import { ReactElement } from "react";
// plane
import { IUserLite } from "@plane/types";
import { Avatar } from "@plane/ui";
// helpers
import { getFileURL } from "@/helpers/file.helper";
// PLane-web
import { TInitiativeGroupByOptions } from "@/plane-web/types/initiative";

export type TInitiativeGroup = {
  id: string;
  name: string;
  icon?: ReactElement;
};

export const getGroupList = (
  groupIds: string[],
  groupBy: TInitiativeGroupByOptions,
  getUserDetails: (userId: string) => IUserLite | undefined
) => {
  const groupList: TInitiativeGroup[] = [];

  if (!groupBy) {
    for (const groupId of groupIds) {
      groupList.push({
        id: groupId,
        name: groupId,
      });
    }
  }

  if (groupBy === "created_by" || groupBy === "lead") {
    for (const groupId of groupIds) {
      if (groupId === "None") {
        groupList.push({
          id: groupId,
          name: "None",
          icon: <Avatar size="md" />,
        });
        continue;
      }

      const member = getUserDetails(groupId);

      if (!member) continue;

      groupList.push({
        id: groupId,
        name: member.display_name,
        icon: <Avatar name={member?.display_name} src={getFileURL(member?.avatar_url ?? "")} size="md" />,
      });
    }
  }

  return groupList;
};
