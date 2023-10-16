import React, { useState } from "react";

import { useRouter } from "next/router";

// react-hook-form
import { UseFormWatch } from "react-hook-form";
// hooks
import useToast from "hooks/use-toast";
import useUser from "hooks/use-user";
// components
import { ExistingIssuesListModal } from "components/core";
// services
import { IssueService } from "services/issue";
// icons
import { XMarkIcon } from "@heroicons/react/24/outline";
import { BlockerIcon } from "components/icons";
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

export const SidebarBlockerSelect: React.FC<Props> = ({ issueId, submitChanges, watch, disabled = false }) => {
  const [isBlockerModalOpen, setIsBlockerModalOpen] = useState(false);

  const { user } = useUser();
  const { setToastAlert } = useToast();

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const handleClose = () => {
    setIsBlockerModalOpen(false);
  };

  const blockerIssue = watch("issue_relations")?.filter((i) => i.relation_type === "blocked_by") || [];

  const onSubmit = async (data: ISearchIssueResponse[]) => {
    if (data.length === 0) {
      setToastAlert({
        type: "error",
        title: "Error!",
        message: "Please select at least one issue.",
      });

      return;
    }

    const selectedIssues: { blocker_issue_detail: BlockeIssueDetail }[] = data.map((i) => ({
      blocker_issue_detail: {
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
            issue: issue.blocker_issue_detail.id,
            relation_type: "blocked_by" as const,
            related_issue: issueId as string,
            related_issue_detail: issue.blocker_issue_detail,
          })),
        ],
        relation: "blocking",
      })
      .then((response) => {
        submitChanges({
          issue_relations: [
            ...blockerIssue,
            ...(response ?? []).map((i: any) => ({
              id: i.id,
              relation_type: i.relation_type,
              issue_detail: i.issue_detail,
              issue: i.related_issue,
            })),
          ],
        });
      });

    handleClose();
  };

  return (
    <>
      <ExistingIssuesListModal
        isOpen={isBlockerModalOpen}
        handleClose={() => setIsBlockerModalOpen(false)}
        searchParams={{ issue_relation: true, issue_id: issueId }}
        handleOnSubmit={onSubmit}
        workspaceLevelToggle
      />
      <div className="flex flex-wrap items-start py-2">
        <div className="flex items-center gap-x-2 text-sm text-custom-text-200 sm:basis-1/2">
          <BlockerIcon height={16} width={16} />
          <p>Blocking</p>
        </div>
        <div className="space-y-1 sm:basis-1/2">
          <div className="flex flex-wrap gap-1">
            {blockerIssue && blockerIssue.length > 0
              ? blockerIssue.map((relation) => (
                  <div
                    key={relation.id}
                    className="group flex cursor-pointer items-center gap-1 rounded-2xl border border-custom-border-200 px-1.5 py-0.5 text-xs text-yellow-500 duration-300 hover:border-yellow-500/20 hover:bg-yellow-500/20"
                  >
                    <a
                      href={`/${workspaceSlug}/projects/${relation.issue_detail?.project_detail.id}/issues/${relation.issue_detail?.id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1"
                    >
                      <BlockerIcon height={10} width={10} />
                      {`${relation.issue_detail?.project_detail.identifier}-${relation.issue_detail?.sequence_id}`}
                    </a>
                    <button
                      type="button"
                      className="opacity-0 duration-300 group-hover:opacity-100"
                      onClick={() => {
                        const updatedBlockers = blockerIssue.filter((i) => i.id !== relation.id);

                        submitChanges({
                          issue_relations: updatedBlockers,
                        });

                        if (!user) return;

                        issueService.deleteIssueRelation(
                          workspaceSlug as string,
                          projectId as string,
                          relation.issue_detail?.id as string,
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
            onClick={() => setIsBlockerModalOpen(true)}
            disabled={disabled}
          >
            Select issues
          </button>
        </div>
      </div>
    </>
  );
};
