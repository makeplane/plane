import React, { useState } from "react";

import Link from "next/link";
import { useRouter } from "next/router";

// react-hook-form
import { UseFormWatch } from "react-hook-form";
// hooks
import useToast from "hooks/use-toast";
import useProjectDetails from "hooks/use-project-details";
// components
import { ExistingIssuesListModal } from "components/core";
// icons
import { XMarkIcon } from "@heroicons/react/24/outline";
import { BlockedIcon } from "components/icons";
// types
import { BlockeIssue, IIssue, ISearchIssueResponse, UserAuth } from "types";

type Props = {
  issueId?: string;
  submitChanges: (formData: Partial<IIssue>) => void;
  watch: UseFormWatch<IIssue>;
  userAuth: UserAuth;
};

export const SidebarBlockedSelect: React.FC<Props> = ({
  issueId,
  submitChanges,
  watch,
  userAuth,
}) => {
  const [isBlockedModalOpen, setIsBlockedModalOpen] = useState(false);

  const { setToastAlert } = useToast();
  const { projectDetails } = useProjectDetails();

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

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

    const selectedIssues: BlockeIssue[] = data.map((i) => ({
      blocked_issue_detail: {
        id: i.id,
        name: i.name,
        sequence_id: i.sequence_id,
      },
    }));

    const newBlocked = [...watch("blocked_issues"), ...selectedIssues];

    submitChanges({
      blocked_issues: newBlocked,
      blocks_list: newBlocked.map((i) => i.blocked_issue_detail?.id ?? ""),
    });
    handleClose();
  };

  const isNotAllowed = userAuth.isGuest || userAuth.isViewer;

  return (
    <>
      <ExistingIssuesListModal
        isOpen={isBlockedModalOpen}
        handleClose={() => setIsBlockedModalOpen(false)}
        searchParams={{ blocker_blocked_by: true, issue_id: issueId }}
        handleOnSubmit={onSubmit}
      />
      <div className="flex flex-wrap items-start py-2">
        <div className="flex items-center gap-x-2 text-sm text-brand-secondary sm:basis-1/2">
          <BlockedIcon height={16} width={16} />
          <p>Blocked by</p>
        </div>
        <div className="space-y-1 sm:basis-1/2">
          <div className="flex flex-wrap gap-1">
            {watch("blocked_issues") && watch("blocked_issues").length > 0
              ? watch("blocked_issues").map((issue) => (
                  <div
                    key={issue.blocked_issue_detail?.id}
                    className="group flex cursor-pointer items-center gap-1 rounded-2xl border border-brand-base px-1.5 py-0.5 text-xs text-red-500 duration-300 hover:border-red-500/20 hover:bg-red-500/20"
                  >
                    <Link
                      href={`/${workspaceSlug}/projects/${projectId}/issues/${issue.blocked_issue_detail?.id}`}
                    >
                      <a className="flex items-center gap-1">
                        <BlockedIcon height={10} width={10} />
                        {`${projectDetails?.identifier}-${issue.blocked_issue_detail?.sequence_id}`}
                      </a>
                    </Link>
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
            className={`flex w-full text-brand-secondary ${
              isNotAllowed ? "cursor-not-allowed" : "cursor-pointer hover:bg-brand-surface-2"
            } items-center justify-between gap-1 rounded-md border border-brand-base px-2 py-1 text-xs shadow-sm duration-300 focus:outline-none`}
            onClick={() => setIsBlockedModalOpen(true)}
            disabled={isNotAllowed}
          >
            Select issues
          </button>
        </div>
      </div>
    </>
  );
};
