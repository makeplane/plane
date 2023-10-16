import React, { useState } from "react";
import { useRouter } from "next/router";
import useSWR, { mutate } from "swr";

// icons
import { X, PlusIcon } from "lucide-react";
// services
import { IssueService } from "services/issue";
// fetch key
import { SUB_ISSUES } from "constants/fetch-keys";
// hooks
import useUser from "hooks/use-user";
// ui
import { Spinner } from "components/ui";
// components
import { Label, IssuesSelectBottomSheet, DeleteConfirmation } from "components/web-view";
// types
import { IIssue, ISearchIssueResponse } from "types";

type Props = {
  issueDetails?: IIssue;
};

// services
const issueService = new IssueService();

export const SubIssueList: React.FC<Props> = (props) => {
  const { issueDetails } = props;

  const router = useRouter();
  const { workspaceSlug, projectId, issueId } = router.query;

  const isArchive = Boolean(router.query.archive);

  const [isBottomSheetOpen, setIsBottomSheetOpen] = useState(false);
  const [issueSelectedForDelete, setIssueSelectedForDelete] = useState<IIssue | null>(null);

  const { user } = useUser();

  const { data: subIssuesResponse } = useSWR(
    workspaceSlug && issueDetails ? SUB_ISSUES(issueDetails.id) : null,
    workspaceSlug && issueDetails
      ? () => issueService.subIssues(workspaceSlug as string, issueDetails.project, issueDetails.id)
      : null
  );

  const handleSubIssueRemove = (issue: IIssue | null) => {
    if (!workspaceSlug || !issueDetails || !user || !issue) return;

    mutate(
      SUB_ISSUES(issueDetails.id),
      (prevData) => {
        if (!prevData) return prevData;

        const stateDistribution = { ...prevData.state_distribution };

        const issueGroup = issue.state_detail.group;
        stateDistribution[issueGroup] = stateDistribution[issueGroup] - 1;

        return {
          state_distribution: stateDistribution,
          sub_issues: prevData.sub_issues.filter((i: any) => i.id !== issue.id),
        };
      },
      false
    );

    issueService
      .patchIssue(workspaceSlug.toString(), issue.project, issue.id, { parent: null }, user)
      .finally(() => mutate(SUB_ISSUES(issueDetails.id)));
  };

  const addAsSubIssueFromExistingIssues = async (data: ISearchIssueResponse[]) => {
    if (!workspaceSlug || !projectId || !issueId || isArchive) return;

    const payload = {
      sub_issue_ids: data.map((i) => i.id),
    };
    await issueService
      .addSubIssues(workspaceSlug.toString(), projectId.toString(), issueId.toString(), payload)
      .finally(() => {
        mutate(SUB_ISSUES(issueId.toString()));
      });
  };

  return (
    <div>
      <IssuesSelectBottomSheet
        isOpen={isBottomSheetOpen}
        onClose={() => setIsBottomSheetOpen(false)}
        onSubmit={addAsSubIssueFromExistingIssues}
        searchParams={{ sub_issue: true, issue_id: issueId as string }}
      />

      <DeleteConfirmation
        title="Remove sub issue"
        content="Are you sure you want to remove this sub issue?"
        isOpen={!!issueSelectedForDelete}
        onCancel={() => setIssueSelectedForDelete(null)}
        onConfirm={() => {
          if (isArchive) return;
          setIssueSelectedForDelete(null);
          handleSubIssueRemove(issueSelectedForDelete);
        }}
      />

      <Label>Sub Issues</Label>
      <div className="p-3 border border-custom-border-200 rounded-[4px]">
        {!subIssuesResponse && (
          <div className="flex justify-center items-center">
            <Spinner />
            Loading...
          </div>
        )}

        {subIssuesResponse?.sub_issues.length === 0 && (
          <div className="flex justify-center items-center">
            <p className="text-sm text-custom-text-200">No sub issues</p>
          </div>
        )}

        {subIssuesResponse?.sub_issues?.map((subIssue) => (
          <div key={subIssue.id} className="flex items-center justify-between gap-2 py-2">
            <div className="flex items-center">
              <p className="mr-3 text-sm text-custom-text-300">
                {subIssue.project_detail.identifier}-{subIssue.sequence_id}
              </p>
              <p className="text-sm font-normal">{subIssue.name}</p>
            </div>
            <button
              type="button"
              disabled={isArchive}
              onClick={() => {
                if (isArchive) return;
                setIssueSelectedForDelete(subIssue);
              }}
            >
              <X className="w-[18px] h-[18px] text-custom-text-400" />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        disabled={isArchive}
        onClick={() => setIsBottomSheetOpen(true)}
        className="flex items-center gap-x-1 mt-3"
      >
        <PlusIcon className="w-[18px] h-[18px] text-custom-text-400" />
        <p className="text-sm text-custom-text-400">Add sub issue</p>
      </button>
    </div>
  );
};
