// react
import React from "react";

// next
import { useRouter } from "next/router";

// swr
import useSWR, { mutate } from "swr";

// icons
import { XMarkIcon } from "@heroicons/react/24/outline";

// services
import issuesService from "services/issues.service";

// fetch key
import { SUB_ISSUES } from "constants/fetch-keys";

// hooks
import useUser from "hooks/use-user";

// ui
import { Spinner } from "components/ui";
import { IIssue } from "types";

// components
import { Label } from "components/web-view";

type Props = {
  issueDetails?: IIssue;
};

export const SubIssueList: React.FC<Props> = (props) => {
  const { issueDetails } = props;

  const router = useRouter();
  const { workspaceSlug } = router.query;

  const { user } = useUser();

  const { data: subIssuesResponse } = useSWR(
    workspaceSlug && issueDetails ? SUB_ISSUES(issueDetails.id) : null,
    workspaceSlug && issueDetails
      ? () =>
          issuesService.subIssues(workspaceSlug as string, issueDetails.project, issueDetails.id)
      : null
  );

  const handleSubIssueRemove = (issue: any) => {
    if (!workspaceSlug || !issueDetails || !user) return;

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

    issuesService
      .patchIssue(workspaceSlug.toString(), issue.project, issue.id, { parent: null }, user)
      .finally(() => mutate(SUB_ISSUES(issueDetails.id)));
  };

  return (
    <div>
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
            <button type="button" onClick={() => handleSubIssueRemove(subIssue)}>
              <XMarkIcon className="w-5 h-5 text-custom-text-200" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};
