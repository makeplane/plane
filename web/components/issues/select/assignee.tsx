import { useEffect } from "react";
import { useRouter } from "next/router";
import useSWR from "swr";
import { observer } from "mobx-react-lite";
// hooks
import { useMember } from "hooks/store";
// ui
import { Avatar, AvatarGroup, CustomSearchSelect, UserGroupIcon } from "@plane/ui";
// fetch-keys
import { PROJECT_MEMBERS } from "constants/fetch-keys";

export type Props = {
  projectId: string;
  value: string[];
  onChange: (value: string[]) => void;
};

export const IssueAssigneeSelect: React.FC<Props> = observer((props) => {
  const { projectId, value = [], onChange } = props;
  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;
  // store hooks
  const {
    getUserDetails,
    project: { fetchProjectMembers, getProjectMemberIds },
  } = useMember();
  // derived values
  const memberIds = getProjectMemberIds(projectId);

  useSWR(
    workspaceSlug && projectId ? PROJECT_MEMBERS(projectId.toString()) : null,
    workspaceSlug && projectId ? () => fetchProjectMembers(workspaceSlug.toString(), projectId.toString()) : null
  );

  const options = memberIds?.map((memberId) => {
    const member = getUserDetails(memberId);
    return {
      value: `${member?.id}`,
      query: member?.display_name ?? "",
      content: (
        <div className="flex items-center gap-2">
          <Avatar name={member?.display_name} src={member?.avatar} showTooltip={false} />
          {member?.is_bot ? member?.first_name : member?.display_name}
        </div>
      ),
    };
  });

  useEffect(() => {
    if (!workspaceSlug) return;

    if (!memberIds) fetchProjectMembers(workspaceSlug.toString(), projectId);
  }, [fetchProjectMembers, memberIds, projectId, workspaceSlug]);

  return (
    <CustomSearchSelect
      value={value}
      onChange={onChange}
      options={options}
      customButton={
        <div className="flex cursor-pointer items-center gap-2 text-xs text-custom-text-200">
          {value && value.length > 0 && Array.isArray(value) ? (
            <div className="-my-0.5 flex items-center justify-center gap-2">
              <AvatarGroup showTooltip={false}>
                {value.map((assigneeId) => {
                  const memberId = memberIds?.find((m) => m === assigneeId);

                  const member = getUserDetails(memberId ?? "");

                  if (!member) return null;

                  return <Avatar key={member.id} name={member.display_name} src={member.avatar} />;
                })}
              </AvatarGroup>
            </div>
          ) : (
            <div className="flex w-full items-center justify-center gap-1 rounded border-[0.5px] border-custom-border-300 px-2 py-1 text-xs text-custom-text-300">
              <UserGroupIcon className="h-3 w-3" />
              <span>Assignee</span>
            </div>
          )}
        </div>
      }
      multiple
      noChevron
    />
  );
});
