"use client";

import { Command } from "cmdk";
import { observer } from "mobx-react";
import { Check } from "lucide-react";
// plane imports
import { Avatar } from "@plane/ui";
import { getFileURL } from "@plane/utils";
// hooks
import { useMember } from "@/hooks/store/use-member";

type Props = {
  handleUpdateMember: (assigneeId: string) => void;
  userIds: string[] | undefined;
  value: string[];
};

export const PowerKMembersMenu: React.FC<Props> = observer((props) => {
  const { handleUpdateMember, userIds, value } = props;
  // store hooks
  const { getUserDetails } = useMember();

  return (
    <>
      {userIds?.map((memberId) => {
        const memberDetails = getUserDetails(memberId);
        if (!memberDetails) return;

        return (
          <Command.Item key={memberId} onSelect={() => handleUpdateMember(memberId)} className="focus:outline-none">
            <div className="flex items-center gap-2">
              <Avatar
                name={memberDetails?.display_name}
                src={getFileURL(memberDetails?.avatar_url ?? "")}
                showTooltip={false}
                className="flex-shrink-0"
              />
              {memberDetails?.display_name}
            </div>
            {value.includes(memberId ?? "") && (
              <div className="flex-shrink-0">
                <Check className="size-3" />
              </div>
            )}
          </Command.Item>
        );
      })}
    </>
  );
});
