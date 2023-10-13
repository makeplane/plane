import { FC } from "react";
import { useRouter } from "next/router";
import useSWR from "swr";
// services
import { ProjectService } from "services/project";
// ui
import { Avatar, CustomSearchSelect } from "components/ui";
// icons
import { UserCircleIcon } from "@heroicons/react/24/outline";
// fetch-keys
import { PROJECT_MEMBERS } from "constants/fetch-keys";

type Props = {
  value: string | null | undefined;
  onChange: (val: string) => void;
};

const projectService = new ProjectService();

export const SidebarLeadSelect: FC<Props> = (props) => {
  const { value, onChange } = props;
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;
  // fetch project members
  const { data: members } = useSWR(
    workspaceSlug && projectId ? PROJECT_MEMBERS(projectId as string) : null,
    workspaceSlug && projectId
      ? () => projectService.projectMembers(workspaceSlug as string, projectId as string)
      : null
  );

  const options = members?.map((member) => ({
    value: member.member.id,
    query: member.member.display_name,
    content: (
      <div className="flex items-center gap-2">
        <Avatar user={member.member} />
        {member.member.display_name}
      </div>
    ),
  }));

  const selectedOption = members?.find((m) => m.member.id === value)?.member;

  return (
    <div className="flex items-center justify-start gap-1">
      <div className="flex w-40 items-center justify-start gap-2 text-custom-text-200">
        <UserCircleIcon className="h-5 w-5" />
        <span>Lead</span>
      </div>
      <div className="sm:basis-1/2">
        <CustomSearchSelect
          value={value}
          label={
            <div className="flex items-center gap-2">
              {selectedOption && <Avatar user={selectedOption} />}
              {selectedOption ? selectedOption?.display_name : <span className="text-custom-text-200">No lead</span>}
            </div>
          }
          options={options}
          maxHeight="md"
          onChange={onChange}
        />
      </div>
    </div>
  );
};
