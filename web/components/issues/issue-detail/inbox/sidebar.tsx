import React from "react";
// import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import { CalendarDays, Signal, Tag } from "lucide-react";
// hooks
import { useIssueDetail, useProject } from "hooks/store";
// components
import { IssueLabel, TIssueOperations } from "components/issues";
import { PriorityDropdown, ProjectMemberDropdown, StateDropdown } from "components/dropdowns";
// ui
import { CustomDatePicker } from "components/ui";
// icons
import { DoubleCircleIcon, StateGroupIcon, UserGroupIcon } from "@plane/ui";
// types

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  issueOperations: TIssueOperations;
  is_editable: boolean;
};

export const InboxIssueDetailsSidebar: React.FC<Props> = observer((props) => {
  const { workspaceSlug, projectId, issueId, issueOperations, is_editable } = props;
  // router
  // FIXME: Check if we need this. Previously it was used to render Project Identifier conditionally.
  // const router = useRouter();
  // const { inboxIssueId } = router.query;
  // store hooks
  const { getProjectById } = useProject();
  const {
    issue: { getIssueById },
  } = useIssueDetail();

  const issue = getIssueById(issueId);
  if (!issue) return <></>;

  const projectDetails = issue ? getProjectById(issue.project_id) : null;

  const minDate = issue.start_date ? new Date(issue.start_date) : null;
  minDate?.setDate(minDate.getDate());

  return (
    <div className="flex h-full w-full flex-col divide-y-2 divide-custom-border-200 overflow-hidden">
      <div className="flex items-center justify-between px-5 pb-3">
        <div className="flex items-center gap-x-2">
          <StateGroupIcon className="h-4 w-4" stateGroup="backlog" color="#ff7700" />
          <h4 className="text-lg font-medium text-custom-text-300">
            {projectDetails?.identifier}-{issue?.sequence_id}
          </h4>
        </div>
      </div>

      <div className="h-full w-full overflow-y-auto px-5">
        <div className={`divide-y-2 divide-custom-border-200 ${!is_editable ? "opacity-60" : ""}`}>
          <div className="py-1">
            {/* State */}
            <div className="flex flex-wrap items-center py-2">
              <div className="flex items-center gap-x-2 text-sm text-custom-text-200 sm:w-1/2">
                <DoubleCircleIcon className="h-4 w-4 flex-shrink-0" />
                <p>State</p>
              </div>
              <div className="h-5 sm:w-1/2">
                <StateDropdown
                  value={issue?.state_id ?? undefined}
                  onChange={(val) => issueOperations.update(workspaceSlug, projectId, issueId, { state_id: val })}
                  projectId={projectId?.toString() ?? ""}
                  disabled={!is_editable}
                  buttonVariant="background-with-text"
                />
              </div>
            </div>
            {/* Assignee */}
            <div className="flex flex-wrap items-center py-2">
              <div className="flex items-center gap-x-2 text-sm text-custom-text-200 sm:w-1/2">
                <UserGroupIcon className="h-4 w-4 flex-shrink-0" />
                <p>Assignees</p>
              </div>
              <div className="h-5 sm:w-1/2">
                <ProjectMemberDropdown
                  value={issue?.assignee_ids ?? undefined}
                  onChange={(val) => issueOperations.update(workspaceSlug, projectId, issueId, { assignee_ids: val })}
                  disabled={!is_editable}
                  projectId={projectId?.toString() ?? ""}
                  placeholder="Assignees"
                  multiple
                  buttonVariant={issue?.assignee_ids?.length > 0 ? "transparent-without-text" : "background-with-text"}
                  buttonClassName={issue?.assignee_ids?.length > 0 ? "hover:bg-transparent px-0" : ""}
                />
              </div>
            </div>
            {/* Priority */}
            <div className="flex flex-wrap items-center py-2">
              <div className="flex items-center gap-x-2 text-sm text-custom-text-200 sm:w-1/2">
                <Signal className="h-4 w-4 flex-shrink-0" />
                <p>Priority</p>
              </div>
              <div className="h-5 sm:w-1/2">
                <PriorityDropdown
                  value={issue?.priority || undefined}
                  onChange={(val) => issueOperations.update(workspaceSlug, projectId, issueId, { priority: val })}
                  disabled={!is_editable}
                  buttonVariant="background-with-text"
                />
              </div>
            </div>
          </div>
        </div>
        <div className={`divide-y-2 divide-custom-border-200 ${!is_editable ? "opacity-60" : ""}`}>
          <div className="py-1">
            {/* Due Date */}
            <div className="flex flex-wrap items-center py-2">
              <div className="flex items-center gap-x-2 text-sm text-custom-text-200 sm:basis-1/2">
                <CalendarDays className="h-4 w-4 flex-shrink-0" />
                <p>Due date</p>
              </div>
              <div className="sm:basis-1/2">
                <CustomDatePicker
                  placeholder="Due date"
                  value={issue.target_date || undefined}
                  onChange={(val) => issueOperations.update(workspaceSlug, projectId, issueId, { target_date: val })}
                  className="border-none bg-custom-background-80"
                  minDate={minDate ?? undefined}
                  disabled={!is_editable}
                />
              </div>
            </div>
            {/* Labels */}
            <div className={`flex flex-wrap items-start py-2 ${!is_editable ? "opacity-60" : ""}`}>
              <div className="flex items-center gap-x-2 text-sm text-custom-text-200 sm:w-1/2">
                <Tag className="h-4 w-4 flex-shrink-0" />
                <p>Label</p>
              </div>
              <div className="space-y-1 sm:w-1/2">
                <IssueLabel
                  workspaceSlug={workspaceSlug}
                  projectId={projectId}
                  issueId={issueId}
                  disabled={!is_editable}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});
