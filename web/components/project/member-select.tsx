import React from "react";
import { observer } from "mobx-react";
import { Ban } from "lucide-react";
// hooks
import { Avatar, CustomSearchSelect } from "@plane/ui";
import { useMember } from "@/hooks/store";
// ui

type Props = {
  value: any;
  onChange: (val: string) => void;
  isDisabled?: boolean;
};

export const MemberSelect: React.FC<Props> = observer((props) => {
  const { value, onChange, isDisabled = false } = props;
  // store hooks
  const {
    project: { projectMemberIds, getProjectMemberDetails },
  } = useMember();

  const options = projectMemberIds
    ?.map((userId) => {
      const memberDetails = getProjectMemberDetails(userId);

      if (!memberDetails?.member) return;

      return {
        value: `${memberDetails?.member.id}`,
        query: `${memberDetails?.member.display_name}`,
        content: (
          <div className="flex items-center gap-2">
            <Avatar name={memberDetails?.member.display_name} src={memberDetails?.member.avatar} />
            {memberDetails?.member.display_name}
          </div>
        ),
      };
    })
    .filter((option) => !!option) as
    | {
        value: string;
        query: string;
        content: React.JSX.Element;
      }[]
    | undefined;
  const selectedOption = getProjectMemberDetails(value);

  return (
    <CustomSearchSelect
      value={value}
      label={
        <div className="flex items-center gap-2 h-5">
          {selectedOption && <Avatar name={selectedOption.member?.display_name} src={selectedOption.member?.avatar} />}
          {selectedOption ? (
            selectedOption.member?.display_name
          ) : (
            <div className="flex items-center gap-2">
              <Ban className="h-3.5 w-3.5 rotate-90 text-custom-sidebar-text-400" />
              <span className="text-sm text-custom-sidebar-text-400">None</span>
            </div>
          )}
        </div>
      }
      buttonClassName="!px-3 !py-2"
      options={
        options &&
        options && [
          ...options,
          {
            value: "none",
            query: "none",
            content: (
              <div className="flex items-center gap-2">
                <Ban className="h-3.5 w-3.5 rotate-90 text-custom-sidebar-text-400" />
                <span className="py-0.5 text-sm text-custom-sidebar-text-400">None</span>
              </div>
            ),
          },
        ]
      }
      maxHeight="md"
      onChange={onChange}
      disabled={isDisabled}
    />
  );
});
