import React from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import useSWR from "swr";
import { Ban } from "lucide-react";
// mobx store
import { useMobxStore } from "lib/mobx/store-provider";
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
  // store
  const {
    projectMember: { fetchProjectMembers, projectMembers },
  } = useMobxStore();

  useSWR(
    workspaceSlug && projectId ? `PROJECT_MEMBERS_${projectId.toString().toUpperCase()}` : null,
    workspaceSlug && projectId ? () => fetchProjectMembers(workspaceSlug.toString(), projectId.toString()) : null
  );

  const options = projectMembers?.map((member) => ({
    value: member.member.id,
    query: member.member.display_name,
    content: (
      <div className="flex items-center gap-2">
        <Avatar name={member?.member.display_name} src={member?.member.avatar} />
        {member.member.display_name}
      </div>
    ),
  }));

  const selectedOption = projectMembers?.find((m) => m.member.id === value)?.member;

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
