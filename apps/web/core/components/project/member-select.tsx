"use client";

import React from "react";
import { observer } from "mobx-react";
import { useParams } from "next/navigation";
import { Ban } from "lucide-react";
import { EUserProjectRoles } from "@plane/types";
// plane ui
import { Avatar, CustomSearchSelect } from "@plane/ui";
// helpers
import { getFileURL } from "@plane/utils";
// hooks
import { useMember } from "@/hooks/store";

type Props = {
  value: any;
  onChange: (val: string) => void;
  isDisabled?: boolean;
};

export const MemberSelect: React.FC<Props> = observer((props) => {
  const { value, onChange, isDisabled = false } = props;
  // router
  const { projectId } = useParams();
  // store hooks
  const {
    project: { projectMemberIds, getProjectMemberDetails },
  } = useMember();

  const options = projectMemberIds
    ?.map((userId) => {
      const memberDetails = projectId ? getProjectMemberDetails(userId, projectId.toString()) : null;

      if (!memberDetails?.member) return;
      const isGuest = memberDetails.role === EUserProjectRoles.GUEST;
      if (isGuest) return;

      return {
        value: `${memberDetails?.member.id}`,
        query: `${memberDetails?.member.display_name}`,
        content: (
          <div className="flex items-center gap-2">
            <Avatar name={memberDetails?.member.display_name} src={getFileURL(memberDetails?.member.avatar_url)} />
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
  const selectedOption = projectId ? getProjectMemberDetails(value, projectId.toString()) : null;

  return (
    <CustomSearchSelect
      value={value}
      label={
        <div className="flex items-center gap-2 h-3.5">
          {selectedOption && (
            <Avatar name={selectedOption.member?.display_name} src={getFileURL(selectedOption.member?.avatar_url)} />
          )}
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
      buttonClassName="!px-3 !py-2 bg-custom-background-100"
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
