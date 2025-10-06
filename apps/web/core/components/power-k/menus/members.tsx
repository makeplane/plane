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
  handleSelect: (assigneeId: string) => void;
  heading?: string;
  userIds: string[] | undefined;
  value: string[];
};

export const PowerKMembersMenu: React.FC<Props> = observer((props) => {
  const { handleSelect, heading, userIds, value } = props;
  // store hooks
  const { getUserDetails } = useMember();

  return (
    <Command.Group heading={heading}>
      {userIds?.map((memberId) => {
        const memberDetails = getUserDetails(memberId);
        if (!memberDetails) return;

        return (
          <Command.Item key={memberId} onSelect={() => handleSelect(memberId)} className="focus:outline-none">
            <div className="flex items-center gap-2">
              <Avatar
                name={memberDetails?.display_name}
                src={getFileURL(memberDetails?.avatar_url ?? "")}
                showTooltip={false}
                className="shrink-0"
              />
              {memberDetails?.display_name}
            </div>
            {value.includes(memberId ?? "") && (
              <div className="shrink-0">
                <Check className="size-3" />
              </div>
            )}
          </Command.Item>
        );
      })}
    </Command.Group>
  );
});
