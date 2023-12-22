import React from "react";
import { observer } from "mobx-react-lite";
// hooks
import { useMember } from "hooks/store";
// ui
import { Avatar, AvatarGroup, CustomSearchSelect, UserGroupIcon } from "@plane/ui";

type Props = {
  value: string[];
  onChange: () => void;
};

export const ModuleMembersSelect: React.FC<Props> = observer((props) => {
  const { value, onChange } = props;
  // store hooks
  const {
    getUserDetails,
    project: { projectMemberIds },
  } = useMember();

  const options = projectMemberIds?.map((memberId) => {
    const member = getUserDetails(memberId);
    return {
      value: `${member?.id}`,
      query: member?.display_name ?? "",
      content: (
        <div className="flex items-center gap-2">
          <Avatar name={member?.display_name} src={member?.avatar} />
          {member?.display_name}
        </div>
      ),
    };
  });

  return (
    <CustomSearchSelect
      value={value}
      label={
        <div className="flex items-center gap-2 text-custom-text-200">
          {value && value.length > 0 && Array.isArray(value) ? (
            <div className="flex items-center justify-center gap-2">
              <AvatarGroup>
                {value.map((assigneeId) => {
                  const member = getUserDetails(assigneeId || "");

                  if (!member) return null;

                  return <Avatar key={member.id} name={member.display_name} src={member.avatar} />;
                })}
              </AvatarGroup>
              <span className="text-custom-text-200">{value.length} Assignees</span>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 text-custom-text-300">
              <UserGroupIcon className="h-3 w-3" />
              <span>Assignee</span>
            </div>
          )}
        </div>
      }
      options={options}
      onChange={onChange}
      maxHeight="md"
      multiple
      noChevron
    />
  );
});
