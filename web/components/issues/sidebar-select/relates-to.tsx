import React, { useState } from "react";

import { useRouter } from "next/router";
// react-hook-form
import { UseFormWatch } from "react-hook-form";
// hooks
import useToast from "hooks/use-toast";
import useUser from "hooks/use-user";
// icons
import { X } from "lucide-react";
import { BlockerIcon, RelatedIcon } from "components/icons";
// components
import { ExistingIssuesListModal } from "components/core";
// services
import { IssueService } from "services/issue";
// types
import { BlockeIssueDetail, IIssue, ISearchIssueResponse } from "types";

type Props = {
  issueId?: string;
  submitChanges: (formData?: Partial<IIssue>) => void;
  watch: UseFormWatch<IIssue>;
  disabled?: boolean;
};

// services
const issueService = new IssueService();

export const SidebarRelatesSelect: React.FC<Props> = (props) => {
  const { issueId, submitChanges, watch, disabled = false } = props;

  const [isRelatesToModalOpen, setIsRelatesToModalOpen] = useState(false);

  const { user } = useUser();
  const { setToastAlert } = useToast();

  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const handleClose = () => {
    setIsRelatesToModalOpen(false);
  };

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
            issue: issueId as string,
            issue_detail: issue.blocker_issue_detail,
            related_issue: issue.blocker_issue_detail.id,
            relation_type: "relates_to" as const,
          })),
        ],
      })
      .then(() => {
        submitChanges();
      });

    handleClose();
  };

  const relatedToIssueRelation = [
    ...(watch("related_issues")?.filter((i) => i.relation_type === "relates_to") ?? []),
    ...(watch("issue_relations") ?? [])
      ?.filter((i) => i.relation_type === "relates_to")
      .map((i) => ({
        ...i,
        issue_detail: i.issue_detail,
        related_issue: i.issue_detail?.id,
      })),
  ];

  return (
    <>
      <ExistingIssuesListModal
        isOpen={isRelatesToModalOpen}
        handleClose={() => setIsRelatesToModalOpen(false)}
        searchParams={{ issue_relation: true, issue_id: issueId }}
        handleOnSubmit={onSubmit}
        workspaceLevelToggle
      />
      <div className="flex flex-wrap items-start py-2">
        <div className="flex items-center gap-x-2 text-sm text-custom-text-200 sm:basis-1/2">
          <RelatedIcon className="h-4 w-4 flex-shrink-0" />
          <p>Relates to</p>
        </div>
        <div className="space-y-1 sm:basis-1/2">
          <div className="flex flex-wrap gap-1">
            {relatedToIssueRelation && relatedToIssueRelation.length > 0
              ? relatedToIssueRelation.map((relation) => (
                  <div
                    key={relation.issue_detail?.id}
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
                        if (!user) return;

                        issueService
                          .deleteIssueRelation(
                            workspaceSlug as string,
                            projectId as string,
                            issueId as string,
                            relation.id,
                            user
                          )
                          .then(() => {
                            submitChanges();
                          });
                      }}
                    >
                      <X className="h-2 w-2" />
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
            onClick={() => setIsRelatesToModalOpen(true)}
            disabled={disabled}
          >
            Select issues
          </button>
        </div>
      </div>
    </>
  );
};
