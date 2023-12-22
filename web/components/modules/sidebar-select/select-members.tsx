import React from "react";
import { ChevronDown } from "lucide-react";
import { observer } from "mobx-react-lite";
// hooks
import { useMember } from "hooks/store";
// ui
import { Avatar, AvatarGroup, CustomSearchSelect, UserGroupIcon } from "@plane/ui";

type Props = {
  value: string[] | undefined;
  onChange: (val: string[]) => void;
  disabled?: boolean;
};

export const SidebarMembersSelect: React.FC<Props> = observer((props) => {
  const { value, onChange, disabled = false } = props;
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
    <div className="flex items-center justify-start gap-1">
      <div className="flex w-1/2 items-center justify-start gap-2 text-custom-text-300">
        <UserGroupIcon className="h-4 w-4" />
        <span className="text-base">Members</span>
      </div>
      <div className="flex w-1/2 items-center rounded-sm ">
        <CustomSearchSelect
          disabled={disabled}
          className="w-full rounded-sm"
          value={value ?? []}
          customButtonClassName="rounded-sm"
          customButton={
            value && value.length > 0 && Array.isArray(value) ? (
              <div className="px-1">
                <AvatarGroup showTooltip={false}>
                  {value.map((assigneeId) => {
                    const member = getUserDetails(assigneeId || "");

                    if (!member) return null;

                    return <Avatar key={member.id} name={member.display_name} src={member.avatar} />;
                  })}
                </AvatarGroup>
              </div>
            ) : (
              <div className="group flex w-full items-center justify-between gap-2 p-1 text-sm text-custom-text-400">
                <span>No members</span>
                {!disabled && <ChevronDown className="hidden h-3.5 w-3.5 group-hover:flex" />}
              </div>
            )
          }
          options={options}
          onChange={onChange}
          maxHeight="md"
          multiple
        />
      </div>
    </div>
  );
});
