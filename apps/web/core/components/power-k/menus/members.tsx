import { Command } from "cmdk";
import { observer } from "mobx-react";
// plane imports
import { Avatar } from "@plane/ui";
import { getFileURL } from "@plane/utils";
// hooks
import { useMember } from "@/hooks/store/use-member";
// local imports
import { PowerKModalCommandItem } from "../ui/modal/command-item";

type Props = {
  handleSelect: (assigneeId: string) => void;
  heading?: string;
  userIds: string[] | undefined;
  value: string[];
};

export const PowerKMembersMenu = observer(function PowerKMembersMenu(props: Props) {
  const { handleSelect, heading, userIds, value } = props;
  // store hooks
  const { getUserDetails } = useMember();

  return (
    <Command.Group heading={heading}>
      {userIds?.map((memberId) => {
        const memberDetails = getUserDetails(memberId);
        if (!memberDetails) return;

        return (
          <PowerKModalCommandItem
            key={memberId}
            iconNode={
              <Avatar
                name={memberDetails?.display_name}
                src={getFileURL(memberDetails?.avatar_url ?? "")}
                showTooltip={false}
                className="shrink-0"
              />
            }
            isSelected={value.includes(memberId)}
            label={memberDetails?.display_name}
            onSelect={() => handleSelect(memberId)}
          />
        );
      })}
    </Command.Group>
  );
});
