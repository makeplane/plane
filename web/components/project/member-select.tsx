import React from "react";
import { useRouter } from "next/router";
import useSWR from "swr";

// store
import { observer } from "mobx-react-lite";
import { useMobxStore } from "lib/mobx/store-provider";
// ui
import { Avatar } from "components/ui";
import { CustomSearchSelect } from "@plane/ui";
// icon
import { Ban } from "lucide-react";

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
  const { project: projectStore } = useMobxStore();

  useSWR(
    workspaceSlug && projectId ? `PROJECT_MEMBERS_${projectId.toString().toUpperCase()}` : null,
    workspaceSlug && projectId
      ? () => projectStore.fetchProjectMembers(workspaceSlug.toString(), projectId.toString())
      : null
  );

  const members = projectStore.members?.[projectId?.toString()!];

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
    <CustomSearchSelect
      value={value}
      label={
        <div className="flex items-center gap-2">
          {selectedOption && <Avatar user={selectedOption} />}
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
});
