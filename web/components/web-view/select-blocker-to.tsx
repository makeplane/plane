// react
import React, { useState } from "react";
import { useRouter } from "next/router";
import { mutate } from "swr";
import { useFormContext } from "react-hook-form";

// services
import { IssueService } from "services/issue";
// hooks
import useUser from "hooks/use-user";
// fetch keys
import { ISSUE_DETAILS, PROJECT_ISSUES_ACTIVITY } from "constants/fetch-keys";
// icons
import { ChevronDown } from "lucide-react";
// components
import { IssuesSelectBottomSheet } from "components/web-view";
// types
import { BlockeIssueDetail, ISearchIssueResponse, IIssue } from "types";

type Props = {
  disabled?: boolean;
};

// services
const issueService = new IssueService();

export const BlockerSelect: React.FC<Props> = (props) => {
  const { disabled = false } = props;

  const [isBlockerModalOpen, setIsBlockerModalOpen] = useState(false);

  const router = useRouter();
  const { workspaceSlug, projectId, issueId } = router.query;

  const { watch } = useFormContext<IIssue>();

  const { user } = useUser();

  const onSubmit = async (data: ISearchIssueResponse[]) => {
    if (disabled) return;

    if (data.length === 0)
      return console.log(
        "toast",
        JSON.stringify({
          type: "error",
          message: "Please select at least one issue.",
        })
      );

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

    if (!workspaceSlug || !projectId || !issueId || !user) return;

    const blockerIssue = watch("issue_relations")?.filter((i) => i.relation_type === "blocked_by") || [];

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
        mutate(ISSUE_DETAILS(issueId as string), (prevData) => {
          if (!prevData) return prevData;
          return {
            ...prevData,
            issue_relations: [
              ...blockerIssue,
              ...(response ?? []).map((i: any) => ({
                id: i.id,
                relation_type: i.relation_type,
                issue_detail: i.issue_detail,
                issue: i.related_issue,
              })),
            ],
          };
        });
        mutate(PROJECT_ISSUES_ACTIVITY(issueId as string));
      });

    setIsBlockerModalOpen(false);
  };

  return (
    <>
      <IssuesSelectBottomSheet
        isOpen={isBlockerModalOpen}
        onClose={() => setIsBlockerModalOpen(false)}
        onSubmit={onSubmit}
        searchParams={{ issue_relation: true }}
      />

      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsBlockerModalOpen(true)}
        className={"relative w-full px-2.5 py-0.5 text-base flex justify-between items-center gap-0.5"}
      >
        <span className="text-custom-text-200">Select issue</span>
        <ChevronDown className="w-4 h-4 text-custom-text-200" />
      </button>
    </>
  );
};
