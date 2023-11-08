import React from "react";
import { useRouter } from "next/router";
import useSWR from "swr";
// services
import { ProjectService } from "services/project";
// ui
import { Avatar, CustomSearchSelect } from "@plane/ui";
// icons
import { UserCircle } from "lucide-react";
// fetch-keys
import { PROJECT_MEMBERS } from "constants/fetch-keys";

type Props = {
  value: string | null;
  onChange: () => void;
};

const projectService = new ProjectService();

export const ModuleLeadSelect: React.FC<Props> = ({ value, onChange }) => {
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
      options={options}
      value={value}
      label={
        <div className="flex items-center gap-2">
          {selectedOption ? (
            <Avatar name={selectedOption.display_name} src={selectedOption.avatar} />
          ) : (
            <UserCircle className="h-3 w-3 text-custom-text-300" />
          )}
          {selectedOption ? (
            selectedOption?.display_name
          ) : (
            <span className={`${selectedOption ? "text-custom-text-200" : "text-custom-text-300"}`}>Lead</span>
          )}
        </div>
      }
      onChange={onChange}
      noChevron
    />
  );
};
