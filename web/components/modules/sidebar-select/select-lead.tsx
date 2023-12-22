import { FC } from "react";
import { useRouter } from "next/router";
import useSWR from "swr";
// services
import { ProjectMemberService } from "services/project";
// ui
import { Avatar, CustomSearchSelect } from "@plane/ui";
// icons
import { ChevronDown, UserCircle2 } from "lucide-react";
// fetch-keys
import { PROJECT_MEMBERS } from "constants/fetch-keys";
import { useMember } from "hooks/store";
import { observer } from "mobx-react-lite";

type Props = {
  value: string | null | undefined;
  onChange: (val: string) => void;
  disabled?: boolean;
};

const projectMemberService = new ProjectMemberService();

export const SidebarLeadSelect: FC<Props> = observer((props) => {
  const { value, onChange, disabled = false } = props;
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { memberMap } = useMember();

  // fetch project members
  const { data: members } = useSWR(
    workspaceSlug && projectId ? PROJECT_MEMBERS(projectId as string) : null,
    workspaceSlug && projectId
      ? () => projectMemberService.fetchProjectMembers(workspaceSlug as string, projectId as string)
      : null
  );

  const options = members?.map((membership) => {
    const member = memberMap[membership.id];
    return {
      value: member.id,
      query: member.display_name ?? "",
      content: (
        <div className="flex items-center gap-2">
          <Avatar name={member.display_name} src={member.avatar} />
          {member.display_name}
        </div>
      ),
    };
  });

  const selectedOption = memberMap[members?.find((m) => m.member === value)?.id || ""];

  return (
    <div className="flex items-center justify-start gap-1">
      <div className="flex w-1/2 items-center justify-start gap-2 text-custom-text-300">
        <UserCircle2 className="h-4 w-4" />
        <span className="text-base">Lead</span>
      </div>
      <div className="flex w-1/2 items-center rounded-sm">
        <CustomSearchSelect
          disabled={disabled}
          className="w-full rounded-sm"
          value={value}
          customButtonClassName="rounded-sm"
          customButton={
            selectedOption ? (
              <div className="flex w-full items-center justify-start gap-2 p-0.5">
                <Avatar name={selectedOption.display_name} src={selectedOption.avatar} />
                <span className="text-sm text-custom-text-200">{selectedOption?.display_name}</span>
              </div>
            ) : (
              <div className="group flex w-full items-center justify-between gap-2 p-1 text-sm text-custom-text-400">
                <span>No lead</span>
                {!disabled && <ChevronDown className="hidden h-3.5 w-3.5 group-hover:flex" />}
              </div>
            )
          }
          options={options}
          maxHeight="md"
          onChange={onChange}
        />
      </div>
    </div>
  );
});
