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
  const { data: people } = useSWR(
    workspaceSlug && projectId ? PROJECT_MEMBERS(projectId as string) : null,
    workspaceSlug && projectId
      ? () => projectServices.projectMembers(workspaceSlug as string, projectId as string)
      : null
  );

  const options =
    people?.map((person) => ({
      value: person.member.id,
      query:
        person.member.first_name && person.member.first_name !== ""
          ? person.member.first_name
          : person.member.email,
      content: (
        <div className="flex items-center gap-2">
          <Avatar user={person.member} />
          {person.member.first_name && person.member.first_name !== ""
            ? person.member.first_name
            : person.member.email}
        </div>
      ),
    })) ?? [];

  return (
    <CustomSearchSelect
      value={value}
      onChange={onChange}
      options={options}
      label={
        <div className="flex items-center gap-2 text-gray-500">
          {value && value.length > 0 && Array.isArray(value) ? (
            <span className="flex items-center justify-center gap-2">
              <AssigneesList userIds={value} length={3} showLength={false} />
              <span className=" text-gray-500">{value.length} Assignees</span>
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <UserGroupIcon className="h-4 w-4 text-gray-500 " />
              <span className=" text-gray-500">Assignee</span>
            </span>
          )}
        </div>
      }
      multiple
    />
  );
};
