import { useRouter } from "next/router";

import useSWR from "swr";

// services
import projectServices from "services/project.service";
// ui
import { AssigneesList, Avatar, CustomSearchSelect } from "components/ui";
// icons
import { UserGroupIcon } from "@heroicons/react/24/outline";
// fetch-keys
import { PROJECT_MEMBERS } from "constants/fetch-keys";

export type Props = {
  projectId: string;
  value: string[];
  onChange: (value: string[]) => void;
};

export const IssueAssigneeSelect: React.FC<Props> = ({ projectId, value = [], onChange }) => {
  const router = useRouter();
  const { workspaceSlug } = router.query;

  // fetching project members
  const { data: members } = useSWR(
    workspaceSlug && projectId ? PROJECT_MEMBERS(projectId as string) : null,
    workspaceSlug && projectId
      ? () => projectServices.projectMembers(workspaceSlug as string, projectId as string)
      : null
  );

  const options = members?.map((member) => ({
    value: member.member.id,
    query:
      (member.member.first_name && member.member.first_name !== ""
        ? member.member.first_name
        : member.member.email) +
        " " +
        member.member.last_name ?? "",
    content: (
      <div className="flex items-center gap-2">
        <Avatar user={member.member} />
        {`${
          member.member.first_name && member.member.first_name !== ""
            ? member.member.first_name
            : member.member.email
        } ${member.member.last_name ?? ""}`}
      </div>
    ),
  }));

  return (
    <CustomSearchSelect
      value={value}
      onChange={onChange}
      options={options}
      label={
        <div className="flex items-center gap-2 text-brand-secondary">
          {value && value.length > 0 && Array.isArray(value) ? (
            <div className="flex items-center justify-center gap-2">
              <AssigneesList userIds={value} length={3} showLength={true} />
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2">
              <UserGroupIcon className="h-4 w-4 text-brand-secondary" />
              <span className="text-brand-secondary">Assignee</span>
            </div>
          )}
        </div>
      }
      multiple
      noChevron
    />
  );
};
