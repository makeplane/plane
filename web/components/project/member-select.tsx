import React from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import useSWR from "swr";
import { Ban } from "lucide-react";
// store hooks
import { useMember } from "hooks/store";
// ui
import { Avatar, CustomSearchSelect } from "@plane/ui";

type Props = {
  value: any;
  onChange: (val: string) => void;
  isDisabled?: boolean;
};

export const MemberSelect: React.FC<Props> = observer((props) => {
  const { value, onChange, isDisabled = false } = props;
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;
  // store hooks
  const {
    project: { fetchProjectMembers, projectMemberIds, getProjectMemberDetails, projectMemberMap },
  } = useMember();

  useSWR(
    workspaceSlug && projectId ? `PROJECT_MEMBERS_${projectId.toString().toUpperCase()}` : null,
    workspaceSlug && projectId ? () => fetchProjectMembers(workspaceSlug.toString(), projectId.toString()) : null
  );

  console.log("projectMemberIds", projectMemberIds);

  const options = projectMemberIds?.map((userId) => {
    console.log("userId", userId);
    console.log("projectMemberMap", projectMemberMap);
    const memberDetails = getProjectMemberDetails(userId);

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
  });
  const selectedOption = getProjectMemberDetails(value);

  return (
    <CustomSearchSelect
      value={value}
      label={
        <div className="flex items-center gap-2">
          {selectedOption && <Avatar name={selectedOption.member.display_name} src={selectedOption.member.avatar} />}
          {selectedOption ? (
            selectedOption.member.display_name
          ) : (
            <div className="flex items-center gap-2">
              <Ban className="h-3.5 w-3.5 rotate-90 text-custom-sidebar-text-400" />
              <span className="py-0.5 text-sm text-custom-sidebar-text-400">None</span>
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
      width="w-full"
      onChange={onChange}
      disabled={isDisabled}
    />
  );
});
