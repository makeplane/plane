import React from "react";
import { useRouter } from "next/router";
import useSWR from "swr";
import { Ban } from "lucide-react";
// services
import { ProjectService } from "services/project";
// ui
import { Avatar, CustomSearchSelect } from "@plane/ui";
// fetch-keys
import { PROJECT_MEMBERS } from "constants/fetch-keys";

type Props = {
  value: any;
  onChange: (val: string) => void;
  isDisabled?: boolean;
};

// services
const projectService = new ProjectService();

export const MemberSelect: React.FC<Props> = ({ value, onChange, isDisabled = false }) => {
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { data: members } = useSWR(
    workspaceSlug && projectId ? PROJECT_MEMBERS(projectId as string) : null,
    workspaceSlug && projectId
      ? () => projectService.fetchProjectMembers(workspaceSlug as string, projectId as string)
      : null
  );

  const options = members?.map((member) => ({
    value: member.member.id,
    query: member.member.display_name,
    content: (
      <div className="flex items-center gap-2">
        <Avatar name={member?.member.display_name} src={member?.member.avatar} />
        {member.member.display_name}
      </div>
    ),
  }));

  const selectedOption = members?.find((m) => m.member.id === value)?.member;

  return (
    <CustomSearchSelect
      value={value}
      label={
        <div className="flex items-center gap-2">
          {selectedOption && <Avatar name={selectedOption.display_name} src={selectedOption.avatar} />}
          {selectedOption ? (
            selectedOption?.display_name
          ) : (
            <div className="flex items-center gap-2">
              <Ban className="h-3.5 w-3.5 text-custom-sidebar-text-400 rotate-90" />
              <span className="text-sm py-0.5 text-custom-sidebar-text-400">None</span>
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
                <Ban className="h-3.5 w-3.5 text-custom-sidebar-text-400 rotate-90" />
                <span className="text-sm py-0.5 text-custom-sidebar-text-400">None</span>
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
};
