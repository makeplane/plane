import { FC, useMemo } from "react";
import { useRouter } from "next/router";
import { observer } from "mobx-react-lite";
import { CalendarDays, Signal, Tag, Triangle, LayoutPanelTop } from "lucide-react";
// hooks
import { useIssueDetail, useProject, useUser } from "hooks/store";
// ui icons
import { DiceIcon, DoubleCircleIcon, UserGroupIcon, ContrastIcon } from "@plane/ui";
import { IssueLinkRoot, IssueCycleSelect, IssueModuleSelect, IssueParentSelect, IssueLabel } from "components/issues";
import { EstimateDropdown, PriorityDropdown, ProjectMemberDropdown, StateDropdown } from "components/dropdowns";
// components
import { CustomDatePicker } from "components/ui";
// types
import { TIssue, TIssuePriorities } from "@plane/types";
// constants
import { EUserProjectRoles } from "constants/project";

interface IPeekOverviewProperties {
  issue: TIssue;
  issueUpdate: (issue: Partial<TIssue>) => void;
  disableUserActions: boolean;
  issueOperations: any;
}

export const PeekOverviewProperties: FC<IPeekOverviewProperties> = observer((props) => {
  const { issue, issueUpdate, disableUserActions, issueOperations } = props;

  // store hooks
  const {
    membership: { currentProjectRole },
  } = useUser();
  const { currentUser } = useUser();
  const { getProjectById } = useProject();
  // router
  const router = useRouter();
  const { workspaceSlug, projectId } = router.query;

  const uneditable = currentProjectRole ? [5, 10].includes(currentProjectRole) : false;
  const isAllowed = !!currentProjectRole && currentProjectRole >= EUserProjectRoles.MEMBER;

  const handleState = (_state: string) => {
    issueUpdate({ ...issue, state_id: _state });
  };
  const handlePriority = (_priority: TIssuePriorities) => {
    issueUpdate({ ...issue, priority: _priority });
  };
  const handleAssignee = (_assignees: string[]) => {
    issueUpdate({ ...issue, assignee_ids: _assignees });
  };
  const handleEstimate = (_estimate: number | null) => {
    issueUpdate({ ...issue, estimate_point: _estimate });
  };
  const handleStartDate = (_startDate: string | null) => {
    issueUpdate({ ...issue, start_date: _startDate || undefined });
  };
  const handleTargetDate = (_targetDate: string | null) => {
    issueUpdate({ ...issue, target_date: _targetDate || undefined });
  };

  const projectDetails = getProjectById(issue.project_id);
  const isEstimateEnabled = projectDetails?.estimate;

  const minDate = issue.start_date ? new Date(issue.start_date) : null;
  minDate?.setDate(minDate.getDate());

  const maxDate = issue.target_date ? new Date(issue.target_date) : null;
  maxDate?.setDate(maxDate.getDate());

  return (
    <>
      <div className="flex flex-col">
        <div className="flex w-full flex-col gap-5 py-5">
          {/* state */}
          <div className="flex w-full items-center gap-2">
            <div className="flex w-40 flex-shrink-0 items-center gap-2 text-sm">
              <DoubleCircleIcon className="h-4 w-4 flex-shrink-0" />
              <p>State</p>
            </div>
            <div>
              <StateDropdown
                value={issue?.state_id || ""}
                onChange={handleState}
                projectId={issue.project_id}
                disabled={disableUserActions}
                buttonVariant="background-with-text"
              />
            </div>
          </div>

          {/* assignee */}
          <div className="flex w-full items-center gap-2">
            <div className="flex w-40 flex-shrink-0 items-center gap-2 text-sm">
              <UserGroupIcon className="h-4 w-4 flex-shrink-0" />
              <p>Assignees</p>
            </div>
            <div className="h-5 sm:w-1/2">
              <ProjectMemberDropdown
                value={issue.assignee_ids}
                onChange={handleAssignee}
                disabled={disableUserActions}
                projectId={projectId?.toString() ?? ""}
                placeholder="Assignees"
                multiple
                buttonVariant={issue.assignee_ids?.length > 0 ? "transparent-without-text" : "background-with-text"}
                buttonClassName={issue.assignee_ids?.length > 0 ? "hover:bg-transparent px-0" : ""}
              />
            </div>
          </div>

          {/* priority */}
          <div className="flex w-full items-center gap-2">
            <div className="flex w-40 flex-shrink-0 items-center gap-2 text-sm">
              <Signal className="h-4 w-4 flex-shrink-0" />
              <p>Priority</p>
            </div>
            <div className="h-5">
              <PriorityDropdown
                value={issue.priority || ""}
                onChange={handlePriority}
                disabled={disableUserActions}
                buttonVariant="background-with-text"
              />
            </div>
          </div>

          {/* estimate */}
          {isEstimateEnabled && (
            <div className="flex w-full items-center gap-2">
              <div className="flex w-40 flex-shrink-0 items-center gap-2 text-sm">
                <Triangle className="h-4 w-4 flex-shrink-0 " />
                <p>Estimate</p>
              </div>
              <div>
                <EstimateDropdown
                  value={issue.estimate_point}
                  onChange={handleEstimate}
                  projectId={issue.project_id}
                  disabled={disableUserActions}
                  buttonVariant="background-with-text"
                />
              </div>
            </div>
          )}

          {/* start date */}
          <div className="flex w-full items-center gap-2">
            <div className="flex w-40 flex-shrink-0 items-center gap-2 text-sm">
              <CalendarDays className="h-4 w-4 flex-shrink-0" />
              <p>Start date</p>
            </div>
            <div>
              <CustomDatePicker
                placeholder="Start date"
                value={issue.start_date}
                onChange={handleStartDate}
                className="!rounded border-none bg-custom-background-80 !px-2.5 !py-0.5"
                maxDate={maxDate ?? undefined}
                disabled={disableUserActions}
              />
            </div>
          </div>

          {/* due date */}
          <div className="flex w-full items-center gap-2">
            <div className="flex w-40 flex-shrink-0 items-center gap-2 text-sm">
              <CalendarDays className="h-4 w-4 flex-shrink-0" />
              <p>Due date</p>
            </div>
            <div>
              <CustomDatePicker
                placeholder="Due date"
                value={issue.target_date}
                onChange={handleTargetDate}
                className="!rounded border-none bg-custom-background-80 !px-2.5 !py-0.5"
                minDate={minDate ?? undefined}
                disabled={disableUserActions}
              />
            </div>
          </div>

          {/* parent */}
          <div className="flex w-full items-center gap-2">
            <div className="flex w-40 flex-shrink-0 items-center gap-2 text-sm">
              <LayoutPanelTop className="h-4 w-4 flex-shrink-0" />
              <p>Parent</p>
            </div>
            <div>
              <IssueParentSelect
                workspaceSlug={workspaceSlug?.toString() ?? ""}
                projectId={projectId?.toString() ?? ""}
                issueId={issue?.id}
                issueOperations={issueOperations}
                disabled={disableUserActions}
              />
            </div>
          </div>
        </div>

        <span className="border-t border-custom-border-200" />

        <div className="flex w-full flex-col gap-5 py-5">
          {projectDetails?.cycle_view && (
            <div className="flex w-full items-center gap-2">
              <div className="flex w-40 flex-shrink-0 items-center gap-2 text-sm">
                <ContrastIcon className="h-4 w-4 flex-shrink-0" />
                <p>Cycle</p>
              </div>
              <div>
                <IssueCycleSelect
                  workspaceSlug={workspaceSlug?.toString() ?? ""}
                  projectId={projectId?.toString() ?? ""}
                  issueId={issue?.id}
                  issueOperations={issueOperations}
                  disabled={disableUserActions}
                />
              </div>
            </div>
          )}

          {projectDetails?.module_view && (
            <div className="flex w-full items-center gap-2">
              <div className="flex w-40 flex-shrink-0 items-center gap-2 text-sm">
                <DiceIcon className="h-4 w-4 flex-shrink-0" />
                <p>Module</p>
              </div>
              <div>
                <IssueModuleSelect
                  workspaceSlug={workspaceSlug?.toString() ?? ""}
                  projectId={projectId?.toString() ?? ""}
                  issueId={issue?.id}
                  issueOperations={issueOperations}
                  disabled={disableUserActions}
                />
              </div>
            </div>
          )}

          <div className="flex w-full items-start gap-2">
            <div className="flex w-40 flex-shrink-0 items-center gap-2 text-sm">
              <Tag className="h-4 w-4 flex-shrink-0" />
              <p>Label</p>
            </div>
            <div className="flex w-full flex-col gap-3">
              <IssueLabel
                workspaceSlug={workspaceSlug?.toString() ?? ""}
                projectId={projectId?.toString() ?? ""}
                issueId={issue?.id}
                disabled={uneditable}
              />
            </div>
          </div>
        </div>

        <span className="border-t border-custom-border-200" />

        <div className="w-full pt-3">
          <IssueLinkRoot
            workspaceSlug={workspaceSlug?.toString() ?? ""}
            projectId={projectId?.toString() ?? ""}
            issueId={issue?.id}
          />
        </div>
      </div>
    </>
  );
});
