import React from "react";
import { observer } from "mobx-react-lite";
import { CalendarCheck2, Signal, Tag } from "lucide-react";
// hooks
import { useIssueDetail, useProject, useProjectState } from "hooks/store";
// components
import { IssueLabel, TIssueOperations } from "components/issues";
import { DateDropdown, PriorityDropdown, ProjectMemberDropdown, StateDropdown } from "components/dropdowns";
// icons
import { DoubleCircleIcon, StateGroupIcon, UserGroupIcon } from "@plane/ui";
// helper
import { renderFormattedPayloadDate } from "helpers/date-time.helper";

type Props = {
  workspaceSlug: string;
  projectId: string;
  issueId: string;
  issueOperations: TIssueOperations;
  is_editable: boolean;
};

export const InboxIssueDetailsSidebar: React.FC<Props> = observer((props) => {
  const { workspaceSlug, projectId, issueId, issueOperations, is_editable } = props;
  // store hooks
  const { getProjectById } = useProject();
  const { projectStates } = useProjectState();
  const {
    issue: { getIssueById },
  } = useIssueDetail();

  const issue = getIssueById(issueId);
  if (!issue) return <></>;

  const projectDetails = issue ? getProjectById(issue.project_id) : null;

  const minDate = issue.start_date ? new Date(issue.start_date) : null;
  minDate?.setDate(minDate.getDate());

  const currentIssueState = projectStates?.find((s) => s.id === issue.state_id);

  return (
    <div className="flex h-full w-full flex-col divide-y-2 divide-custom-border-200 overflow-hidden">
      <div className="flex items-center justify-between px-5 pb-3">
        <div className="flex items-center gap-x-2">
          {currentIssueState && (
            <StateGroupIcon className="h-4 w-4" stateGroup={currentIssueState.group} color={currentIssueState.color} />
          )}
          <h4 className="text-lg font-medium text-custom-text-300">
            {projectDetails?.identifier}-{issue?.sequence_id}
          </h4>
        </div>
      </div>

      <div className="h-full w-full overflow-y-auto px-5">
        <h5 className="text-sm font-medium my-4">Properties</h5>
        <div className={`divide-y-2 divide-custom-border-200 ${!is_editable ? "opacity-60" : ""}`}>
          <div className="flex flex-col gap-3">
            {/* State */}
            <div className="flex items-center gap-2 h-8">
              <div className="flex items-center gap-1 w-2/5 flex-shrink-0 text-sm text-custom-text-300">
                <DoubleCircleIcon className="h-4 w-4 flex-shrink-0" />
                <span>State</span>
              </div>
              <StateDropdown
                value={issue?.state_id ?? undefined}
                onChange={(val) => issueOperations.update(workspaceSlug, projectId, issueId, { state_id: val })}
                projectId={projectId?.toString() ?? ""}
                disabled={!is_editable}
                buttonVariant="transparent-with-text"
                className="w-3/5 flex-grow group"
                buttonContainerClassName="w-full text-left"
                buttonClassName="text-sm"
                dropdownArrow
                dropdownArrowClassName="h-3.5 w-3.5 hidden group-hover:inline"
              />
            </div>
            {/* Assignee */}
            <div className="flex items-center gap-2 h-8">
              <div className="flex items-center gap-1 w-2/5 flex-shrink-0 text-sm text-custom-text-300">
                <UserGroupIcon className="h-4 w-4 flex-shrink-0" />
                <span>Assignees</span>
              </div>
              <ProjectMemberDropdown
                value={issue?.assignee_ids ?? undefined}
                onChange={(val) => issueOperations.update(workspaceSlug, projectId, issueId, { assignee_ids: val })}
                disabled={!is_editable}
                projectId={projectId?.toString() ?? ""}
                placeholder="Add assignees"
                multiple
                buttonVariant={issue?.assignee_ids?.length > 0 ? "transparent-without-text" : "transparent-with-text"}
                className="w-3/5 flex-grow group"
                buttonContainerClassName="w-full text-left"
                buttonClassName={`text-sm justify-between ${
                  issue?.assignee_ids.length > 0 ? "" : "text-custom-text-400"
                }`}
                hideIcon={issue.assignee_ids?.length === 0}
                dropdownArrow
                dropdownArrowClassName="h-3.5 w-3.5 hidden group-hover:inline"
              />
            </div>
            {/* Priority */}
            <div className="flex items-center gap-2 h-8">
              <div className="flex items-center gap-1 w-2/5 flex-shrink-0 text-sm text-custom-text-300">
                <Signal className="h-4 w-4 flex-shrink-0" />
                <span>Priority</span>
              </div>
              <PriorityDropdown
                value={issue?.priority || undefined}
                onChange={(val) => issueOperations.update(workspaceSlug, projectId, issueId, { priority: val })}
                disabled={!is_editable}
                buttonVariant="border-with-text"
                className="w-3/5 flex-grow rounded px-2 hover:bg-custom-background-80"
                buttonContainerClassName="w-full text-left"
                buttonClassName="w-min h-auto whitespace-nowrap"
              />
            </div>
          </div>
        </div>
        <div className={`divide-y-2 divide-custom-border-200 mt-3 ${!is_editable ? "opacity-60" : ""}`}>
          <div className="flex flex-col gap-3">
            {/* Due Date */}
            <div className="flex items-center gap-2 h-8">
              <div className="flex items-center gap-1 w-2/5 flex-shrink-0 text-sm text-custom-text-300">
                <CalendarCheck2 className="h-4 w-4 flex-shrink-0" />
                <span>Due date</span>
              </div>
              <DateDropdown
                placeholder="Add due date"
                value={issue.target_date}
                onChange={(val) =>
                  issueOperations.update(workspaceSlug, projectId, issueId, {
                    target_date: val ? renderFormattedPayloadDate(val) : null,
                  })
                }
                minDate={minDate ?? undefined}
                disabled={!is_editable}
                buttonVariant="transparent-with-text"
                className="w-3/5 flex-grow group"
                buttonContainerClassName="w-full text-left"
                buttonClassName={`text-sm ${issue?.target_date ? "" : "text-custom-text-400"}`}
                hideIcon
                clearIconClassName="h-3 w-3 hidden group-hover:inline"
              />
            </div>
            {/* Labels */}
            <div className="flex items-center gap-2 min-h-8">
              <div className="flex items-center gap-1 w-2/5 flex-shrink-0 text-sm text-custom-text-300">
                <Tag className="h-4 w-4 flex-shrink-0" />
                <span>Labels</span>
              </div>
              <div className="w-3/5 flex-grow min-h-8 h-full pt-1">
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
