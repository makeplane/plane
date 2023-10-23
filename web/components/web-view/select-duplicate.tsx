import React, { useState } from "react";
import { useRouter } from "next/router";
import { mutate } from "swr";

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
import { BlockeIssueDetail, ISearchIssueResponse } from "types";

type Props = {
  disabled?: boolean;
};

// services
const issueService = new IssueService();

export const DuplicateSelect: React.FC<Props> = (props) => {
  const { disabled = false } = props;

  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);

  const router = useRouter();
  const { workspaceSlug, projectId, issueId } = router.query;

  const { user } = useUser();

  const onSubmit = async (data: ISearchIssueResponse[]) => {
    if (!workspaceSlug || !projectId || !issueId || !user || disabled) return;

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

    if (!user) return;

    issueService
      .createIssueRelation(workspaceSlug.toString(), projectId.toString(), issueId.toString(), user, {
        related_list: [
          ...selectedIssues.map((issue) => ({
            issue: issueId as string,
            issue_detail: issue.blocker_issue_detail,
            related_issue: issue.blocker_issue_detail.id,
            relation_type: "duplicate" as const,
          })),
        ],
      })
      .then(() => {
        mutate(ISSUE_DETAILS(issueId as string));
        mutate(PROJECT_ISSUES_ACTIVITY(issueId as string));
      });

    setIsBottomSheetOpen(false);
  };

  return (
    <>
      <IssuesSelectBottomSheet
        isOpen={isBottomSheetOpen}
        onClose={() => setIsBottomSheetOpen(false)}
        onSubmit={onSubmit}
        searchParams={{ issue_relation: true }}
      />

      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsBottomSheetOpen(true)}
        className={"relative w-full px-2.5 py-0.5 text-base flex justify-between items-center gap-0.5"}
      >
        <span className="text-custom-text-200">Select issue</span>
        <ChevronDown className="w-4 h-4 text-custom-text-200" />
      </button>
    </>
  );
};
