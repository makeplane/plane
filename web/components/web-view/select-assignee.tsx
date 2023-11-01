// react
import React, { useState } from "react";
import { useRouter } from "next/router";
import useSWR from "swr";
import { ChevronDown } from "lucide-react";
// services
import { ProjectService } from "services/project";
// components
import { WebViewModal } from "./web-view-modal";
// ui
import { Avatar } from "@plane/ui";
// fetch keys
import { PROJECT_MEMBERS } from "constants/fetch-keys";

type Props = {
  value: string[];
  onChange: (value: any) => void;
  disabled?: boolean;
};

// services
const projectService = new ProjectService();

export const AssigneeSelect: React.FC<Props> = (props) => {
  const { value, onChange, disabled = false } = props;

  const [isOpen, setIsOpen] = useState(false);

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const { data: members } = useSWR(
    workspaceSlug && projectId ? PROJECT_MEMBERS(projectId as string) : null,
    workspaceSlug && projectId
      ? () => projectService.fetchProjectMembers(workspaceSlug as string, projectId as string)
      : null
  );

  const selectedAssignees = members?.filter((member) => value?.includes(member.member.id));

  return (
    <>
      <WebViewModal
        isOpen={isOpen}
        modalTitle="Select assignees"
        onClose={() => {
          setIsOpen(false);
        }}
      >
        <WebViewModal.Options
          options={
            members?.map((member) => ({
              label: member.member.display_name,
              value: member.member.id,
              checked: value?.includes(member.member.id),
              icon: <Avatar name={member?.member.display_name} src={member?.member.avatar} />,
              onClick: () => {
                setIsOpen(false);
                if (disabled) return;
                onChange(member.member.id);
              },
            })) || []
          }
        />
      </WebViewModal>

      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(true)}
        className={"relative w-full px-2.5 py-0.5 text-base flex justify-between items-center gap-0.5"}
      >
        {value && value.length > 0 && Array.isArray(value) ? (
          <div className="-my-0.5 flex items-center gap-2">
            <Avatar name={selectedAssignees?.[0]?.member.display_name} src={selectedAssignees?.[0]?.member.avatar} />
            <span className="text-custom-text-200 text-xs">{selectedAssignees?.length} Assignees</span>
          </div>
        ) : (
          <span className="text-custom-text-200">No assignees</span>
        )}
        <ChevronDown className="w-4 h-4 text-custom-text-200" />
      </button>
    </>
  );
};
