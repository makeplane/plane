import React, { useState } from "react";

import { useRouter } from "next/router";

// react-hook-form
import { UseFormWatch } from "react-hook-form";
// hooks
import useToast from "hooks/use-toast";
// components
import { ExistingIssuesListModal } from "components/core";
// icons
import { XMarkIcon } from "@heroicons/react/24/outline";
import { BlockedIcon } from "components/icons";
// types
import { BlockeIssueDetail, IIssue, ISearchIssueResponse, UserAuth } from "types";

type Props = {
  issueId?: string;
  submitChanges: (formData: Partial<IIssue>) => void;
  watch: UseFormWatch<IIssue>;
  disabled?: boolean;
};

export const SidebarBlockedSelect: React.FC<Props> = ({
  issueId,
  submitChanges,
  watch,
  disabled = false,
}) => {
  const [isBlockedModalOpen, setIsBlockedModalOpen] = useState(false);

  const { setToastAlert } = useToast();

  const router = useRouter();
  const { workspaceSlug } = router.query;

  const handleClose = () => {
    setIsBlockedModalOpen(false);
  };

  const onSubmit = async (data: ISearchIssueResponse[]) => {
    if (data.length === 0) {
      setToastAlert({
        title: "Error",
        type: "error",
        message: "Please select at least one issue",
      });

      return;
    }

    const selectedIssues: { blocked_issue_detail: BlockeIssueDetail }[] = data.map((i) => ({
      blocked_issue_detail: {
        id: i.id,
        name: i.name,
        sequence_id: i.sequence_id,
        project_detail: {
          id: i.project_id,
          identifier: i.project__identifier,
          name: i.project__name,
        },
      },
    }));

    const newBlocked = [...watch("blocked_issues"), ...selectedIssues];

    submitChanges({
      blocked_issues: newBlocked,
      blocks_list: newBlocked.map((i) => i.blocked_issue_detail?.id ?? ""),
    });
    handleClose();
  };

  return (
    <>
      <ExistingIssuesListModal
        isOpen={isBlockedModalOpen}
        handleClose={() => setIsBlockedModalOpen(false)}
        searchParams={{ blocker_blocked_by: true, issue_id: issueId }}
        handleOnSubmit={onSubmit}
        workspaceLevelToggle
      />
      <div className="flex flex-wrap items-start py-2">
        <div className="flex items-center gap-x-2 text-sm text-custom-text-200 sm:basis-1/2">
          <BlockedIcon height={16} width={16} />
          <p>Blocked by</p>
        </div>
        <div className="space-y-1 sm:basis-1/2">
          <div className="flex flex-wrap gap-1">
            {watch("blocked_issues") && watch("blocked_issues").length > 0
              ? watch("blocked_issues").map((issue) => (
                  <div
                    key={issue.blocked_issue_detail?.id}
                    className="group flex cursor-pointer items-center gap-1 rounded-2xl border border-custom-border-200 px-1.5 py-0.5 text-xs text-red-500 duration-300 hover:border-red-500/20 hover:bg-red-500/20"
                  >
                    <a
                      href={`/${workspaceSlug}/projects/${issue.blocked_issue_detail?.project_detail.id}/issues/${issue.blocked_issue_detail?.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1"
                    >
                      <BlockedIcon height={10} width={10} />
                      {`${issue.blocked_issue_detail?.project_detail.identifier}-${issue.blocked_issue_detail?.sequence_id}`}
                    </a>
                    <button
                      type="button"
                      className="opacity-0 duration-300 group-hover:opacity-100"
                      onClick={() => {
                        const updatedBlocked = watch("blocked_issues").filter(
                          (i) => i.blocked_issue_detail?.id !== issue.blocked_issue_detail?.id
                        );

                        submitChanges({
                          blocked_issues: updatedBlocked,
                          blocks_list: updatedBlocked.map((i) => i.blocked_issue_detail?.id ?? ""),
                        });
                      }}
                    >
                      <XMarkIcon className="h-2 w-2" />
                    </button>
                  </div>
                ))
              : null}
          </div>
          <button
            type="button"
            className={`bg-custom-background-80 text-xs text-custom-text-200 rounded px-2.5 py-0.5 ${
              disabled ? "cursor-not-allowed" : "cursor-pointer hover:bg-custom-background-80"
            }`}
            onClick={() => setIsBlockedModalOpen(true)}
            disabled={disabled}
          >
            Select issues
          </button>
        </div>
      </div>
    </>
  );
};
