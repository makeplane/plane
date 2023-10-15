import { useRouter } from "next/router";

import useSWR from "swr";

// services
import { ProjectService } from "services/project";
// ui
import { AssigneesList, Avatar, CustomSearchSelect, Icon } from "components/ui";
// fetch-keys
import { PROJECT_MEMBERS } from "constants/fetch-keys";

export type Props = {
  projectId: string;
  value: string[];
  onChange: (value: string[]) => void;
};

const projectService = new ProjectService();

export const IssueAssigneeSelect: React.FC<Props> = ({ projectId, value = [], onChange }) => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { data: members } = useSWR(
    workspaceSlug && projectId ? PROJECT_MEMBERS(projectId as string) : null,
    workspaceSlug && projectId
      ? () => projectService.projectMembers(workspaceSlug as string, projectId as string)
      : null
  );

  const options = members?.map((member) => ({
    value: member.member.id,
    query: member.member.display_name ?? "",
    content: (
      <div className="flex items-center gap-2">
        <Avatar user={member.member} />
        {member.member.is_bot ? member.member.first_name : member.member.display_name}
      </div>
    ),
  }));

  return (
    <CustomSearchSelect
      value={value}
      onChange={onChange}
      options={options}
      customButton={
        <div className="flex items-center gap-2 cursor-pointer text-xs text-custom-text-200">
          {value && value.length > 0 && Array.isArray(value) ? (
            <div className="-my-0.5 flex items-center justify-center gap-2">
              <AssigneesList userIds={value} length={3} showLength={true} />
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 px-1.5 py-1 rounded shadow-sm border border-custom-border-300 hover:bg-custom-background-80">
              <Icon iconName="person" className="!text-base !leading-4" />
              <span className="text-custom-text-200">Assignee</span>
            </div>
          )}
        </div>
      }
      multiple
      noChevron
    />
  );
};
