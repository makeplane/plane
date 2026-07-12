/**
 * Copyright (c) 2023-present Plane Software, Inc. and contributors
 * SPDX-License-Identifier: AGPL-3.0-only
 * See the LICENSE file for details.
 */

import { observer } from "mobx-react";
import useSWR from "swr";
import { X } from "lucide-react";
// plane imports
import { useTranslation } from "@plane/i18n";
import { TOAST_TYPE, setToast } from "@plane/propel/toast";
import { Tooltip } from "@plane/propel/tooltip";
import { Loader } from "@plane/ui";
// hooks
import { useIssueDetail } from "@/hooks/store/use-issue-detail";
import { useMilestone } from "@/hooks/store/use-milestone";
import { useProject } from "@/hooks/store/use-project";

type Props = {
  workspaceSlug: string;
  projectId: string;
  milestoneId: string;
  disabled?: boolean;
};

export const MilestoneIssuesList = observer(function MilestoneIssuesList(props: Props) {
  const { workspaceSlug, projectId, milestoneId, disabled = false } = props;
  // plane hooks
  const { t } = useTranslation();
  // store hooks
  const { getMilestoneIssuesByMilestoneId, fetchMilestoneIssues, removeIssueFromMilestone } = useMilestone();
  const { getProjectIdentifierById } = useProject();
  const {
    issue: { getIssueById },
  } = useIssueDetail();
  // fetch milestone work item links
  const { isLoading } = useSWR(
    `MILESTONE_ISSUES_${milestoneId}`,
    () => fetchMilestoneIssues(workspaceSlug, projectId, milestoneId),
    { revalidateIfStale: false, revalidateOnFocus: false }
  );
  // derived values
  const milestoneIssues = getMilestoneIssuesByMilestoneId(milestoneId);
  const projectIdentifier = getProjectIdentifierById(projectId);

  const handleRemove = async (issueId: string) => {
    try {
      await removeIssueFromMilestone(workspaceSlug, projectId, milestoneId, issueId);
      setToast({
        type: TOAST_TYPE.SUCCESS,
        title: "Success!",
        message: "Work item removed from the milestone.",
      });
    } catch {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Work item could not be removed from the milestone. Please try again.",
      });
    }
  };

  if (isLoading && milestoneIssues.length === 0)
    return (
      <Loader className="space-y-2 p-2">
        <Loader.Item height="24px" />
        <Loader.Item height="24px" />
      </Loader>
    );

  if (milestoneIssues.length === 0)
    return <p className="px-3 py-2 text-12 text-tertiary">{t("milestone_work_items_empty_state")}</p>;

  return (
    <div className="divide-y divide-subtle-1">
      {milestoneIssues.map((milestoneIssue) => {
        // the API may expand the work item inline; fall back to the issue store
        const workItemDetail = milestoneIssue.issue_detail ?? getIssueById(milestoneIssue.issue);
        const sequenceId = workItemDetail?.sequence_id;
        return (
          <div key={milestoneIssue.id} className="group flex items-center gap-2 px-3 py-1.5">
            {sequenceId !== undefined && (
              <span className="flex-shrink-0 text-11 font-medium text-tertiary">
                {projectIdentifier ? `${projectIdentifier}-${sequenceId}` : sequenceId}
              </span>
            )}
            <span className="truncate text-13 text-secondary">{workItemDetail?.name ?? milestoneIssue.issue}</span>
            {!disabled && (
              <Tooltip tooltipContent={t("common.remove")} position="top">
                <button
                  type="button"
                  className="ml-auto flex-shrink-0 rounded p-0.5 text-tertiary opacity-0 group-hover:opacity-100 hover:bg-layer-transparent-hover hover:text-secondary"
                  onClick={() => void handleRemove(milestoneIssue.issue)}
                >
                  <X className="size-3.5" />
                </button>
              </Tooltip>
            )}
          </div>
        );
      })}
    </div>
  );
});
