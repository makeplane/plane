import React from "react";
import { observer } from "mobx-react-lite";
// hooks
import { useMember } from "hooks/store";
// ui
import { Avatar, AvatarGroup, CustomSearchSelect } from "@plane/ui";

type Props = {
  value: string[];
  onChange: (val: string[]) => void;
  disabled?: boolean;
};

export const SidebarAssigneeSelect: React.FC<Props> = observer(({ value, onChange, disabled = false }) => {
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
      customButton={
        <>
          {value && value.length > 0 && Array.isArray(value) ? (
            <div className="-my-0.5 flex items-center gap-2">
              <AvatarGroup>
                {value.map((assigneeId) => {
                  const member = getUserDetails(assigneeId || "");

                  if (!member) return null;

                  return <Avatar key={member.id} name={member.display_name} src={member.avatar} />;
                })}
              </AvatarGroup>
              <span className="text-xs text-custom-text-100">{value.length} Assignees</span>
            </div>
          ) : (
            <button
              type="button"
              className={`rounded bg-custom-background-80 px-2.5 py-0.5 text-xs text-custom-text-200 ${
                disabled ? "cursor-not-allowed" : ""
              }`}
            >
              No assignees
            </button>
          )}
        </>
      }
      options={options}
      onChange={onChange}
      multiple
      disabled={disabled}
    />
  );
});
