import React, { useState } from "react";

import { useRouter } from "next/router";
// react-hook-form
import { UseFormWatch } from "react-hook-form";
// hooks
import useToast from "hooks/use-toast";
import useUser from "hooks/use-user";
// services
import { IssueService } from "services/issue";
// components
import { ExistingIssuesListModal } from "components/core";
// icons
import { XMarkIcon } from "@heroicons/react/24/outline";
import { BlockedIcon } from "components/icons";
// types
import { BlockeIssueDetail, IIssue, ISearchIssueResponse } from "types";

type Props = {
  issueId?: string;
  submitChanges: (formData: Partial<IIssue>) => void;
  watch: UseFormWatch<IIssue>;
  disabled?: boolean;
};

// services
const issueService = new IssueService();

export const SidebarBlockedSelect: React.FC<Props> = ({ issueId, submitChanges, watch, disabled = false }) => {
  const [isBlockedModalOpen, setIsBlockedModalOpen] = useState(false);

  const { user } = useUser();
  const { setToastAlert } = useToast();

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const handleClose = () => {
    setIsBlockedModalOpen(false);
  };

  const blockedByIssue = watch("related_issues")?.filter((i) => i.relation_type === "blocked_by") || [];

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

    if (!user) return;

    issueService
      .createIssueRelation(workspaceSlug as string, projectId as string, issueId as string, user, {
        related_list: [
          ...selectedIssues.map((issue) => ({
            issue: issueId as string,
            relation_type: "blocked_by" as const,
            issue_detail: issue.blocked_issue_detail,
            related_issue: issue.blocked_issue_detail.id,
          })),
        ],
      })
      .then((response) => {
        submitChanges({
          related_issues: [...watch("related_issues"), ...response],
        });
      });

    handleClose();
  };

  return (
    <>
      <ExistingIssuesListModal
        isOpen={isBlockedModalOpen}
        handleClose={() => setIsBlockedModalOpen(false)}
        searchParams={{ issue_relation: true, issue_id: issueId }}
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
            {blockedByIssue && blockedByIssue.length > 0
              ? blockedByIssue.map((relation) => (
                  <div
                    key={relation?.id}
                    className="group flex cursor-pointer items-center gap-1 rounded-2xl border border-custom-border-200 px-1.5 py-0.5 text-xs text-red-500 duration-300 hover:border-red-500/20 hover:bg-red-500/20"
                  >
                    <a
                      href={`/${workspaceSlug}/projects/${relation.issue_detail?.project_detail.id}/issues/${relation.issue_detail?.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1"
                    >
                      <BlockedIcon height={10} width={10} />
                      {`${relation.issue_detail?.project_detail.identifier}-${relation.issue_detail?.sequence_id}`}
                    </a>
                    <button
                      type="button"
                      className="opacity-0 duration-300 group-hover:opacity-100"
                      onClick={() => {
                        const updatedRelations = watch("related_issues")?.filter((i) => i.id !== relation.id);

                        submitChanges({
                          related_issues: updatedRelations,
                        });

                        if (!user) return;

                        issueService.deleteIssueRelation(
                          workspaceSlug as string,
                          projectId as string,
                          issueId as string,
                          relation.id,
                          user
                        );
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
