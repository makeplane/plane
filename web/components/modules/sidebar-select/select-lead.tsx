import { FC } from "react";
import { useRouter } from "next/router";
import useSWR from "swr";
// services
import { ProjectService } from "services/project";
// ui
import { Avatar } from "components/ui";
import { CustomSearchSelect } from "@plane/ui";
// icons
import { UserCircle2 } from "lucide-react";
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
        <Avatar user={member.member} height="18px" width="18px" />
        {member.member.display_name}
      </div>
    ),
  }));

  const selectedOption = members?.find((m) => m.member.id === value)?.member;

  return (
    <div className="flex items-center justify-start gap-1">
      <div className="flex w-1/2 items-center justify-start gap-2 text-custom-text-300">
        <UserCircle2 className="h-4 w-4" />
        <span className="text-base">Lead</span>
      </div>
      <div className="flex items-center w-1/2">
        <CustomSearchSelect
          className="w-full"
          value={value}
          label={
            <div className="flex items-center gap-2">
              {selectedOption && <Avatar user={selectedOption} height="18px" width="18px" />}
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
